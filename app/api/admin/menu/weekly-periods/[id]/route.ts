import { NextResponse } from "next/server";
import { writeAdminAuditLog } from "@/lib/admin-audit-log";
import { requireAdminApi } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { getBusinessSettings } from "@/lib/business-settings";
import { hasPublishedWeeklyMenuOverlap } from "@/lib/weekly-menu-admin";
import { weeklyMenuTimeZone } from "@/lib/weekly-menu-dates";
import {
  isWeeklyMenuValidationError,
  parseWeeklyMenuPeriodForm,
} from "@/lib/weekly-menu-validation";
import { revalidateWeeklyMenuAdminPages } from "@/lib/weekly-menu-revalidation";
import { fillWeeklyPeriodScheduleDefaults } from "@/lib/weekly-ordering-window";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { session, response } = await requireAdminApi();
    if (response) return response;

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
    const parsedData = parseWeeklyMenuPeriodForm(formData);
    const settings = await getBusinessSettings();
    const data = fillWeeklyPeriodScheduleDefaults({
      period: parsedData,
      settings,
      timeZone: weeklyMenuTimeZone,
    });
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

    await writeAdminAuditLog({
      session,
      action: "WEEKLY_MENU_PERIOD_UPDATED",
      entityType: "WeeklyMenuPeriod",
      entityId: id,
      metadata: { status: data.status },
    });

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
