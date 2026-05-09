import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

    const {
      items,
      checkout,
      subtotal,
      deliveryFee,
      lateFee,
      tipAmount,
      total,
    } = body;

    if (!items?.length) {
      return NextResponse.json(
        { error: "Order contains no items." },
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

        items: {
        create: items.map((item: any) => ({
          menuItemId: item.menuItemId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          lineTotal: item.price * item.quantity,
          notes: item.selectedOptions?.length
            ? item.selectedOptions
                .map(
                  (option: any) =>
                    `${option.groupName}: ${option.choiceName}${
                      option.priceDelta > 0
                        ? ` (+$${option.priceDelta.toFixed(2)})`
                        : ""
                    }`,
                )
                .join("\n")
            : null,
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