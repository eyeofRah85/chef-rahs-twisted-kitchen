import { NextResponse } from "next/server";
import { ApprovalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const body = await request.json();

    const approvalStatus = body.approvalStatus as ApprovalStatus;
    const approvalNote = String(body.approvalNote ?? "").trim();

    if (!Object.values(ApprovalStatus).includes(approvalStatus)) {
      return NextResponse.json({ error: "Invalid approval status." }, { status: 400 });
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update approval." }, { status: 500 });
  }
}