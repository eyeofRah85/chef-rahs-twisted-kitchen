export function formatOrderScheduleDateTime(
  requestedDateTime: Date | string | null,
) {
  if (!requestedDateTime) {
    return "Not provided";
  }

  return new Date(requestedDateTime).toLocaleString();
}

export function getOrderScheduleLabel(hasWeeklyMealPlan: boolean) {
  return hasWeeklyMealPlan ? "Weekly fulfillment" : "Fulfillment";
}
