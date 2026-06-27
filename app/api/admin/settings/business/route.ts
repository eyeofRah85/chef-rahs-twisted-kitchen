import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAdminAuditLog } from "@/lib/admin-audit-log";
import { requireAdminApi } from "@/lib/auth-guards";
export async function PATCH(request: Request) {
  try {
    const { session, response } = await requireAdminApi();
    if (response) return response;

    const formData = await request.formData();

    const deliveryFee = Number(formData.get("deliveryFee") ?? 10);
    const lateFee = Number(formData.get("lateFee") ?? 10);
    const cateringDepositPercent = Number(
      formData.get("cateringDepositPercent") ?? 50,
    );
    const orderCutoffDay = Number(formData.get("orderCutoffDay") ?? 4);
    const orderCutoffHour = Number(formData.get("orderCutoffHour") ?? 17);
    const orderCutoffMinute = Number(formData.get("orderCutoffMinute") ?? 0);
    const deliveryArea = String(formData.get("deliveryArea") ?? "").trim();
    const noWeekendOrdering = formData.get("noWeekendOrdering") === "on";

    const updated = await prisma.businessSettings.upsert({
      where: {
        id: "business-settings",
      },
      update: {
        deliveryFee: Number.isNaN(deliveryFee) ? 10 : deliveryFee,
        lateFee: Number.isNaN(lateFee) ? 10 : lateFee,
        cateringDepositPercent: Number.isNaN(cateringDepositPercent)
          ? 50
          : cateringDepositPercent,
        orderCutoffDay: Number.isNaN(orderCutoffDay) ? 4 : orderCutoffDay,
        orderCutoffHour: Number.isNaN(orderCutoffHour) ? 17 : orderCutoffHour,
        orderCutoffMinute: Number.isNaN(orderCutoffMinute)
          ? 0
          : orderCutoffMinute,
        deliveryArea: deliveryArea || null,
        noWeekendOrdering,
      },
      create: {
        id: "business-settings",
        deliveryFee: Number.isNaN(deliveryFee) ? 10 : deliveryFee,
        lateFee: Number.isNaN(lateFee) ? 10 : lateFee,
        cateringDepositPercent: Number.isNaN(cateringDepositPercent)
          ? 50
          : cateringDepositPercent,
        orderCutoffDay: Number.isNaN(orderCutoffDay) ? 4 : orderCutoffDay,
        orderCutoffHour: Number.isNaN(orderCutoffHour) ? 17 : orderCutoffHour,
        orderCutoffMinute: Number.isNaN(orderCutoffMinute)
          ? 0
          : orderCutoffMinute,
        deliveryArea: deliveryArea || null,
        noWeekendOrdering,
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
