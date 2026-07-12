import { formatBusinessDateTimeInputValue } from "@/lib/business-rules";
import { zonedDateTimeToUtc } from "@/lib/weekly-ordering-window";

export const DEFAULT_CHECKOUT_FIXED_FULFILLMENT_MESSAGE =
  "Orders are fulfilled on Sunday.";

export type CheckoutFixedFulfillmentSettings = {
  checkoutFixedFulfillmentDay: number;
  checkoutFixedFulfillmentHour: number;
  checkoutFixedFulfillmentMinute: number;
  checkoutFixedFulfillmentMessage: string | null;
};

function dateKeyToUtcDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function addDaysToDateKey(dateKey: string, days: number) {
  const date = dateKeyToUtcDate(dateKey);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

function weekdayForDateKey(dateKey: string) {
  return dateKeyToUtcDate(dateKey).getUTCDay();
}

function findDateKeyOnOrAfter(anchorDateKey: string, weekday: number) {
  let currentDateKey = anchorDateKey;

  for (let index = 0; index < 7; index += 1) {
    if (weekdayForDateKey(currentDateKey) === weekday) {
      return currentDateKey;
    }

    currentDateKey = addDaysToDateKey(currentDateKey, 1);
  }

  return anchorDateKey;
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return { year, month, day };
}

function fixedFulfillmentAtForDateKey({
  dateKey,
  settings,
  timeZone,
}: {
  dateKey: string;
  settings: CheckoutFixedFulfillmentSettings;
  timeZone: string;
}) {
  const { year, month, day } = parseDateKey(dateKey);

  return zonedDateTimeToUtc(
    {
      year,
      month,
      day,
      hour: settings.checkoutFixedFulfillmentHour,
      minute: settings.checkoutFixedFulfillmentMinute,
    },
    timeZone,
  );
}

export function formatCheckoutFulfillmentDateTime(
  date: Date,
  timeZone: string,
) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

export function resolveCheckoutFixedFulfillment({
  settings,
  now = new Date(),
  timeZone = "America/New_York",
}: {
  settings: CheckoutFixedFulfillmentSettings;
  now?: Date;
  timeZone?: string;
}) {
  const currentDateKey = formatBusinessDateTimeInputValue({
    now,
    timeZone,
  }).slice(0, 10);
  let fulfillmentDateKey = findDateKeyOnOrAfter(
    currentDateKey,
    settings.checkoutFixedFulfillmentDay,
  );
  let fixedFulfillmentAt = fixedFulfillmentAtForDateKey({
    dateKey: fulfillmentDateKey,
    settings,
    timeZone,
  });

  if (fixedFulfillmentAt <= now) {
    fulfillmentDateKey = addDaysToDateKey(fulfillmentDateKey, 7);
    fixedFulfillmentAt = fixedFulfillmentAtForDateKey({
      dateKey: fulfillmentDateKey,
      settings,
      timeZone,
    });
  }

  const message =
    settings.checkoutFixedFulfillmentMessage?.trim() ||
    DEFAULT_CHECKOUT_FIXED_FULFILLMENT_MESSAGE;
  const label = formatCheckoutFulfillmentDateTime(
    fixedFulfillmentAt,
    timeZone,
  );

  return {
    fixedFulfillmentAt,
    label,
    message,
    displayMessage: `${message} (${label})`,
  };
}
