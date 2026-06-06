import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { calculateTip } from "@/lib/order-calculations";
import {
  calculateServerDeliveryFee,
  calculateServerLateFee,
  validateServerRequestedDate,
} from "@/lib/server-business-rules";
import { sendAppEmail, appUrl } from "@/lib/email";
import { OrderConfirmationEmail } from "@/emails/OrderConfirmationEmail";
import type { CartItem } from "@/store/cart-store";
import type { CheckoutDetails } from "@/types/order";
import type { DecimalLike } from "@/types/display";

type CreateOrderRequest = {
  items?: CartItem[];
  checkout?: CheckoutDetails;
};

type CreatedOrderItem = {
  name: string;
  quantity: number;
  unitPrice: DecimalLike;
  lineTotal: DecimalLike;
  notes: string | null;
};

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { items, checkout } = (await request.json()) as CreateOrderRequest;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Order must include at least one item." },
        { status: 400 },
      );
    }

    if (!checkout) {
      return NextResponse.json(
        { error: "Checkout details are required." },
        { status: 400 },
      );
    }

    const allowedOrderTypes = ["delivery", "pickup"];

    if (!allowedOrderTypes.includes(checkout.orderType)) {
      return NextResponse.json(
        { error: "Invalid order type." },
        { status: 400 },
      );
    }

    if (checkout.paymentMethod !== "manual" && checkout.paymentMethod !== "cash") {
      return NextResponse.json(
        { error: "Invalid payment method." },
        { status: 400 },
      );
    }

    const contact = {
      name: String(checkout.name ?? "").trim(),
      phone: String(checkout.phone ?? "").trim(),
      addressLine1: String(checkout.addressLine1 ?? "").trim(),
      addressLine2: String(checkout.addressLine2 ?? "").trim(),
      city: String(checkout.city ?? "").trim(),
      state: String(checkout.state ?? "").trim(),
      postalCode: String(checkout.postalCode ?? "").trim(),
      deliveryNotes: String(checkout.deliveryNotes ?? "").trim(),
    };

    const allergyNotes = String(checkout.allergyNotes ?? "").trim();
    const substitutionPreference = String(
      checkout.substitutionPreference ?? "",
    ).trim();

    if (!checkout.requestedDateTime) {
      return NextResponse.json(
        { error: "Please choose a requested date and time." },
        { status: 400 },
      );
    }

    const requestedDate = new Date(checkout.requestedDateTime);

    if (Number.isNaN(requestedDate.getTime())) {
      return NextResponse.json(
        { error: "Please choose a valid requested date and time." },
        { status: 400 },
      );
    }

    const requestedDateValidation = await validateServerRequestedDate(requestedDate);

    if (!requestedDateValidation.valid) {
      return NextResponse.json(
        { error: requestedDateValidation.error },
        { status: 400 },
      );
    }

    if (checkout.orderType === "delivery") {
      if (
        !contact.name ||
        !contact.phone ||
        !contact.addressLine1 ||
        !contact.city ||
        !contact.state ||
        !contact.postalCode
      ) {
        return NextResponse.json(
          {
            error:
              "Delivery orders require name, phone number, address, city, state, and postal code.",
          },
          { status: 400 },
        );
      }
    }

    if (checkout.orderType === "pickup" && (!contact.name || !contact.phone)) {
      return NextResponse.json(
        { error: "Pickup orders require your name and phone number." },
        { status: 400 },
      );
    }

    let payByDate: Date | null = null;

    if (checkout.paymentMethod === "manual") {
      if (!checkout.payByDate) {
        return NextResponse.json(
          { error: "Please choose a pay-by date." },
          { status: 400 },
        );
      }

      payByDate = new Date(checkout.payByDate);

      if (Number.isNaN(payByDate.getTime())) {
        return NextResponse.json(
          { error: "Please choose a valid pay-by date." },
          { status: 400 },
        );
      }
    }

    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const deliveryFee = await calculateServerDeliveryFee(checkout.orderType);
    const lateFee = await calculateServerLateFee();

    const tipAmount = calculateTip(
      subtotal,
      checkout.tipType,
      checkout.customTipAmount,
    );

    const total = subtotal + deliveryFee + lateFee + tipAmount;
    const requiresApproval = items.some((item) => item.requiresApproval);

    const order = await prisma.order.create({
      data: {
        user: {
          connect: {
            email: session.user.email,
          },
        },

        customerName: contact.name || session.user.name || "Customer",
        customerEmail: session.user.email,
        customerPhone: contact.phone || null,

        orderType:
          checkout.orderType === "delivery"
            ? "DELIVERY"
            : "PICKUP",

        status: requiresApproval ? "PENDING" : "ACCEPTED",
        approvalStatus: requiresApproval ? "PENDING" : "APPROVED",
        approvedAt: requiresApproval ? null : new Date(),

        requestedDateTime: requestedDate,

        allergyNotes,
        substitutionPreference,

        subtotal,
        deliveryFee,
        lateFee,
        tipAmount,
        total,

        deliveryName: contact.name || session.user.name || null,
        deliveryPhone: contact.phone || null,
        deliveryAddressLine1: contact.addressLine1 || null,
        deliveryAddressLine2: contact.addressLine2 || null,
        deliveryCity: contact.city || null,
        deliveryState: contact.state || null,
        deliveryPostalCode: contact.postalCode || null,
        deliveryNotes: contact.deliveryNotes || null,

        payByDate,
        paymentProvider: checkout.paymentMethod,
        paymentStatus:
          checkout.paymentMethod === "cash"
            ? "OFFLINE_PAYMENT_DUE"
            : "PAY_BY_DATE",

        items: {
          create: items.map((item) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            lineTotal: item.price * item.quantity,
            notes:
              [
                ...(item.selectedOptions?.length
                  ? item.selectedOptions.map(
                      (option) =>
                        `${option.groupName}: ${option.choiceName}${
                          option.priceDelta > 0
                            ? ` (+$${option.priceDelta.toFixed(2)})`
                            : ""
                        }`,
                    )
                  : []),
                item.customerInstructions
                  ? `Special Instructions: ${item.customerInstructions}`
                  : null,
              ]
                .filter(Boolean)
                .join("\n") || null,
          })),
        },

        statusHistory: {
          create: {
            status: requiresApproval ? "PENDING" : "ACCEPTED",
            note: requiresApproval
              ? "Order created and waiting for approval."
              : "Order created and auto-approved.",
          },
        },
      },

      include: {
        items: true,
      },
    });

    try {
      if (checkout.saveContactInfo) {
        await prisma.user.update({
          where: {
            email: session.user.email,
          },
          data: {
            name: contact.name || session.user.name || null,
            phone: contact.phone || null,
            addressLine1: contact.addressLine1 || null,
            addressLine2: contact.addressLine2 || null,
            city: contact.city || null,
            state: contact.state || null,
            postalCode: contact.postalCode || null,
            deliveryNotes: contact.deliveryNotes || null,
          },
        });
      }
    } catch (profileError) {
      console.error("Failed to save checkout contact info to profile", profileError);
    }

      await sendAppEmail({
        to: session.user.email,
        subject: "Order Confirmation",
        react: OrderConfirmationEmail({
        customerName: order.customerName,
        orderId: order.id,
        orderType: order.orderType,
        total: Number(order.total),
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.deliveryFee),
        lateFee: Number(order.lateFee),
        tipAmount: Number(order.tipAmount),
        paymentStatus: order.paymentStatus,
        approvalStatus: order.approvalStatus,
        orderUrl: `${appUrl}/orders/${order.id}`,

        deliveryName: order.deliveryName,
        deliveryPhone: order.deliveryPhone,
        deliveryAddressLine1: order.deliveryAddressLine1,
        deliveryAddressLine2: order.deliveryAddressLine2,
        deliveryCity: order.deliveryCity,
        deliveryState: order.deliveryState,
        deliveryPostalCode: order.deliveryPostalCode,
        deliveryNotes: order.deliveryNotes,

        items: order.items.map((item: CreatedOrderItem) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          lineTotal: Number(item.lineTotal),
          notes: item.notes,
        })),
      }),
      });

    return NextResponse.json(order);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create order." },
      { status: 500 },
    );
  }
}
