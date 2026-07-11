export const weeklyMealSlotLabelSuggestions = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Meal 1",
  "Meal 2",
  "Meal 3",
] as const;

export function defaultWeeklyMealSlotLabel(mealNumber: number) {
  return `Meal ${mealNumber}`;
}

export function normalizeWeeklyMealSlotLabels(
  value: unknown,
  mealsPerDay: number,
) {
  const source = Array.isArray(value) ? value : [];

  return Array.from({ length: mealsPerDay }, (_, index) => {
    const label = String(source[index] ?? "").trim();

    return label || defaultWeeklyMealSlotLabel(index + 1);
  });
}

export function labelForWeeklyMealSlot(
  value: unknown,
  mealNumber: number,
) {
  return normalizeWeeklyMealSlotLabels(value, mealNumber)[mealNumber - 1];
}
