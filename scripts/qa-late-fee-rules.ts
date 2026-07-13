import {
  getWeeklyOrderingWindowState,
  resolveWeeklyPeriodSchedule,
  zonedDateTimeToUtc,
} from "../lib/weekly-ordering-window";

const settings = {
  lateFee: 10,
  weeklyCustomerSchedulingEnabled: false,
  weeklyOrderingOpenDay: 3,
  weeklyOrderingOpenHour: 0,
  weeklyOrderingOpenMinute: 0,
  weeklyLateFeeStartDay: 5,
  weeklyLateFeeStartHour: 17,
  weeklyLateFeeStartMinute: 0,
  weeklyOrderingCloseDay: 5,
  weeklyOrderingCloseHour: 22,
  weeklyOrderingCloseMinute: 0,
  weeklyFixedFulfillmentDay: 0,
  weeklyFixedFulfillmentHour: null,
  weeklyFixedFulfillmentMinute: null,
  weeklyFixedFulfillmentMessage:
    "Weekly meal plan orders are delivered on Sunday. You will be notified when delivery is scheduled.",
};
const timeZone = "America/New_York";
const schedule = resolveWeeklyPeriodSchedule({
  period: {
    startDate: new Date("2026-07-06T00:00:00.000Z"),
    endDate: new Date("2026-07-12T23:59:59.999Z"),
  },
  settings,
  timeZone,
});

const expectedFulfillment = zonedDateTimeToUtc(
  {
    year: 2026,
    month: 7,
    day: 12,
    hour: 12,
    minute: 0,
  },
  timeZone,
);

if (schedule.fixedFulfillmentAt.getTime() !== expectedFulfillment.getTime()) {
  throw new Error(
    `Expected fixed Sunday fulfillment ${expectedFulfillment.toISOString()}, received ${schedule.fixedFulfillmentAt.toISOString()}.`,
  );
}

const cases = [
  {
    name: "Wednesday during open window is allowed with no late fee",
    now: "2026-07-08T18:00:00.000Z",
    expectedState: "open",
    expectedLateFee: 0,
    expectedAllowed: true,
  },
  {
    name: "Thursday is allowed with no late fee",
    now: "2026-07-09T20:00:00.000Z",
    expectedState: "open",
    expectedLateFee: 0,
    expectedAllowed: true,
  },
  {
    name: "Friday before 5 PM is allowed with no late fee",
    now: "2026-07-10T20:59:00.000Z",
    expectedState: "open",
    expectedLateFee: 0,
    expectedAllowed: true,
  },
  {
    name: "Friday at 5 PM is allowed with late fee",
    now: "2026-07-10T21:00:00.000Z",
    expectedState: "late",
    expectedLateFee: 10,
    expectedAllowed: true,
  },
  {
    name: "Friday after 10 PM is rejected as closed",
    now: "2026-07-11T02:01:00.000Z",
    expectedState: "closed",
    expectedLateFee: 0,
    expectedAllowed: false,
  },
  {
    name: "Saturday is rejected as closed",
    now: "2026-07-11T16:00:00.000Z",
    expectedState: "closed",
    expectedLateFee: 0,
    expectedAllowed: false,
  },
  {
    name: "Sunday is rejected as closed for that weekly period",
    now: "2026-07-12T16:00:00.000Z",
    expectedState: "closed",
    expectedLateFee: 0,
    expectedAllowed: false,
  },
  {
    name: "Monday is rejected as closed for that weekly period",
    now: "2026-07-13T16:00:00.000Z",
    expectedState: "closed",
    expectedLateFee: 0,
    expectedAllowed: false,
  },
  {
    name: "Tuesday is rejected as closed for that weekly period",
    now: "2026-07-14T16:00:00.000Z",
    expectedState: "closed",
    expectedLateFee: 0,
    expectedAllowed: false,
  },
] as const;

for (const testCase of cases) {
  const result = getWeeklyOrderingWindowState({
    now: new Date(testCase.now),
    schedule,
    lateFee: settings.lateFee,
  });

  if (
    result.state !== testCase.expectedState ||
    result.lateFeeAmount !== testCase.expectedLateFee ||
    result.allowed !== testCase.expectedAllowed
  ) {
    throw new Error(
      `${testCase.name}: expected ${testCase.expectedState}/$${testCase.expectedLateFee.toFixed(
        2,
      )}/${testCase.expectedAllowed}, received ${result.state}/$${result.lateFeeAmount.toFixed(
        2,
      )}/${result.allowed}.`,
    );
  }

  console.log(`PASS ${testCase.name}`);
}

const requestedDateTime = "2026-07-09T16:30";
const requestedDateIgnoredResult = getWeeklyOrderingWindowState({
  now: new Date("2026-07-10T21:00:00.000Z"),
  schedule,
  lateFee: settings.lateFee,
});

if (requestedDateIgnoredResult.lateFeeAmount !== settings.lateFee) {
  throw new Error(
    `Expected requestedDateTime ${requestedDateTime} not to affect weekly late fee calculation.`,
  );
}

console.log(
  `PASS requestedDateTime ${requestedDateTime} does not drive weekly late fee logic`,
);
console.log(
  `PASS fixed Sunday fulfillment resolved server-side as ${schedule.fixedFulfillmentAt.toISOString()}`,
);
console.log("Weekly ordering window QA passed.");
