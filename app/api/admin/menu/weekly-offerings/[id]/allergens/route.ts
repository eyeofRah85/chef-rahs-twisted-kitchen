import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { revalidateWeeklyMenuAdminPages } from "@/lib/weekly-menu-revalidation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { response } = await requireAdminApi();
    if (response) return response;

    const { id } = await context.params;
    const body = (await request.json()) as {
      allergenIds?: unknown;
    };

    const submittedAllergenIds = body.allergenIds ?? [];

    if (
      !Array.isArray(submittedAllergenIds) ||
      submittedAllergenIds.some((allergenId) => typeof allergenId !== "string")
    ) {
      return NextResponse.json(
        { error: "Allergen IDs must be provided as strings." },
        { status: 400 },
      );
    }

    const trimmedAllergenIds = submittedAllergenIds.map((allergenId) =>
      allergenId.trim(),
    );

    if (trimmedAllergenIds.some((allergenId) => !allergenId)) {
      return NextResponse.json(
        { error: "Allergen IDs must be non-empty strings." },
        { status: 400 },
      );
    }

    const allergenIds = Array.from(new Set(trimmedAllergenIds));
    const [offering, validAllergens] = await Promise.all([
      prisma.weeklyMealPlanOffering.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
        },
      }),
      prisma.allergen.findMany({
        where: {
          id: {
            in: allergenIds,
          },
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (!offering) {
      return NextResponse.json(
        { error: "Weekly meal plan offering not found." },
        { status: 404 },
      );
    }

    if (validAllergens.length !== allergenIds.length) {
      return NextResponse.json(
        { error: "One or more allergens were not found." },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.allergenWeeklyMealPlanOffering.deleteMany({
        where: {
          offeringId: id,
        },
      });

      if (allergenIds.length > 0) {
        await tx.allergenWeeklyMealPlanOffering.createMany({
          data: allergenIds.map((allergenId) => ({
            offeringId: id,
            allergenId,
          })),
        });
      }
    });

    revalidateWeeklyMenuAdminPages();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to assign weekly meal plan allergens." },
      { status: 500 },
    );
  }
}
