import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    const updated = await prisma.cateringRequest.update({
      where: { id },
      data: {
        status: "DEPOSIT_PAID",
        depositPaidAt: new Date(),
      },
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