import type { DecimalLike } from "@/types/display";
import { formatWeeklyMealPlanOptionType } from "@/lib/format-labels";
import { DEFAULT_WEEKLY_FIXED_MESSAGE } from "@/lib/weekly-ordering-window";

export type WeeklyOrderSelectionDisplay = {
  periodLabel: string;
  packageName: string;
  packageDays: number;
  packageMealsPerDay: number;
  packagePrice: DecimalLike;
  packageRequiresChefApproval?: boolean;
  packageIsSeasonal?: boolean;
  customerSchedulingEnabled?: boolean;
  fixedFulfillmentAt?: string | Date | null;
  fixedFulfillmentLabel?: string | null;
  deliveryWindowLabel?: string | null;
  orderingOpenAt?: string | Date | null;
  lateFeeStartsAt?: string | Date | null;
  orderingClosesAt?: string | Date | null;
  orderingOpenLabel?: string | null;
  lateFeeStartsLabel?: string | null;
  orderingClosesLabel?: string | null;
  offeringName?: string | null;
  spiceLevel?: string | null;
  proteinSubstitution?: string | null;
  requestOnly?: boolean;
  requiresApproval?: boolean;
  priceDelta: DecimalLike;
  mealSlots?: WeeklyOrderMealSlotDisplay[];
};

export type WeeklyOrderMealSlotDisplay = {
  dayNumber: number;
  mealNumber: number;
  mealLabel?: string | null;
  offeringName: string;
  dietaryInfo?: string | null;
  selectedOptions?: WeeklyOrderMealSlotOptionDisplay[];
};

export type WeeklyOrderMealSlotOptionDisplay = {
  optionType: string;
  optionName: string;
  priceDelta: DecimalLike;
  requestOnly?: boolean;
  requiresApproval?: boolean;
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

function formatSlotOption(option: WeeklyOrderMealSlotOptionDisplay) {
  const badges = [
    Number(option.priceDelta) > 0 ? `+${formatCurrency(option.priceDelta)}` : "",
    option.requestOnly ? "Request Only" : "",
    option.requiresApproval ? "Approval Required" : "",
  ].filter(Boolean);
  const suffix = badges.length ? ` (${badges.join(", ")})` : "";

  return `${formatWeeklyMealPlanOptionType(option.optionType)}: ${
    option.optionName
  }${suffix}`;
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

  if (selection.customerSchedulingEnabled === false) {
    details.push({
      label: "Weekly Fulfillment",
      value:
        selection.deliveryWindowLabel ??
        selection.fixedFulfillmentLabel ??
        DEFAULT_WEEKLY_FIXED_MESSAGE,
    });
  }

  if (mealSlots.length > 0) {
    [...mealSlots]
      .sort((a, b) =>
        a.dayNumber === b.dayNumber
          ? a.mealNumber - b.mealNumber
          : a.dayNumber - b.dayNumber,
      )
      .forEach((slot) => {
        const slotOptions = [...(slot.selectedOptions ?? [])]
          .sort((a, b) => a.optionType.localeCompare(b.optionType))
          .map(formatSlotOption);
        const valueParts = [
          slot.dietaryInfo
            ? `${slot.offeringName} (${slot.dietaryInfo})`
            : slot.offeringName,
          ...slotOptions,
        ];

        details.push({
          label: `Day ${slot.dayNumber} - ${
            slot.mealLabel ?? `Meal ${slot.mealNumber}`
          }`,
          value: valueParts.join(" - "),
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
      value: selection.packageRequiresChefApproval ? "By request" : "Yes",
    });
  }

  if (selection.packageIsSeasonal) {
    details.push({
      label: "Seasonal",
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
