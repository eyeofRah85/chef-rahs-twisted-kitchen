import { parseEnumValue } from "@/lib/enum-values";
import { parsePublicImageUrl } from "@/lib/image-urls";
import {
  getWeeklyMealSlotLabelOptions,
  isAllowedWeeklyMealSlotLabel,
  normalizeWeeklyMealSlotLabels,
} from "@/lib/weekly-package-labels";
import {
  getWeeklyMenuEndBoundary,
  parseWeeklyMenuDateInput,
} from "@/lib/weekly-menu-dates";
import {
  weeklyMealPlanOptionTypes,
  weeklyMenuStatuses,
  type WeeklyMealPlanOptionTypeValue,
  type WeeklyMenuStatusValue,
} from "@/lib/prisma-enums";

export class WeeklyMenuValidationError extends Error {
  name = "WeeklyMenuValidationError";
}

function parseRequiredText(value: FormDataEntryValue | null, fieldName: string) {
  const text = String(value ?? "").trim();

  if (!text) {
    throw new WeeklyMenuValidationError(`${fieldName} is required.`);
  }

  return text;
}

function parseOptionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  return text || null;
}

function parseDateInput(value: FormDataEntryValue | null, fieldName: string) {
  const text = parseRequiredText(value, fieldName);
  const date = parseWeeklyMenuDateInput(text);

  if (!date) {
    throw new WeeklyMenuValidationError(`${fieldName} must be a valid date.`);
  }

  return date;
}

function parseOptionalDateInput(
  value: FormDataEntryValue | null,
  fieldName: string,
) {
  const text = String(value ?? "").trim();

  if (!text) {
    return null;
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    throw new WeeklyMenuValidationError(`${fieldName} must be a valid date.`);
  }

  return date;
}

function parseWholeNumber(
  value: FormDataEntryValue | null,
  fieldName: string,
  minimum: number,
) {
  const parsed = Number(value ?? "");

  if (!Number.isInteger(parsed) || parsed < minimum) {
    throw new WeeklyMenuValidationError(
      `${fieldName} must be a whole number of ${minimum} or more.`,
    );
  }

  return parsed;
}

function parseMoney(value: FormDataEntryValue | null, fieldName: string) {
  const parsed = Number(value ?? "");

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new WeeklyMenuValidationError(`${fieldName} must be zero or more.`);
  }

  return parsed;
}

function parseOptionalPublicImageUrl(value: FormDataEntryValue | null) {
  try {
    return parsePublicImageUrl(value);
  } catch {
    throw new WeeklyMenuValidationError("Enter a valid public image URL.");
  }
}

export function parseWeeklyMenuPeriodForm(formData: FormData) {
  const startDate = parseDateInput(formData.get("startDate"), "Start date");
  const endDate = parseDateInput(formData.get("endDate"), "End date");
  const orderCutoffAt = parseOptionalDateInput(
    formData.get("orderCutoffAt"),
    "Ordering cutoff",
  );
  const status =
    parseEnumValue(weeklyMenuStatuses, String(formData.get("status") ?? "")) ??
    "DRAFT";

  if (endDate < startDate) {
    throw new WeeklyMenuValidationError(
      "End date must be on or after the start date.",
    );
  }

  if (orderCutoffAt && orderCutoffAt > getWeeklyMenuEndBoundary(endDate)) {
    throw new WeeklyMenuValidationError(
      "Ordering cutoff must be before the weekly menu end date.",
    );
  }

  return {
    label: parseRequiredText(formData.get("label"), "Week label"),
    startDate,
    endDate,
    orderCutoffAt,
    fulfillmentNotes: parseOptionalText(formData.get("fulfillmentNotes")),
    status: status as WeeklyMenuStatusValue,
    capacity: parseWholeNumber(formData.get("capacity"), "Capacity", 1),
  };
}

export function parseWeeklyMenuCloneForm(formData: FormData) {
  const startDate = parseDateInput(formData.get("startDate"), "Start date");
  const endDate = parseDateInput(formData.get("endDate"), "End date");
  const orderCutoffAt = parseOptionalDateInput(
    formData.get("orderCutoffAt"),
    "Ordering cutoff",
  );

  if (endDate < startDate) {
    throw new WeeklyMenuValidationError(
      "End date must be on or after the start date.",
    );
  }

  if (orderCutoffAt && orderCutoffAt > getWeeklyMenuEndBoundary(endDate)) {
    throw new WeeklyMenuValidationError(
      "Ordering cutoff must be before the weekly menu end date.",
    );
  }

  return {
    label: parseRequiredText(formData.get("label"), "Week label"),
    startDate,
    endDate,
    orderCutoffAt,
    fulfillmentNotes: parseOptionalText(formData.get("fulfillmentNotes")),
    capacity: parseWholeNumber(formData.get("capacity"), "Capacity", 1),
  };
}

export function parseWeeklyMealPlanPackageForm(formData: FormData) {
  const days = parseWholeNumber(formData.get("days"), "Package days", 1);
  const mealsPerDay = parseWholeNumber(
    formData.get("mealsPerDay"),
    "Meals per day",
    1,
  );

  if (![5, 7].includes(days)) {
    throw new WeeklyMenuValidationError(
      "Weekly packages must be 5-day or 7-day packages.",
    );
  }

  if (mealsPerDay < 1 || mealsPerDay > 4) {
    throw new WeeklyMenuValidationError(
      "Weekly packages must offer between 1 and 4 meals per day.",
    );
  }

  const mealSlotLabels = normalizeWeeklyMealSlotLabels(
    Array.from({ length: mealsPerDay }, (_, index) =>
      formData.get(`mealSlotLabel${index + 1}`),
    ),
    mealsPerDay,
  );

  const invalidMealSlotLabelIndex = mealSlotLabels.findIndex(
    (label, index) => !isAllowedWeeklyMealSlotLabel(label, index + 1),
  );

  if (invalidMealSlotLabelIndex >= 0) {
    const slotNumber = invalidMealSlotLabelIndex + 1;
    const validLabels = getWeeklyMealSlotLabelOptions(slotNumber).join(", ");

    throw new WeeklyMenuValidationError(
      `Slot ${slotNumber} label must be one of: ${validLabels}.`,
    );
  }

  return {
    name: parseRequiredText(formData.get("name"), "Package name"),
    days,
    mealsPerDay,
    price: parseMoney(formData.get("price"), "Package price"),
    available: formData.get("available") === "on",
    requiresChefApproval: formData.get("requiresChefApproval") === "on",
    isSeasonal: formData.get("isSeasonal") === "on",
    mealSlotLabels,
    displayOrder: parseWholeNumber(
      formData.get("displayOrder"),
      "Display order",
      0,
    ),
    notes: parseOptionalText(formData.get("notes")),
  };
}

export function parseWeeklyMealPlanOfferingForm(formData: FormData) {
  return {
    name: parseRequiredText(formData.get("name"), "Offering name"),
    description: parseRequiredText(
      formData.get("description"),
      "Offering description",
    ),
    imageUrl: parseOptionalPublicImageUrl(formData.get("imageUrl")),
    dietaryInfo: parseOptionalText(formData.get("dietaryInfo")),
    available: formData.get("available") === "on",
    displayOrder: parseWholeNumber(
      formData.get("displayOrder"),
      "Display order",
      0,
    ),
  };
}

export function parseWeeklyMealPlanOptionForm(formData: FormData) {
  const optionType = parseEnumValue(
    weeklyMealPlanOptionTypes,
    String(formData.get("optionType") ?? ""),
  );

  if (!optionType) {
    throw new WeeklyMenuValidationError(
      "Option type must be spice level or protein substitution.",
    );
  }

  const requestOnly = formData.get("requestOnly") === "on";
  const requiresApproval = formData.get("requiresApproval") === "on";

  if (optionType === "SPICE_LEVEL" && (requestOnly || requiresApproval)) {
    throw new WeeklyMenuValidationError(
      "Spice level options cannot require request or approval.",
    );
  }

  if (requiresApproval && !requestOnly) {
    throw new WeeklyMenuValidationError(
      "Approval-required protein substitutions must also be request-only.",
    );
  }

  if (requestOnly && !requiresApproval) {
    throw new WeeklyMenuValidationError(
      "Request-only protein substitutions must require chef approval.",
    );
  }

  return {
    optionType: optionType as WeeklyMealPlanOptionTypeValue,
    name: parseRequiredText(formData.get("name"), "Option name"),
    description: parseOptionalText(formData.get("description")),
    dietaryInfo: parseOptionalText(formData.get("dietaryInfo")),
    priceDelta: parseMoney(formData.get("priceDelta"), "Option price delta"),
    requestOnly,
    requiresApproval,
    available: formData.get("available") === "on",
    displayOrder: parseWholeNumber(
      formData.get("displayOrder"),
      "Display order",
      0,
    ),
  };
}

export function isWeeklyMenuValidationError(error: unknown) {
  return error instanceof WeeklyMenuValidationError;
}
