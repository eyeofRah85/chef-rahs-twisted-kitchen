import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { calculateTip } from "@/lib/order-calculations";
import {
  calculateDeliveryFee,
  calculateLateFee,
} from "@/lib/business-rules";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const { items, checkout } = body;

    if (!items?.length) {
      return NextResponse.json(
        { error: "Order contains no items." },
        { status: 400 },
      );
    }
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0,
    );

    const deliveryFee = calculateDeliveryFee(checkout.orderType);
    const lateFee = calculateLateFee();

    const tipAmount = calculateTip(
      subtotal,
      checkout.tipType,
      checkout.customTipAmount,
    );

    const total = subtotal + deliveryFee + lateFee + tipAmount;
    const requiresApproval = items.some((item: any) => item.requiresApproval);
    const order = await prisma.order.create({
      data: {
        user: {
          connect: {
            email: session.user.email,
            approvalStatus: requiresApproval ? "PENDING" : "APPROVED",
            approvedAt: requiresApproval ? null : new Date(),
          },
        },

        customerName: session.user.name ?? "Customer",
        customerEmail: session.user.email,

        orderType: checkout.orderType.toUpperCase(),

        requestedDateTime: checkout.requestedDateTime
          ? new Date(checkout.requestedDateTime)
          : null,

        allergyNotes: checkout.allergyNotes,
        substitutionPreference:
          checkout.substitutionPreference,

        subtotal,
        deliveryFee,
        lateFee,
        tipAmount,
        total,

        payByDate: checkout.payByDate
          ? new Date(checkout.payByDate)
          : null,

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
          notes: [
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
            status: "PENDING",
            note: "Order created.",
          },
        },
      },

      include: {
        items: true,
      },
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