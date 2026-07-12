export function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

const DEFAULT_BUSINESS_TIME_ZONE = "America/New_York";

type CutoffSettings = {
  cutoffDay: number;
  cutoffHour: number;
  cutoffMinute: number;
  timeZone?: string;
  now?: Date;
};

type BusinessDateTimeParts = {
  year: number;
  month: number;
  day: number;
  weekday: number;
  hour: number;
  minute: number;
  second: number;
};

function getWeekdayFromDateParts(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.getUTCDay();
}

function parseRequestedDateTimeParts(
  requestedDateTime: string,
): BusinessDateTimeParts | null {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
      requestedDateTime,
    );

  if (!match) {
    return null;
  }

  const [, yearValue, monthValue, dayValue, hourValue, minuteValue, secondValue] =
    match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  const second = Number(secondValue ?? 0);
  const weekday = getWeekdayFromDateParts(year, month, day);

  if (
    weekday === null ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    return null;
  }

  return {
    year,
    month,
    day,
    weekday,
    hour,
    minute,
    second,
  };
}

function getBusinessDateTimeParts(
  date: Date,
  timeZone = DEFAULT_BUSINESS_TIME_ZONE,
): BusinessDateTimeParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const valueFor = (type: string) =>
    parts.find((part) => part.type === type)?.value;

  const weekday = valueFor("weekday");
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    weekday ?? "",
  );

  if (weekdayIndex < 0) {
    throw new Error("Unable to determine business weekday.");
  }

  return {
    year: Number(valueFor("year") ?? 0),
    month: Number(valueFor("month") ?? 0),
    day: Number(valueFor("day") ?? 0),
    weekday: weekdayIndex,
    hour: Number(valueFor("hour") ?? 0),
    minute: Number(valueFor("minute") ?? 0),
    second: Number(valueFor("second") ?? 0),
  };
}

function compareBusinessDateTimeParts(
  left: BusinessDateTimeParts,
  right: BusinessDateTimeParts,
) {
  const keys = [
    "year",
    "month",
    "day",
    "hour",
    "minute",
  ] as const;

  for (const key of keys) {
    if (left[key] !== right[key]) {
      return left[key] - right[key];
    }
  }

  return 0;
}

function toBusinessWeekIndex(weekday: number) {
  return (weekday + 6) % 7;
}

export function formatBusinessDateTimeInputValue({
  now = new Date(),
  timeZone = DEFAULT_BUSINESS_TIME_ZONE,
}: {
  now?: Date;
  timeZone?: string;
} = {}) {
  const parts = getBusinessDateTimeParts(now, timeZone);

  return `${parts.year.toString().padStart(4, "0")}-${parts.month
    .toString()
    .padStart(2, "0")}-${parts.day
    .toString()
    .padStart(2, "0")}T${parts.hour
    .toString()
    .padStart(2, "0")}:${parts.minute.toString().padStart(2, "0")}`;
}

function isAfterOrAtCutoff(
  businessDateTime: BusinessDateTimeParts,
  {
    cutoffDay,
    cutoffHour,
    cutoffMinute,
  }: Pick<CutoffSettings, "cutoffDay" | "cutoffHour" | "cutoffMinute">,
) {
  const businessWeekday = toBusinessWeekIndex(businessDateTime.weekday);
  const businessCutoffDay = toBusinessWeekIndex(cutoffDay);

  if (businessWeekday !== businessCutoffDay) {
    return businessWeekday > businessCutoffDay;
  }

  if (businessDateTime.hour !== cutoffHour) {
    return businessDateTime.hour > cutoffHour;
  }

  return businessDateTime.minute >= cutoffMinute;
}

export function isLateOrder({
  cutoffDay,
  cutoffHour,
  cutoffMinute,
  timeZone,
  now = new Date(),
}: CutoffSettings) {
  const businessDateTime = getBusinessDateTimeParts(now, timeZone);

  return isAfterOrAtCutoff(businessDateTime, {
    cutoffDay,
    cutoffHour,
    cutoffMinute,
  });
}

export function calculateLateFeeFromSettings({
  lateFee,
  cutoffDay,
  cutoffHour,
  cutoffMinute,
  timeZone,
  now,
}: {
  lateFee: number;
} & CutoffSettings) {
  return isLateOrder({
    cutoffDay,
    cutoffHour,
    cutoffMinute,
    timeZone,
    now,
  })
    ? lateFee
    : 0;
}

export function validateRequestedDateTime(
  requestedDateTime: string,
  options?: {
    noWeekendOrdering?: boolean;
    allowPastDateTime?: boolean;
    now?: Date;
    timeZone?: string;
  },
) {
  const requestedDateTimeParts = parseRequestedDateTimeParts(requestedDateTime);

  if (!requestedDateTimeParts) {
    return {
      valid: false,
      error: "Please choose a valid requested date and time.",
    };
  }

  if (!options?.allowPastDateTime) {
    const businessDateTimeParts = getBusinessDateTimeParts(
      options?.now ?? new Date(),
      options?.timeZone,
    );

    if (
      compareBusinessDateTimeParts(
        requestedDateTimeParts,
        businessDateTimeParts,
      ) < 0
    ) {
      return {
        valid: false,
        error: "Requested date and time cannot be in the past.",
      };
    }
  }

  if (
    options?.noWeekendOrdering &&
    (requestedDateTimeParts.weekday === 0 || requestedDateTimeParts.weekday === 6)
  ) {
    return {
      valid: false,
      error: "Weekend ordering is unavailable.",
    };
  }

  return {
    valid: true,
  };
}

export function validateRequestedDate(
  requestedDate: Date,
  options?: {
    noWeekendOrdering?: boolean;
  },
) {
  if (options?.noWeekendOrdering && isWeekend(requestedDate)) {
    return {
      valid: false,
      error: "Weekend ordering is unavailable.",
    };
  }

  return {
    valid: true,
  };
}
