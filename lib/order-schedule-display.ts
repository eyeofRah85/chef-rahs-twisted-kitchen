import { DEFAULT_WEEKLY_FIXED_MESSAGE } from "@/lib/weekly-ordering-window";

export function formatOrderScheduleDateTime(
  requestedDateTime: Date | string | null,
  options: {
    hasWeeklyMealPlan?: boolean;
    weeklyFulfillmentMessage?: string | null;
  } = {},
) {
  if (options.hasWeeklyMealPlan) {
    return (
      options.weeklyFulfillmentMessage?.trim() ||
      DEFAULT_WEEKLY_FIXED_MESSAGE
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
