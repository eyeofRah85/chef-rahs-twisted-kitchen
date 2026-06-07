import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { parseEnumValue } from "@/lib/enum-values";
import { cateringStatuses } from "@/lib/prisma-enums";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();

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
