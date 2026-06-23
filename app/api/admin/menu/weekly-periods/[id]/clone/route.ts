import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import {
  isWeeklyMenuValidationError,
  parseWeeklyMenuCloneForm,
} from "@/lib/weekly-menu-validation";
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
    const formData = await request.formData();
    const data = parseWeeklyMenuCloneForm(formData);

    const source = await prisma.weeklyMenuPeriod.findUnique({
      where: {
        id,
      },
      include: {
        packages: {
          orderBy: [
            {
              displayOrder: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
        },
        offerings: {
          orderBy: [
            {
              displayOrder: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
          include: {
            allergens: true,
            options: {
              orderBy: [
                {
                  optionType: "asc",
                },
                {
                  displayOrder: "asc",
                },
                {
                  createdAt: "asc",
                },
              ],
            },
          },
        },
      },
    });

    if (!source) {
      return NextResponse.json(
        { error: "Weekly menu not found." },
        { status: 404 },
      );
    }

    const cloned = await prisma.$transaction(async (tx) => {
      const createdPeriod = await tx.weeklyMenuPeriod.create({
        data: {
          ...data,
          status: "DRAFT",
          cloneSourceId: source.id,
        },
        select: {
          id: true,
        },
      });

      if (source.packages.length > 0) {
        await tx.weeklyMealPlanPackage.createMany({
          data: source.packages.map((pkg) => ({
            periodId: createdPeriod.id,
            name: pkg.name,
            days: pkg.days,
            mealsPerDay: pkg.mealsPerDay,
            price: pkg.price,
            available: pkg.available,
            displayOrder: pkg.displayOrder,
            notes: pkg.notes,
          })),
        });
      }

      for (const offering of source.offerings) {
        const createdOffering = await tx.weeklyMealPlanOffering.create({
          data: {
            periodId: createdPeriod.id,
            name: offering.name,
            description: offering.description,
            imageUrl: offering.imageUrl,
            dietaryInfo: offering.dietaryInfo,
            available: offering.available,
            displayOrder: offering.displayOrder,
          },
          select: {
            id: true,
          },
        });

        if (offering.allergens.length > 0) {
          await tx.allergenWeeklyMealPlanOffering.createMany({
            data: offering.allergens.map((allergen) => ({
              offeringId: createdOffering.id,
              allergenId: allergen.allergenId,
            })),
          });
        }

        if (offering.options.length > 0) {
          await tx.weeklyMealPlanAllowedOption.createMany({
            data: offering.options.map((option) => ({
              offeringId: createdOffering.id,
              optionType: option.optionType,
              name: option.name,
              description: option.description,
              dietaryInfo: option.dietaryInfo,
              priceDelta: option.priceDelta,
              requestOnly: option.requestOnly,
              requiresApproval: option.requiresApproval,
              available: option.available,
              displayOrder: option.displayOrder,
            })),
          });
        }
      }

      return createdPeriod;
    });

    revalidateWeeklyMenuAdminPages();

    return NextResponse.json(cloned);
  } catch (error) {
    if (isWeeklyMenuValidationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { error: "Failed to clone weekly menu." },
      { status: 500 },
    );
  }
}
