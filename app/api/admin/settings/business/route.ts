import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAdminAuditLog } from "@/lib/admin-audit-log";
import { requireAdminApi } from "@/lib/auth-guards";

function parseNumber(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value ?? fallback);

  return Number.isNaN(parsed) ? fallback : parsed;
}

function clampWholeNumber(value: number, minimum: number, maximum: number) {
  if (!Number.isFinite(value)) return minimum;

  return Math.min(Math.max(Math.trunc(value), minimum), maximum);
}

function parseTime(value: FormDataEntryValue | null, fallbackHour: number) {
  const text = String(value ?? "").trim();
  const match = /^(\d{2}):(\d{2})$/.exec(text);

  if (!match) {
    return {
      hour: fallbackHour,
      minute: 0,
    };
  }

  return {
    hour: clampWholeNumber(Number(match[1]), 0, 23),
    minute: clampWholeNumber(Number(match[2]), 0, 59),
  };
}

function formatTime(hour: number, minute: number) {
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
}

export async function PATCH(request: Request) {
  try {
    const { session, response } = await requireAdminApi();
    if (response) return response;

    const formData = await request.formData();

    const deliveryFee = parseNumber(formData.get("deliveryFee"), 10);
    const lateFee = parseNumber(formData.get("lateFee"), 10);
    const cateringDepositPercent = parseNumber(
      formData.get("cateringDepositPercent"),
      50,
    );
    const orderCutoffDay = clampWholeNumber(
      parseNumber(formData.get("orderCutoffDay"), 4),
      0,
      6,
    );
    const orderCutoffHour = clampWholeNumber(
      parseNumber(formData.get("orderCutoffHour"), 17),
      0,
      23,
    );
    const orderCutoffMinute = clampWholeNumber(
      parseNumber(formData.get("orderCutoffMinute"), 0),
      0,
      59,
    );
    const deliveryArea = String(formData.get("deliveryArea") ?? "").trim();
    const noWeekendOrdering = formData.get("noWeekendOrdering") === "on";
    const checkoutFixedFulfillmentTime = parseTime(
      formData.get("checkoutFixedFulfillmentTime"),
      12,
    );
    const checkoutFixedFulfillmentMessage = String(
      formData.get("checkoutFixedFulfillmentMessage") ?? "",
    ).trim();
    const weeklyOrderingOpenTime = parseTime(
      formData.get("weeklyOrderingOpenTime"),
      0,
    );
    const weeklyLateFeeStartTime = parseTime(
      formData.get("weeklyLateFeeStartTime"),
      17,
    );
    const weeklyOrderingCloseTime = parseTime(
      formData.get("weeklyOrderingCloseTime"),
      22,
    );
    const weeklyFixedFulfillmentTime = parseTime(
      formData.get("weeklyFixedFulfillmentTime"),
      12,
    );
    const weeklyFixedFulfillmentMessage = String(
      formData.get("weeklyFixedFulfillmentMessage") ?? "",
    ).trim();
    const data = {
      deliveryFee,
      lateFee,
      cateringDepositPercent: clampWholeNumber(cateringDepositPercent, 0, 100),
      orderCutoffDay,
      orderCutoffHour,
      orderCutoffMinute,
      deliveryArea: deliveryArea || null,
      noWeekendOrdering,
      checkoutCustomerSchedulingEnabled:
        formData.get("checkoutCustomerSchedulingEnabled") === "on",
      checkoutFixedFulfillmentDay: clampWholeNumber(
        parseNumber(formData.get("checkoutFixedFulfillmentDay"), 0),
        0,
        6,
      ),
      checkoutFixedFulfillmentHour: checkoutFixedFulfillmentTime.hour,
      checkoutFixedFulfillmentMinute: checkoutFixedFulfillmentTime.minute,
      checkoutFixedFulfillmentMessage:
        checkoutFixedFulfillmentMessage || "Orders are fulfilled on Sunday.",
      weeklyCustomerSchedulingEnabled:
        formData.get("weeklyCustomerSchedulingEnabled") === "on",
      weeklyOrderingOpenDay: clampWholeNumber(
        parseNumber(formData.get("weeklyOrderingOpenDay"), 3),
        0,
        6,
      ),
      weeklyOrderingOpenHour: weeklyOrderingOpenTime.hour,
      weeklyOrderingOpenMinute: weeklyOrderingOpenTime.minute,
      weeklyLateFeeStartDay: clampWholeNumber(
        parseNumber(formData.get("weeklyLateFeeStartDay"), 5),
        0,
        6,
      ),
      weeklyLateFeeStartHour: weeklyLateFeeStartTime.hour,
      weeklyLateFeeStartMinute: weeklyLateFeeStartTime.minute,
      weeklyOrderingCloseDay: clampWholeNumber(
        parseNumber(formData.get("weeklyOrderingCloseDay"), 5),
        0,
        6,
      ),
      weeklyOrderingCloseHour: weeklyOrderingCloseTime.hour,
      weeklyOrderingCloseMinute: weeklyOrderingCloseTime.minute,
      weeklyFixedFulfillmentDay: clampWholeNumber(
        parseNumber(formData.get("weeklyFixedFulfillmentDay"), 0),
        0,
        6,
      ),
      weeklyFixedFulfillmentHour: weeklyFixedFulfillmentTime.hour,
      weeklyFixedFulfillmentMinute: weeklyFixedFulfillmentTime.minute,
      weeklyFixedFulfillmentMessage:
        weeklyFixedFulfillmentMessage ||
        "Weekly meal plan orders are delivered on Sunday.",
    };

    const updated = await prisma.businessSettings.upsert({
      where: {
        id: "business-settings",
      },
      update: data,
      create: {
        id: "business-settings",
        ...data,
      },
    });

    await writeAdminAuditLog({
      session,
      action: "BUSINESS_SETTINGS_UPDATED",
      entityType: "BusinessSettings",
      entityId: updated.id,
      metadata: {
        deliveryFee: Number(updated.deliveryFee),
        lateFee: Number(updated.lateFee),
        cateringDepositPercent: updated.cateringDepositPercent,
        noWeekendOrdering: updated.noWeekendOrdering,
        checkoutCustomerSchedulingEnabled:
          updated.checkoutCustomerSchedulingEnabled,
        checkoutFixedFulfillmentTime: formatTime(
          updated.checkoutFixedFulfillmentHour,
          updated.checkoutFixedFulfillmentMinute,
        ),
        weeklyCustomerSchedulingEnabled:
          updated.weeklyCustomerSchedulingEnabled,
        weeklyOrderingOpenTime: formatTime(
          updated.weeklyOrderingOpenHour,
          updated.weeklyOrderingOpenMinute,
        ),
        weeklyLateFeeStartTime: formatTime(
          updated.weeklyLateFeeStartHour,
          updated.weeklyLateFeeStartMinute,
        ),
        weeklyOrderingCloseTime: formatTime(
          updated.weeklyOrderingCloseHour,
          updated.weeklyOrderingCloseMinute,
        ),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update business settings." },
      { status: 500 },
    );
  }
}
