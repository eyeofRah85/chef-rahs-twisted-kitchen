import type { DecimalLike } from "@/types/display";

export type WeeklyOrderSelectionDisplay = {
  periodLabel: string;
  packageName: string;
  packageDays: number;
  packageMealsPerDay: number;
  packagePrice: DecimalLike;
  offeringName?: string | null;
  spiceLevel?: string | null;
  proteinSubstitution?: string | null;
  requestOnly: boolean;
  requiresApproval: boolean;
  priceDelta: DecimalLike;
  mealSlots?: WeeklyOrderMealSlotDisplay[];
};

export type WeeklyOrderMealSlotDisplay = {
  dayNumber: number;
  mealNumber: number;
  offeringName: string;
  dietaryInfo?: string | null;
};

export type WeeklyOrderSelectionDetail = {
  label: string;
  value: string;
};

function formatCurrency(value: DecimalLike) {
  return `$${Number(value).toFixed(2)}`;
}

function pluralizeMeal(count: number) {
  return count === 1 ? "meal" : "meals";
}

export function getWeeklyMealPlanSelectionDetails(
  selection: WeeklyOrderSelectionDisplay,
): WeeklyOrderSelectionDetail[] {
  const details: WeeklyOrderSelectionDetail[] = [
    {
      label: "Weekly Menu",
      value: selection.periodLabel,
    },
    {
      label: "Package",
      value: `${selection.packageName} (${selection.packageDays} days, ${
        selection.packageMealsPerDay
      } ${pluralizeMeal(selection.packageMealsPerDay)} per day)`,
    },
    {
      label: "Package Price",
      value: formatCurrency(selection.packagePrice),
    },
  ];

  const mealSlots = selection.mealSlots ?? [];

  if (mealSlots.length > 0) {
    [...mealSlots]
      .sort((a, b) =>
        a.dayNumber === b.dayNumber
          ? a.mealNumber - b.mealNumber
          : a.dayNumber - b.dayNumber,
      )
      .forEach((slot) => {
        details.push({
          label: `Day ${slot.dayNumber}, Meal ${slot.mealNumber}`,
          value: slot.dietaryInfo
            ? `${slot.offeringName} (${slot.dietaryInfo})`
            : slot.offeringName,
        });
      });
  } else if (selection.offeringName) {
    details.push({
      label: "Offering",
      value: selection.offeringName,
    });
  }

  if (selection.spiceLevel) {
    details.push({
      label: "Spice Level",
      value: selection.spiceLevel,
    });
  }

  if (selection.proteinSubstitution) {
    details.push({
      label: "Protein Substitution",
      value: selection.proteinSubstitution,
    });
  }

  if (Number(selection.priceDelta) > 0) {
    details.push({
      label: "Selection Price Delta",
      value: formatCurrency(selection.priceDelta),
    });
  }

  if (selection.requestOnly) {
    details.push({
      label: "Request Only",
      value: "Yes",
    });
  }

  if (selection.requiresApproval) {
    details.push({
      label: "Chef Approval",
      value: "Required",
    });
  }

  return details;
}
