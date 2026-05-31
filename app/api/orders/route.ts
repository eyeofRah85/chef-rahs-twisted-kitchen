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

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { items, checkout } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Order must include at least one item." },
        { status: 400 },
      );
    }

    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
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
    const requiresApproval = items.some((item: any) => item.requiresApproval);

    if (checkout.requestedDateTime) {
      const requestedDate = new Date(checkout.requestedDateTime);

      const validation = await validateServerRequestedDate(requestedDate);

      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 },
        );
      }
    }

    if (checkout.orderType === "delivery") {
      if (
        !checkout.name ||
        !checkout.phone ||
        !checkout.addressLine1 ||
        !checkout.city ||
        !checkout.state ||
        !checkout.postalCode
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
      const allowedOrderTypes = ["delivery", "pickup"];

      if (!allowedOrderTypes.includes(checkout.orderType)) {
        return NextResponse.json(
          { error: "Invalid order type." },
          { status: 400 },
        );
      }
    const order = await prisma.order.create({
      data: {
        user: {
          connect: {
            email: session.user.email,
          },
        },

        customerName: checkout.name || session.user.name || "Customer",
        customerEmail: session.user.email,

        orderType: checkout.orderType.toUpperCase(),

        status: requiresApproval ? "PENDING" : "ACCEPTED",
        approvalStatus: requiresApproval ? "PENDING" : "APPROVED",
        approvedAt: requiresApproval ? null : new Date(),

        requestedDateTime: checkout.requestedDateTime
          ? new Date(checkout.requestedDateTime)
          : null,

        allergyNotes: checkout.allergyNotes,
        substitutionPreference: checkout.substitutionPreference,

        subtotal,
        deliveryFee,
        lateFee,
        tipAmount,
        total,

        deliveryName: checkout.name || session.user.name || null,
        deliveryPhone: checkout.phone || null,
        deliveryAddressLine1: checkout.addressLine1 || null,
        deliveryAddressLine2: checkout.addressLine2 || null,
        deliveryCity: checkout.city || null,
        deliveryState: checkout.state || null,
        deliveryPostalCode: checkout.postalCode || null,
        deliveryNotes: checkout.deliveryNotes || null,

        payByDate: checkout.payByDate ? new Date(checkout.payByDate) : null,
        paymentProvider: checkout.paymentMethod,
        paymentStatus:
          checkout.paymentMethod === "cash"
            ? "OFFLINE_PAYMENT_DUE"
            : "PAY_BY_DATE",

        items: {
          create: items.map((item: any) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            lineTotal: item.price * item.quantity,
            notes:
              [
                ...(item.selectedOptions?.length
                  ? item.selectedOptions.map(
                      (option: any) =>
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
            name: checkout.name || session.user.name || null,
            phone: checkout.phone || null,
            addressLine1: checkout.addressLine1 || null,
            addressLine2: checkout.addressLine2 || null,
            city: checkout.city || null,
            state: checkout.state || null,
            postalCode: checkout.postalCode || null,
            deliveryNotes: checkout.deliveryNotes || null,
          },
        });
      }
    } catch (profileError) {
      console.error("Failed to save checkout contact info to profile", profileError);
    }

    // email section
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

        items: order.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          lineTotal: Number(item.lineTotal),
          notes: item.notes,
        })),
      }),
      });
    // end email section
    if (checkout.orderType === "delivery") {
      if (
        !checkout.addressLine1 ||
        !checkout.city ||
        !checkout.state ||
        !checkout.postalCode ||
        !checkout.phone
      ) {
        return NextResponse.json(
          {
            error:
              "Delivery orders require phone number, address, city, state, and postal code.",
          },
          { status: 400 },
        );
      }
    }
    return NextResponse.json(order);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create order." },
      { status: 500 },
    );
  }
}