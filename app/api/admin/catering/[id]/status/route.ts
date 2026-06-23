import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth-guards";
import { parseEnumValue } from "@/lib/enum-values";
import { cateringStatuses } from "@/lib/prisma-enums";
import { isTerminalServiceRequestStatus } from "@/lib/service-request-workflow";

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
      cateringStatuses,
      typeof body.status === "string" ? body.status : undefined,
    );

    if (!status) {
      return NextResponse.json(
        { error: "Invalid service request status." },
        { status: 400 },
      );
    }

    const existingRequest = await prisma.cateringRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Service request not found." },
        { status: 404 },
      );
    }

    if (status === existingRequest.status) {
      return NextResponse.json(existingRequest);
    }

    if (isTerminalServiceRequestStatus(existingRequest.status)) {
      return NextResponse.json(
        { error: "Final service requests cannot be updated." },
        { status: 409 },
      );
    }

    if (existingRequest.approvalStatus === "DENIED") {
      return NextResponse.json(
        { error: "Denied service requests cannot be updated." },
        { status: 409 },
      );
    }

    const depositAmount =
      existingRequest.depositAmount === null
        ? null
        : Number(existingRequest.depositAmount);

    if (status === "DEPOSIT_DUE" && (!depositAmount || depositAmount <= 0)) {
      return NextResponse.json(
        { error: "Set a deposit amount before marking deposit due." },
        { status: 400 },
      );
    }

    if (status === "DEPOSIT_PAID" && !existingRequest.depositPaidAt) {
      return NextResponse.json(
        { error: "Use the mark-deposit-paid action to record payment." },
        { status: 400 },
      );
    }

    if (
      status === "COMPLETED" &&
      depositAmount !== null &&
      depositAmount > 0 &&
      !existingRequest.depositPaidAt
    ) {
      return NextResponse.json(
        { error: "Mark the deposit as paid before completing this request." },
        { status: 400 },
      );
    }

    const updated = await prisma.cateringRequest.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update service request status." },
      { status: 500 },
    );
  }
}
