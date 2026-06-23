import { NextResponse } from "next/server";
import { writeAdminAuditLog } from "@/lib/admin-audit-log";
import { requireAdminApi } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { hasPublishedWeeklyMenuOverlap } from "@/lib/weekly-menu-admin";
import {
  isWeeklyMenuValidationError,
  parseWeeklyMenuPeriodForm,
} from "@/lib/weekly-menu-validation";
import { revalidateWeeklyMenuAdminPages } from "@/lib/weekly-menu-revalidation";

export async function POST(request: Request) {
  try {
    const { session, response } = await requireAdminApi();
    if (response) return response;

    const formData = await request.formData();
    const data = parseWeeklyMenuPeriodForm(formData);
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
