const DEFAULT_WEEKLY_MENU_TIME_ZONE = "America/New_York";

export const weeklyMenuTimeZone =
  process.env.BUSINESS_TIME_ZONE ?? DEFAULT_WEEKLY_MENU_TIME_ZONE;

const dateKeyFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: weeklyMenuTimeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function toDateKeyFromParts(date: Date) {
  const parts = dateKeyFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to format weekly menu business date.");
  }

  return `${year}-${month}-${day}`;
}

function toDateKeyFromStoredDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function fromDateKey(dateKey: string, time: "start" | "end") {
  return new Date(
    `${dateKey}T${time === "start" ? "00:00:00.000" : "23:59:59.999"}Z`,
  );
}

export function parseWeeklyMenuDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = fromDateKey(value, "start");

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatWeeklyMenuDateInput(date: Date) {
  return toDateKeyFromStoredDate(date);
}

export function formatWeeklyMenuDisplayDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function getWeeklyMenuEndBoundary(endDate: Date) {
  return fromDateKey(toDateKeyFromStoredDate(endDate), "end");
}

export function getWeeklyMenuQueryDateRange(date = new Date()) {
  const dateKey = toDateKeyFromParts(date);

  return {
    dayStart: fromDateKey(dateKey, "start"),
    dayEnd: fromDateKey(dateKey, "end"),
  };
}

export function isDateInWeeklyMenuRange(
  period: {
    startDate: Date;
    endDate: Date;
  },
  date = new Date(),
) {
  const { dayStart, dayEnd } = getWeeklyMenuQueryDateRange(date);

  return period.startDate <= dayEnd && period.endDate >= dayStart;
}
