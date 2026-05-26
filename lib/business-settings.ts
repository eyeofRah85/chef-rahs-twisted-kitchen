import { prisma } from "@/lib/prisma";

const SETTINGS_SINGLETON_ID = "business-settings";

export async function getBusinessSettings() {
  const settings = await prisma.businessSettings.upsert({
    where: {
      id: SETTINGS_SINGLETON_ID,
    },
    update: {},
    create: {
      id: SETTINGS_SINGLETON_ID,
    },
  });

  return {
    id: settings.id,
    deliveryFee: Number(settings.deliveryFee),
    lateFee: Number(settings.lateFee),
    cateringDepositPercent: settings.cateringDepositPercent,
    orderCutoffDay: settings.orderCutoffDay,
    orderCutoffHour: settings.orderCutoffHour,
    orderCutoffMinute: settings.orderCutoffMinute,
    noWeekendOrdering: settings.noWeekendOrdering,
    deliveryArea: settings.deliveryArea,
  };
}