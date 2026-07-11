export const weeklyMealSlotBaseLabelOptions = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
] as const;

export function defaultWeeklyMealSlotLabel(mealNumber: number) {
  return `Meal ${mealNumber}`;
}

export function getWeeklyMealSlotLabelOptions(mealNumber: number) {
  return [
    ...weeklyMealSlotBaseLabelOptions,
    defaultWeeklyMealSlotLabel(mealNumber),
  ];
}

export function isAllowedWeeklyMealSlotLabel(
  label: string,
  mealNumber: number,
) {
  return getWeeklyMealSlotLabelOptions(mealNumber).includes(label);
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
