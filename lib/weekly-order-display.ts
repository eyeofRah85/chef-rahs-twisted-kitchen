import type { DecimalLike } from "@/types/display";

export type WeeklyOrderSelectionDisplay = {
  periodLabel: string;
  packageName: string;
  packageDays: number;
  packageMealsPerDay: number;
  packagePrice: DecimalLike;
  offeringName: string;
  spiceLevel?: string | null;
  proteinSubstitution?: string | null;
  requestOnly: boolean;
  requiresApproval: boolean;
  priceDelta: DecimalLike;
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
    {
      label: "Offering",
      value: selection.offeringName,
    },
  ];

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
