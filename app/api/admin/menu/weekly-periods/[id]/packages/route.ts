import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { writeAdminAuditLog } from "@/lib/admin-audit-log";
import { requireAdminApi } from "@/lib/auth-guards";
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

export async function POST(request: Request, context: RouteContext) {
  try {
    const { session, response } = await requireAdminApi();
    if (response) return response;

    const { id } = await context.params;
    const period = await prisma.weeklyMenuPeriod.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!period) {
      return NextResponse.json(
        { error: "Weekly menu not found." },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const data = parseWeeklyMealPlanPackageForm(formData);
    const created = await prisma.weeklyMealPlanPackage.create({
      data: {
        ...data,
        periodId: id,
      },
      select: {
        id: true,
      },
    });

    revalidateWeeklyMenuAdminPages();

    await writeAdminAuditLog({
      session,
      action: "WEEKLY_MEAL_PLAN_PACKAGE_CREATED",
      entityType: "WeeklyMealPlanPackage",
      entityId: created.id,
      metadata: { periodId: id },
    });

    return NextResponse.json(created);
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
      { error: "Failed to create weekly meal plan package." },
      { status: 500 },
    );
  }
}
