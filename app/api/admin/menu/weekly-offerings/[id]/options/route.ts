import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import {
  isWeeklyMenuValidationError,
  parseWeeklyMealPlanOptionForm,
} from "@/lib/weekly-menu-validation";
import { revalidateWeeklyMenuAdminPages } from "@/lib/weekly-menu-revalidation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isDuplicateOptionError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { response } = await requireAdminApi();
    if (response) return response;

    const { id } = await context.params;
    const offering = await prisma.weeklyMealPlanOffering.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!offering) {
      return NextResponse.json(
        { error: "Weekly meal plan offering not found." },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const data = parseWeeklyMealPlanOptionForm(formData);
    const created = await prisma.weeklyMealPlanAllowedOption.create({
      data: {
        ...data,
        offeringId: id,
      },
      select: {
        id: true,
      },
    });

    revalidateWeeklyMenuAdminPages();

    return NextResponse.json(created);
  } catch (error) {
    if (isWeeklyMenuValidationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (isDuplicateOptionError(error)) {
      return NextResponse.json(
        {
          error:
            "An option with that type and name already exists for this offering.",
        },
        { status: 400 },
      );
    }

    console.error(error);

    return NextResponse.json(
      { error: "Failed to create weekly meal plan option." },
      { status: 500 },
    );
  }
}
