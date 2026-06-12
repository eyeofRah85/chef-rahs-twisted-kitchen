const mealPlanCustomerOptionGroupNames = [
  "Spice Level",
  "Protein Substitution",
] as const;

export function isMealPlanCustomerOptionGroup(groupName: string) {
  return mealPlanCustomerOptionGroupNames.includes(
    groupName as (typeof mealPlanCustomerOptionGroupNames)[number],
  );
}

export function filterMealPlanCustomerOptionGroups<
  T extends {
    name: string;
  },
>(itemType: string | null | undefined, optionGroups: T[]) {
  if (itemType !== "MEAL_PLAN") {
    return optionGroups;
  }

  return optionGroups.filter((group) =>
    isMealPlanCustomerOptionGroup(group.name),
  );
}
