import { NextResponse } from "next/server";
import { requireAdminApi  } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { hasPublishedWeeklyMenuOverlap } from "@/lib/weekly-menu-admin";
import {
  isWeeklyMenuValidationError,
  parseWeeklyMenuPeriodForm,
} from "@/lib/weekly-menu-validation";
import { revalidateWeeklyMenuAdminPages } from "@/lib/weekly-menu-revalidation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminApi ();

    const { id } = await context.params;
    const existing = await prisma.weeklyMenuPeriod.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Weekly menu not found." },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const data = parseWeeklyMenuPeriodForm(formData);
    const hasOverlap = await hasPublishedWeeklyMenuOverlap({
      ...data,
      excludeId: id,
    });

    if (hasOverlap) {
      return NextResponse.json(
        { error: "Another published weekly menu overlaps this date range." },
        { status: 400 },
      );
    }

    await prisma.weeklyMenuPeriod.update({
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

    console.error(error);

    return NextResponse.json(
      { error: "Failed to update weekly menu." },
      { status: 500 },
    );
  }
}
