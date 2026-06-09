import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { sendAppEmail, appUrl } from "@/lib/email";
import { CateringDepositPaidEmail } from "@/emails/CateringDepositPaidEmail";
import { formatServiceRequestType } from "@/lib/format-labels";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const paidAt = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.cateringRequest.updateMany({
        where: {
          id,
          depositAmount: {
            gt: 0,
          },
          depositPaidAt: null,
          approvalStatus: {
            not: "DENIED",
          },
          status: {
            notIn: ["COMPLETED", "CANCELLED"],
          },
        },
        data: {
          status: "DEPOSIT_PAID",
          depositPaidAt: paidAt,
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
          depositAmount: true,
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

      if (existingRequest.approvalStatus === "DENIED") {
        return NextResponse.json(
          { error: "Denied service requests cannot accept deposits." },
          { status: 409 },
        );
      }

      if (existingRequest.status === "COMPLETED") {
        return NextResponse.json(
          { error: "Completed service requests cannot accept deposits." },
          { status: 409 },
        );
      }

      if (existingRequest.status === "CANCELLED") {
        return NextResponse.json(
          { error: "Cancelled service requests cannot accept deposits." },
          { status: 409 },
        );
      }

      const depositAmount = existingRequest.depositAmount
        ? Number(existingRequest.depositAmount)
        : null;

      if (depositAmount === null) {
        return NextResponse.json(
          { error: "Set a deposit amount before marking it as paid." },
          { status: 400 },
        );
      }

      if (depositAmount <= 0) {
        return NextResponse.json(
          { error: "No deposit is due for this service request." },
          { status: 400 },
        );
      }

      if (existingRequest.depositPaidAt) {
        return NextResponse.json(
          { error: "This deposit has already been marked as paid." },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: "Failed to mark deposit as paid." },
        { status: 409 },
      );
    }

    const requestLabel = formatServiceRequestType(updated.requestType);
    const requestLabelLower = requestLabel.toLowerCase();

    await sendAppEmail({
      to: updated.email,
      subject: `Your ${requestLabelLower} deposit has been received`,
      react: CateringDepositPaidEmail({
        customerName: updated.name,
        requestType: updated.requestType,
        eventType: updated.eventType ?? `${requestLabel} Request`,
        depositAmount: updated.depositAmount ? Number(updated.depositAmount) : 0,
        paidAt: updated.depositPaidAt
          ? updated.depositPaidAt.toLocaleString()
          : paidAt.toLocaleString(),
        requestUrl: `${appUrl}/account/catering/${updated.id}`,
      }),
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to mark deposit as paid." },
      { status: 500 },
    );
  }
}
