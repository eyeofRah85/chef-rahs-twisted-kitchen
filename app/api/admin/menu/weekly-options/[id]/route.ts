import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { writeAdminAuditLog } from "@/lib/admin-audit-log";
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

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { session, response } = await requireAdminApi();
    if (response) return response;

    const { id } = await context.params;
    const existing = await prisma.weeklyMealPlanAllowedOption.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Weekly meal plan option not found." },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const data = parseWeeklyMealPlanOptionForm(formData);

    await prisma.weeklyMealPlanAllowedOption.update({
      where: {
        id,
      },
      data,
      select: {
        id: true,
      },
    });

    revalidateWeeklyMenuAdminPages();

    await writeAdminAuditLog({
      session,
      action: "WEEKLY_MEAL_PLAN_OPTION_UPDATED",
      entityType: "WeeklyMealPlanAllowedOption",
      entityId: id,
    });

    return NextResponse.json({ success: true });
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
      { error: "Failed to update weekly meal plan option." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { session, response } = await requireAdminApi();
    if (response) return response;

    const { id } = await context.params;

    await prisma.weeklyMealPlanAllowedOption.delete({
      where: {
        id,
      },
    });

    revalidateWeeklyMenuAdminPages();

    await writeAdminAuditLog({
      session,
      action: "WEEKLY_MEAL_PLAN_OPTION_DELETED",
      entityType: "WeeklyMealPlanAllowedOption",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Weekly meal plan option not found." },
        { status: 404 },
      );
    }

    console.error(error);

    return NextResponse.json(
      { error: "Failed to delete weekly meal plan option." },
      { status: 500 },
    );
  }
}
