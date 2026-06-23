import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth-guards";
import { orderStatuses } from "@/lib/prisma-enums";
import { parseEnumValue } from "@/lib/enum-values";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { response } = await requireAdminApi();
    if (response) return response;

    const { id } = await context.params;
    const body = await request.json();

    const status = parseEnumValue(
      orderStatuses,
      typeof body.status === "string" ? body.status : undefined,
    );
    const note = String(body.note ?? "").trim();

    if (!status) {
      return NextResponse.json(
        { error: "Invalid order status." },
        { status: 400 },
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status,
        paymentStatus:
          status === "CANCELLED"
            ? "CANCELLED"
            : status === "REFUNDED"
              ? "REFUNDED"
              : undefined,
        statusHistory: {
          create: {
            status,
            note: note || `Status changed to ${status}.`,
          },
        },
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update order status." },
      { status: 500 },
    );
  }
}
