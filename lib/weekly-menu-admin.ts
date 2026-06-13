import { prisma } from "@/lib/prisma";
import type { WeeklyMenuStatusValue } from "@/lib/prisma-enums";

type PublishedOverlapInput = {
  status: WeeklyMenuStatusValue;
  startDate: Date;
  endDate: Date;
  excludeId?: string;
};

export async function hasPublishedWeeklyMenuOverlap({
  status,
  startDate,
  endDate,
  excludeId,
}: PublishedOverlapInput) {
  if (status !== "PUBLISHED") {
    return false;
  }

  const existing = await prisma.weeklyMenuPeriod.findFirst({
    where: {
      status: "PUBLISHED",
      startDate: {
        lte: endDate,
      },
      endDate: {
        gte: startDate,
      },
      ...(excludeId
        ? {
            id: {
              not: excludeId,
            },
          }
        : {}),
    },
    select: {
      id: true,
    },
  });

  return Boolean(existing);
}
