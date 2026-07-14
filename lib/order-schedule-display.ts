import { DEFAULT_CHECKOUT_FIXED_FULFILLMENT_MESSAGE } from "@/lib/checkout-fulfillment";
import { DEFAULT_WEEKLY_FIXED_MESSAGE } from "@/lib/weekly-ordering-window";

export function formatOrderScheduleDateTime(
  requestedDateTime: Date | string | null,
  options: {
    hasWeeklyMealPlan?: boolean;
    weeklyFulfillmentMessage?: string | null;
    fixedFulfillmentMessage?: string | null;
  } = {},
) {
  if (options.hasWeeklyMealPlan) {
    return (
      options.weeklyFulfillmentMessage?.trim() ||
      DEFAULT_WEEKLY_FIXED_MESSAGE
    );
  }

  if (options.fixedFulfillmentMessage) {
    return (
      options.fixedFulfillmentMessage.trim() ||
      DEFAULT_CHECKOUT_FIXED_FULFILLMENT_MESSAGE
    );
  }

  if (!requestedDateTime) {
    return "Not provided";
  }

  return new Date(requestedDateTime).toLocaleString();
}

export function getOrderScheduleLabel(hasWeeklyMealPlan: boolean) {
  return hasWeeklyMealPlan ? "Weekly fulfillment" : "Fulfillment";
}
