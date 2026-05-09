import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    const body = await request.json();

    const allergenIds: string[] =
      body.allergenIds ?? [];

    await prisma.menuItemAllergen.deleteMany({
      where: {
        menuItemId: id,
      },
    });

    if (allergenIds.length > 0) {
      await prisma.menuItemAllergen.createMany({
        data: allergenIds.map((allergenId) => ({
          menuItemId: id,
          allergenId,
        })),
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to assign allergens.",
      },
      { status: 500 },
    );
  }
}