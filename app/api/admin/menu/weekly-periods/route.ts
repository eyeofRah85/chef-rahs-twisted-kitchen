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

export async function POST(request: Request) {
  try {
    const { session, response } = await requireAdminApi();
    if (response) return response;

    const formData = await request.formData();
    const parsedData = parseWeeklyMenuPeriodForm(formData);
    const settings = await getBusinessSettings();
    const data = fillWeeklyPeriodScheduleDefaults({
      period: parsedData,
      settings,
      timeZone: weeklyMenuTimeZone,
    });
    const hasOverlap = await hasPublishedWeeklyMenuOverlap(data);

    if (hasOverlap) {
      return NextResponse.json(
        { error: "Another published weekly menu overlaps this date range." },
        { status: 400 },
      );
    }

    const created = await prisma.weeklyMenuPeriod.create({
      data,
      select: {
        id: true,
      },
    });

    revalidateWeeklyMenuAdminPages();

    await writeAdminAuditLog({
      session,
      action: "WEEKLY_MENU_PERIOD_CREATED",
      entityType: "WeeklyMenuPeriod",
      entityId: created.id,
      metadata: { status: data.status },
    });

    return NextResponse.json(created);
  } catch (error) {
    if (isWeeklyMenuValidationError(error)) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    console.error(error);

    return NextResponse.json(
      { error: "Failed to create weekly menu." },
      { status: 500 },
    );
  }
}
