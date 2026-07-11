import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAdminAuditLog } from "@/lib/admin-audit-log";
import { requireAdminApi } from "@/lib/auth-guards";
import { sendAppEmail, appUrl } from "@/lib/email";
import { PaymentReceivedEmail } from "@/emails/PaymentReceivedEmail";

const payableStatuses = ["PAY_BY_DATE", "OFFLINE_PAYMENT_DUE"];

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { session, response } = await requireAdminApi();
    if (response) return response;

    const { id } = await context.params;
    const paidAt = new Date();

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: {
          id,
          paidAt: null,
          paymentStatus: {
            in: payableStatuses,
          },
          status: {
            notIn: ["CANCELLED", "REFUNDED"],
          },
        },
        data: {
          paymentStatus: "PAID",
          paidAt,
        },
      });

      if (result.count === 0) {
        return null;
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: "ACCEPTED",
          note: "Payment manually marked as paid.",
        },
      });

      return tx.order.findUnique({
        where: { id },
      });
    });

    if (!updatedOrder) {
      const existingOrder = await prisma.order.findUnique({
        where: { id },
        select: {
          paidAt: true,
          paymentStatus: true,
          status: true,
        },
      });

      if (!existingOrder) {
        return NextResponse.json(
          { error: "Order not found." },
          { status: 404 },
        );
      }

      if (existingOrder.paidAt || existingOrder.paymentStatus === "PAID") {
        return NextResponse.json(
          { error: "This order has already been marked as paid." },
          { status: 409 },
        );
      }

      if (["CANCELLED", "REFUNDED"].includes(existingOrder.status)) {
        return NextResponse.json(
          { error: "Cancelled or refunded orders cannot be marked as paid." },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { error: "Only orders with payment due can be marked as paid." },
        { status: 400 },
      );
    }

    await sendAppEmail({
      to: updatedOrder.customerEmail,
      subject: "Payment Received",
      react: PaymentReceivedEmail({
        customerName: updatedOrder.customerName,
        orderId: updatedOrder.id,
        total: Number(updatedOrder.total),
        paidAt: updatedOrder.paidAt
          ? updatedOrder.paidAt.toLocaleString()
          : paidAt.toLocaleString(),
        orderUrl: updatedOrder.userId
          ? `${appUrl}/orders/${updatedOrder.id}`
          : null,
      }),
    });

    await writeAdminAuditLog({
      session,
      action: "ORDER_PAYMENT_MARKED_PAID",
      entityType: "Order",
      entityId: updatedOrder.id,
      metadata: { paymentStatus: updatedOrder.paymentStatus },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to mark order as paid." },
      { status: 500 },
    );
  }
}
