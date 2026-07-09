import { getBusinessSettings } from "@/lib/business-settings";
import { calculateLateFeeFromSettings } from "@/lib/business-rules";
import { weeklyMenuTimeZone } from "@/lib/weekly-menu-dates";

export function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export async function calculateServerDeliveryFee(orderType: string) {
  const settings = await getBusinessSettings();

  return orderType === "delivery" ? settings.deliveryFee : 0;
}

export async function calculateServerLateFee() {
  const settings = await getBusinessSettings();

  return calculateLateFeeFromSettings({
    lateFee: settings.lateFee,
    cutoffDay: settings.orderCutoffDay,
    cutoffHour: settings.orderCutoffHour,
    cutoffMinute: settings.orderCutoffMinute,
    timeZone: weeklyMenuTimeZone,
  });
}

export async function validateServerRequestedDate(requestedDate: Date) {
  const settings = await getBusinessSettings();

  if (settings.noWeekendOrdering && isWeekend(requestedDate)) {
    return {
      valid: false,
      error: "Weekend ordering is unavailable.",
    };
  }

  return {
    valid: true,
  };
}

export async function calculateServerCateringDeposit(total: number) {
  const settings = await getBusinessSettings();

  return total * (settings.cateringDepositPercent / 100);
}
