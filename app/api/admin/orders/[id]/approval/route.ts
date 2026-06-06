import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { sendAppEmail, appUrl } from "@/lib/email";
import { OrderApprovalEmail } from "@/emails/OrderApprovalEmail";
import { parseEnumValue } from "@/lib/enum-values";
import { approvalStatuses } from "@/lib/prisma-enums";


type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const body = await request.json();

    const approvalStatus = parseEnumValue(
      approvalStatuses,
      typeof body.approvalStatus === "string"
        ? body.approvalStatus
        : undefined,
    );
    const approvalNote = String(body.approvalNote ?? "").trim();

    if (!approvalStatus) {
      return NextResponse.json({ error: "Invalid approval status." }, { status: 400 });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      select: {
        approvalStatus: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 },
      );
    }

    if (
      existingOrder.approvalStatus === "APPROVED" ||
      existingOrder.approvalStatus === "DENIED"
    ) {
      return NextResponse.json(
        { error: "This order has already received a final approval decision." },
        { status: 400 },
      );
    }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      approvalStatus,
      approvalNote: approvalNote || null,

      approvedAt: approvalStatus === "APPROVED" ? new Date() : null,
      deniedAt: approvalStatus === "DENIED" ? new Date() : null,

      status:
        approvalStatus === "APPROVED"
          ? "ACCEPTED"
          : approvalStatus === "DENIED"
            ? "CANCELLED"
            : "PENDING",

      paymentStatus:
        approvalStatus === "DENIED"
          ? "CANCELLED"
          : undefined,

      statusHistory: {
        create: {
          status:
            approvalStatus === "APPROVED"
              ? "ACCEPTED"
              : approvalStatus === "DENIED"
                ? "CANCELLED"
                : "PENDING",
          note:
            approvalStatus === "APPROVED"
              ? approvalNote || "Order approved."
              : approvalStatus === "DENIED"
                ? approvalNote || "Order denied."
                : approvalNote || "Approval reset to pending.",
        },
      },
    },
  });
    if (approvalStatus === "APPROVED" || approvalStatus === "DENIED") {
        await sendAppEmail({
          to: updated.customerEmail,
          subject:
            approvalStatus === "APPROVED"
              ? "Your order has been approved"
              : "Your order was not approved",
          react: OrderApprovalEmail({
            customerName: updated.customerName,
            orderId: updated.id,
            approved: approvalStatus === "APPROVED",
            orderUrl: `${appUrl}/orders/${updated.id}`,
            approvalNote,
          }),
        });
      }
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update approval." }, { status: 500 });
  }
}
