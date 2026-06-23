import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
<<<<<<< HEAD
import { writeAdminAuditLog } from "@/lib/admin-audit-log";
=======
>>>>>>> security/baseline-hardening
import { requireAdminApi } from "@/lib/auth-guards";
import { calculateServerCateringDeposit } from "@/lib/server-business-rules";
import { sendAppEmail, appUrl } from "@/lib/email";
import { CateringStatusEmail } from "@/emails/CateringStatusEmail";
import { formatServiceRequestType } from "@/lib/format-labels";
import { canEditServiceRequestQuote } from "@/lib/service-request-workflow";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function parseOptionalAmount(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return Number(value);
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
<<<<<<< HEAD
    const { session, response } = await requireAdminApi();
=======
    const { response } = await requireAdminApi();
>>>>>>> security/baseline-hardening
    if (response) return response;

    const { id } = await context.params;
    const body = await request.json();

    const existingRequest = await prisma.cateringRequest.findUnique({
      where: { id },
      select: {
        approvalStatus: true,
        depositPaidAt: true,
        status: true,
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Service request not found." },
        { status: 404 },
      );
    }

    if (
      !canEditServiceRequestQuote({
        approvalStatus: existingRequest.approvalStatus,
        depositPaid: existingRequest.depositPaidAt !== null,
        status: existingRequest.status,
      })
    ) {
      return NextResponse.json(
        { error: "Quote editing is locked for this service request." },
        { status: 409 },
      );
    }

    const estimatedTotal = parseOptionalAmount(body.estimatedTotal);

    if (
      estimatedTotal !== null &&
      (!Number.isFinite(estimatedTotal) || estimatedTotal < 0)
    ) {
      return NextResponse.json(
        { error: "Invalid estimated total." },
        { status: 400 },
      );
    }

    const depositAmount =
      body.depositAmount === null ||
      body.depositAmount === undefined ||
      body.depositAmount === ""
        ? estimatedTotal !== null
          ? await calculateServerCateringDeposit(estimatedTotal)
          : null
        : parseOptionalAmount(body.depositAmount);

    if (
      depositAmount !== null &&
      (!Number.isFinite(depositAmount) || depositAmount < 0)
    ) {
      return NextResponse.json(
        { error: "Invalid deposit amount." },
        { status: 400 },
      );
    }

    const updated = await prisma.cateringRequest.update({
      where: { id },
      data: {
        estimatedTotal,
        depositAmount,
        status: estimatedTotal !== null ? "QUOTED" : undefined,
      },
    });
    const requestLabel = formatServiceRequestType(updated.requestType);
    const requestLabelLower = requestLabel.toLowerCase();

    await sendAppEmail({
      to: updated.email,
      subject: `Your ${requestLabelLower} quote has been updated`,
      react: CateringStatusEmail({
        customerName: updated.name,
        requestType: updated.requestType,
        eventType: updated.eventType ?? `${requestLabel} Request`,
        status: updated.status,
        approvalStatus: updated.approvalStatus,
        approvalNote: updated.approvalNote,
        estimatedTotal:
          updated.estimatedTotal === null
            ? null
            : Number(updated.estimatedTotal),
        depositAmount:
          updated.depositAmount === null ? null : Number(updated.depositAmount),
        requestUrl: `${appUrl}/account/catering/${updated.id}`,
      }),
    });

    await writeAdminAuditLog({
      session,
      action: "SERVICE_REQUEST_QUOTE_UPDATED",
      entityType: "CateringRequest",
      entityId: updated.id,
      metadata: { requestType: updated.requestType, status: updated.status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to save quote." },
      { status: 500 },
    );
  }
}
