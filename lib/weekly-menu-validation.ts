import { parseEnumValue } from "@/lib/enum-values";
import {
  weeklyMenuStatuses,
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
  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
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

  if (orderCutoffAt && orderCutoffAt > endDate) {
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

  if (![1, 2].includes(mealsPerDay)) {
    throw new WeeklyMenuValidationError(
      "Weekly packages must offer 1 or 2 meals per day.",
    );
  }

  return {
    name: parseRequiredText(formData.get("name"), "Package name"),
    days,
    mealsPerDay,
    price: parseMoney(formData.get("price"), "Package price"),
    available: formData.get("available") === "on",
    displayOrder: parseWholeNumber(
      formData.get("displayOrder"),
      "Display order",
      0,
    ),
    notes: parseOptionalText(formData.get("notes")),
  };
}

export function isWeeklyMenuValidationError(error: unknown) {
  return error instanceof WeeklyMenuValidationError;
}
