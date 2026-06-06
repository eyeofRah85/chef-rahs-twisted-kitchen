import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { sendAppEmail, appUrl } from "@/lib/email";
import { CateringStatusEmail } from "@/emails/CateringStatusEmail";
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


    const existingRequest = await prisma.cateringRequest.findUnique({
      where: { id },
      select: {
        approvalStatus: true,
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Service request not found." },
        { status: 404 },
      );
    }

    if (
      existingRequest.approvalStatus === "APPROVED" ||
      existingRequest.approvalStatus === "DENIED"
    ) {
      return NextResponse.json(
        {
          error:
            "This service request has already received a final approval decision.",
        },
        { status: 400 },
      );
    }

    const updated = await prisma.cateringRequest.update({
      where: { id },
      data: {
        approvalStatus,
        approvalNote: approvalNote || null,
        approvedAt: approvalStatus === "APPROVED" ? new Date() : null,
        deniedAt: approvalStatus === "DENIED" ? new Date() : null,
        status:
          approvalStatus === "APPROVED"
            ? "APPROVED"
            : approvalStatus === "DENIED"
              ? "CANCELLED"
              : undefined,
      },
    });
        await sendAppEmail({
          to: updated.email,
          subject:
            approvalStatus === "APPROVED"
              ? "Your catering request has been approved"
              : "Your catering request was not approved",
          react: CateringStatusEmail({
            customerName: updated.name,
            eventType: updated.eventType ?? "Catering Request",
            status: updated.status,
            approvalStatus: updated.approvalStatus,
            approvalNote,
            estimatedTotal: updated.estimatedTotal
              ? Number(updated.estimatedTotal)
              : null,
            depositAmount: updated.depositAmount
              ? Number(updated.depositAmount)
              : null,
              requestUrl: `${appUrl}/account/catering/${updated.id}`,
          }),
        });    
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update catering approval." }, { status: 500 });
  }
}
