import { calculateLateFeeFromSettings } from "../lib/business-rules";

const freshDatabaseDefaultSettings = {
  lateFee: 10,
  cutoffDay: 4,
  cutoffHour: 17,
  cutoffMinute: 0,
  timeZone: "America/New_York",
};

const cases = [
  {
    name: "before Thursday 5 PM ET cutoff has no late fee",
    now: "2026-07-09T20:59:00.000Z",
    expectedLateFee: 0,
  },
  {
    name: "Thursday exactly 5 PM ET cutoff applies late fee",
    now: "2026-07-09T21:00:00.000Z",
    expectedLateFee: 10,
  },
  {
    name: "Friday submission after Thursday cutoff applies late fee",
    now: "2026-07-10T22:00:00.000Z",
    expectedLateFee: 10,
  },
  {
    name: "Sunday submission still counts as after the Thursday cutoff",
    now: "2026-07-12T16:00:00.000Z",
    expectedLateFee: 10,
  },
  {
    name: "Friday requestedDateTime submitted before cutoff has no late fee",
    now: "2026-07-09T20:59:00.000Z",
    requestedDateTime: "2026-07-10T18:00",
    expectedLateFee: 0,
  },
  {
    name: "Friday requestedDateTime submitted after cutoff applies late fee",
    now: "2026-07-10T14:00:00.000Z",
    requestedDateTime: "2026-07-10T18:00",
    expectedLateFee: 10,
  },
  {
    name: "Monday submission resets before the next Thursday cutoff",
    now: "2026-07-13T16:00:00.000Z",
    expectedLateFee: 0,
  },
];

for (const testCase of cases) {
  const actualLateFee = calculateLateFeeFromSettings({
    ...freshDatabaseDefaultSettings,
    now: new Date(testCase.now),
  });

  if (actualLateFee !== testCase.expectedLateFee) {
    throw new Error(
      `${testCase.name}: expected $${testCase.expectedLateFee.toFixed(
        2,
      )}, received $${actualLateFee.toFixed(2)}.`,
    );
  }

  console.log(`PASS ${testCase.name}`);
}

console.log("Late fee regression QA passed.");
