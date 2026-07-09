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

function getBusinessDateTimeParts(
  date: Date,
  timeZone = DEFAULT_BUSINESS_TIME_ZONE,
) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
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
    weekday: weekdayIndex,
    hour: Number(valueFor("hour") ?? 0),
    minute: Number(valueFor("minute") ?? 0),
    second: Number(valueFor("second") ?? 0),
  };
}

export function isLateOrder({
  cutoffDay,
  cutoffHour,
  cutoffMinute,
  timeZone,
  now = new Date(),
}: CutoffSettings) {
  const businessNow = getBusinessDateTimeParts(now, timeZone);

  if (businessNow.weekday !== cutoffDay) {
    return businessNow.weekday > cutoffDay;
  }

  if (businessNow.hour !== cutoffHour) {
    return businessNow.hour > cutoffHour;
  }

  if (businessNow.minute !== cutoffMinute) {
    return businessNow.minute > cutoffMinute;
  }

  return businessNow.second > 0;
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
