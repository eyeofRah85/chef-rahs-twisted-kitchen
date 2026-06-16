import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import {
  isWeeklyMenuValidationError,
  parseWeeklyMealPlanPackageForm,
} from "@/lib/weekly-menu-validation";
import { revalidateWeeklyMenuAdminPages } from "@/lib/weekly-menu-revalidation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isDuplicatePackageError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const existing = await prisma.weeklyMealPlanPackage.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Weekly meal plan package not found." },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const data = parseWeeklyMealPlanPackageForm(formData);

    await prisma.weeklyMealPlanPackage.update({
      where: {
        id,
      },
      data,
      select: {
        id: true,
      },
    });

    revalidateWeeklyMenuAdminPages();

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isWeeklyMenuValidationError(error)) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    if (isDuplicatePackageError(error)) {
      return NextResponse.json(
        {
          error:
            "A package for that day and meal count already exists for this weekly menu.",
        },
        { status: 400 },
      );
    }

    console.error(error);

    return NextResponse.json(
      { error: "Failed to update weekly meal plan package." },
      { status: 500 },
    );
  }
}
