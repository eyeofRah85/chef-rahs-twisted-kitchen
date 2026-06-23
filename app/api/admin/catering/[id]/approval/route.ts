import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth-guards";
import { sendAppEmail, appUrl } from "@/lib/email";
import { CateringStatusEmail } from "@/emails/CateringStatusEmail";
import { parseEnumValue } from "@/lib/enum-values";
import { approvalStatuses } from "@/lib/prisma-enums";
import { formatServiceRequestType } from "@/lib/format-labels";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { response } = await requireAdminApi();
    if (response) return response;

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

    const nextRequestStatus =
      approvalStatus === "APPROVED"
        ? "APPROVED"
        : approvalStatus === "DENIED"
          ? "CANCELLED"
          : undefined;

    const decidedAt = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.cateringRequest.updateMany({
        where: {
          id,
          approvalStatus: "PENDING",
        },
        data: {
          approvalStatus,
          approvalNote: approvalNote || null,
          approvedAt: approvalStatus === "APPROVED" ? decidedAt : null,
          deniedAt: approvalStatus === "DENIED" ? decidedAt : null,
          status: nextRequestStatus,
        },
      });

      if (result.count === 0) {
        return null;
      }

      return tx.cateringRequest.findUnique({
        where: { id },
      });
    });

    if (!updated) {
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

      return NextResponse.json(
        {
          error:
            "This service request has already received a final approval decision.",
        },
        { status: 400 },
      );
    }

    if (approvalStatus === "APPROVED" || approvalStatus === "DENIED") {
        const requestLabel = formatServiceRequestType(updated.requestType);
        const requestLabelLower = requestLabel.toLowerCase();

        await sendAppEmail({
          to: updated.email,
          subject:
            approvalStatus === "APPROVED"
              ? `Your ${requestLabelLower} request has been approved`
              : `Your ${requestLabelLower} request was not approved`,
          react: CateringStatusEmail({
            customerName: updated.name,
            requestType: updated.requestType,
            eventType: updated.eventType ?? `${requestLabel} Request`,
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
      }
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update service request approval." },
      { status: 500 },
    );
  }
}
