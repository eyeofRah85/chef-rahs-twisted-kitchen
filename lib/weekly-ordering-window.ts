const DEFAULT_WEEKLY_FIXED_MESSAGE =
  "Weekly meal plan orders are delivered on Sunday.";

export type WeeklyOrderingDefaults = {
  lateFee: number;
  weeklyCustomerSchedulingEnabled: boolean;
  weeklyOrderingOpenDay: number;
  weeklyOrderingOpenHour: number;
  weeklyOrderingOpenMinute: number;
  weeklyLateFeeStartDay: number;
  weeklyLateFeeStartHour: number;
  weeklyLateFeeStartMinute: number;
  weeklyOrderingCloseDay: number;
  weeklyOrderingCloseHour: number;
  weeklyOrderingCloseMinute: number;
  weeklyFixedFulfillmentDay: number;
  weeklyFixedFulfillmentHour: number;
  weeklyFixedFulfillmentMinute: number;
  weeklyFixedFulfillmentMessage: string | null;
};

export type WeeklyPeriodScheduleSource = {
  startDate: Date;
  endDate: Date;
  orderCutoffAt?: Date | null;
  orderingOpenAt?: Date | null;
  lateFeeStartsAt?: Date | null;
  orderingClosesAt?: Date | null;
  fixedFulfillmentAt?: Date | null;
  customerSchedulingEnabled?: boolean | null;
  deliveryWindowLabel?: string | null;
};

export type ResolvedWeeklyPeriodSchedule = {
  customerSchedulingEnabled: boolean;
  orderingOpenAt: Date;
  lateFeeStartsAt: Date;
  orderingClosesAt: Date;
  fixedFulfillmentAt: Date;
  deliveryWindowLabel: string;
};

export type WeeklyOrderingWindowState =
  | "not_open"
  | "open"
  | "late"
  | "closed";

export type WeeklyOrderingWindowResult = {
  state: WeeklyOrderingWindowState;
  allowed: boolean;
  lateFeeAmount: number;
  message: string;
};

type LocalDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second?: number;
};

function dateKeyFromDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

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

function findDateKeyInRange(startDateKey: string, endDateKey: string, weekday: number) {
  let currentDateKey = startDateKey;

  for (let index = 0; index < 14; index += 1) {
    if (currentDateKey > endDateKey) break;

    if (weekdayForDateKey(currentDateKey) === weekday) {
      return currentDateKey;
    }

    currentDateKey = addDaysToDateKey(currentDateKey, 1);
  }

  return null;
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

function findDateKeyOnOrBefore(anchorDateKey: string, weekday: number) {
  let currentDateKey = anchorDateKey;

  for (let index = 0; index < 7; index += 1) {
    if (weekdayForDateKey(currentDateKey) === weekday) {
      return currentDateKey;
    }

    currentDateKey = addDaysToDateKey(currentDateKey, -1);
  }

  return anchorDateKey;
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return { year, month, day };
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const valueFor = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: valueFor("year"),
    month: valueFor("month"),
    day: valueFor("day"),
    hour: valueFor("hour"),
    minute: valueFor("minute"),
    second: valueFor("second"),
  };
}

export function zonedDateTimeToUtc(
  parts: LocalDateTimeParts,
  timeZone: string,
) {
  const targetMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second ?? 0,
  );
  let utcMs = targetMs;

  for (let index = 0; index < 3; index += 1) {
    const zonedParts = getTimeZoneParts(new Date(utcMs), timeZone);
    const zonedMs = Date.UTC(
      zonedParts.year,
      zonedParts.month - 1,
      zonedParts.day,
      zonedParts.hour,
      zonedParts.minute,
      zonedParts.second,
    );

    utcMs -= zonedMs - targetMs;
  }

  return new Date(utcMs);
}

function dateTimeForDateKey({
  dateKey,
  hour,
  minute,
  timeZone,
}: {
  dateKey: string;
  hour: number;
  minute: number;
  timeZone: string;
}) {
  const { year, month, day } = parseDateKey(dateKey);

  return zonedDateTimeToUtc(
    {
      year,
      month,
      day,
      hour,
      minute,
    },
    timeZone,
  );
}

function formatWeeklyDateTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

function buildDefaultWeeklySchedule({
  period,
  settings,
  timeZone,
}: {
  period: Pick<WeeklyPeriodScheduleSource, "startDate" | "endDate">;
  settings: WeeklyOrderingDefaults;
  timeZone: string;
}) {
  const startDateKey = dateKeyFromDate(period.startDate);
  const endDateKey = dateKeyFromDate(period.endDate);
  const fixedFulfillmentDateKey =
    findDateKeyInRange(
      startDateKey,
      endDateKey,
      settings.weeklyFixedFulfillmentDay,
    ) ??
    findDateKeyOnOrAfter(startDateKey, settings.weeklyFixedFulfillmentDay);
  const orderingOpenDateKey = findDateKeyOnOrBefore(
    fixedFulfillmentDateKey,
    settings.weeklyOrderingOpenDay,
  );
  const lateFeeStartDateKey = findDateKeyOnOrBefore(
    fixedFulfillmentDateKey,
    settings.weeklyLateFeeStartDay,
  );
  const orderingCloseDateKey = findDateKeyOnOrBefore(
    fixedFulfillmentDateKey,
    settings.weeklyOrderingCloseDay,
  );

  return {
    orderingOpenAt: dateTimeForDateKey({
      dateKey: orderingOpenDateKey,
      hour: settings.weeklyOrderingOpenHour,
      minute: settings.weeklyOrderingOpenMinute,
      timeZone,
    }),
    lateFeeStartsAt: dateTimeForDateKey({
      dateKey: lateFeeStartDateKey,
      hour: settings.weeklyLateFeeStartHour,
      minute: settings.weeklyLateFeeStartMinute,
      timeZone,
    }),
    orderingClosesAt: dateTimeForDateKey({
      dateKey: orderingCloseDateKey,
      hour: settings.weeklyOrderingCloseHour,
      minute: settings.weeklyOrderingCloseMinute,
      timeZone,
    }),
    fixedFulfillmentAt: dateTimeForDateKey({
      dateKey: fixedFulfillmentDateKey,
      hour: settings.weeklyFixedFulfillmentHour,
      minute: settings.weeklyFixedFulfillmentMinute,
      timeZone,
    }),
  };
}

export function resolveWeeklyPeriodSchedule({
  period,
  settings,
  timeZone,
}: {
  period: WeeklyPeriodScheduleSource;
  settings: WeeklyOrderingDefaults;
  timeZone: string;
}): ResolvedWeeklyPeriodSchedule {
  const defaults = buildDefaultWeeklySchedule({
    period,
    settings,
    timeZone,
  });
  const fixedFulfillmentAt =
    period.fixedFulfillmentAt ?? defaults.fixedFulfillmentAt;
  const fallbackMessage =
    settings.weeklyFixedFulfillmentMessage?.trim() ||
    DEFAULT_WEEKLY_FIXED_MESSAGE;

  return {
    customerSchedulingEnabled:
      period.customerSchedulingEnabled ??
      settings.weeklyCustomerSchedulingEnabled,
    orderingOpenAt: period.orderingOpenAt ?? defaults.orderingOpenAt,
    lateFeeStartsAt: period.lateFeeStartsAt ?? defaults.lateFeeStartsAt,
    orderingClosesAt:
      period.orderingClosesAt ?? period.orderCutoffAt ?? defaults.orderingClosesAt,
    fixedFulfillmentAt,
    deliveryWindowLabel:
      period.deliveryWindowLabel?.trim() ||
      `${fallbackMessage} (${formatWeeklyDateTime(fixedFulfillmentAt, timeZone)})`,
  };
}

export function fillWeeklyPeriodScheduleDefaults<
  T extends WeeklyPeriodScheduleSource,
>({
  period,
  settings,
  timeZone,
}: {
  period: T;
  settings: WeeklyOrderingDefaults;
  timeZone: string;
}) {
  const resolved = resolveWeeklyPeriodSchedule({
    period,
    settings,
    timeZone,
  });

  return {
    ...period,
    orderCutoffAt: period.orderCutoffAt ?? resolved.orderingClosesAt,
    orderingOpenAt: period.orderingOpenAt ?? resolved.orderingOpenAt,
    lateFeeStartsAt: period.lateFeeStartsAt ?? resolved.lateFeeStartsAt,
    orderingClosesAt: period.orderingClosesAt ?? resolved.orderingClosesAt,
    fixedFulfillmentAt:
      period.fixedFulfillmentAt ?? resolved.fixedFulfillmentAt,
    customerSchedulingEnabled:
      period.customerSchedulingEnabled ?? resolved.customerSchedulingEnabled,
    deliveryWindowLabel:
      period.deliveryWindowLabel ?? resolved.deliveryWindowLabel,
  };
}

export function getWeeklyOrderingWindowState({
  now = new Date(),
  schedule,
  lateFee,
}: {
  now?: Date;
  schedule: Pick<
    ResolvedWeeklyPeriodSchedule,
    "orderingOpenAt" | "lateFeeStartsAt" | "orderingClosesAt"
  >;
  lateFee: number;
}): WeeklyOrderingWindowResult {
  if (now < schedule.orderingOpenAt) {
    return {
      state: "not_open",
      allowed: false,
      lateFeeAmount: 0,
      message: "Weekly meal plan ordering has not opened yet.",
    };
  }

  if (now > schedule.orderingClosesAt) {
    return {
      state: "closed",
      allowed: false,
      lateFeeAmount: 0,
      message: "Weekly meal plan ordering has closed.",
    };
  }

  if (now >= schedule.lateFeeStartsAt) {
    return {
      state: "late",
      allowed: true,
      lateFeeAmount: lateFee,
      message: "Weekly meal plan orders are in the late-order window.",
    };
  }

  return {
    state: "open",
    allowed: true,
    lateFeeAmount: 0,
    message: "Weekly meal plan ordering is open.",
  };
}

export function formatWeeklyScheduleSummary(
  schedule: Pick<
    ResolvedWeeklyPeriodSchedule,
    | "orderingOpenAt"
    | "lateFeeStartsAt"
    | "orderingClosesAt"
    | "fixedFulfillmentAt"
    | "deliveryWindowLabel"
  >,
  timeZone: string,
) {
  return {
    orderingOpenLabel: formatWeeklyDateTime(schedule.orderingOpenAt, timeZone),
    lateFeeStartsLabel: formatWeeklyDateTime(schedule.lateFeeStartsAt, timeZone),
    orderingClosesLabel: formatWeeklyDateTime(
      schedule.orderingClosesAt,
      timeZone,
    ),
    fixedFulfillmentLabel: formatWeeklyDateTime(
      schedule.fixedFulfillmentAt,
      timeZone,
    ),
    deliveryWindowLabel: schedule.deliveryWindowLabel,
  };
}
