import { prisma } from "@/lib/prisma";
import {
  formatOrderStatus,
  formatOrderType,
  formatServiceRequestType,
} from "@/lib/format-labels";
import {
  orderStatuses,
  orderTypes,
  serviceRequestTypes,
} from "@/lib/prisma-enums";

const revenueExcludedStatuses = new Set(["CANCELLED", "REFUNDED"]);
const manualPaymentStatuses = new Set(["PAY_BY_DATE", "OFFLINE_PAYMENT_DUE"]);

export const businessInsightPeriods = [
  {
    key: "30d",
    label: "30 days",
    shortLabel: "30D",
    days: 30,
    bucket: "week",
  },
  {
    key: "90d",
    label: "90 days",
    shortLabel: "90D",
    days: 90,
    bucket: "week",
  },
  {
    key: "12m",
    label: "12 months",
    shortLabel: "12M",
    months: 12,
    bucket: "month",
  },
] as const;

export type BusinessInsightPeriodKey =
  (typeof businessInsightPeriods)[number]["key"];

export type BusinessInsightPeriodOption = {
  key: BusinessInsightPeriodKey;
  label: string;
  shortLabel: string;
};

export type BusinessInsightPeriod = BusinessInsightPeriodOption & {
  bucket: "week" | "month";
  startDate: Date;
  endDate: Date;
  dateRangeLabel: string;
};

export type KpiMetrics = {
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  pendingApprovals: number;
  pendingOrderApprovals: number;
  pendingServiceRequestApprovals: number;
  unpaidManualPaymentOrders: number;
  serviceRequestCount: number;
  cateringRequestCount: number;
  personalChefRequestCount: number;
};

export type TrendMetric = {
  key: string;
  label: string;
  revenue: number;
  orders: number;
};

export type CountMetric = {
  key: string;
  label: string;
  value: number;
};

export type TopSellingItemMetric = {
  name: string;
  quantity: number;
  revenue: number;
};

export type BusinessInsightsMetrics = {
  period: BusinessInsightPeriod;
  periodOptions: BusinessInsightPeriodOption[];
  kpis: KpiMetrics;
  revenueTrend: TrendMetric[];
  ordersByStatus: CountMetric[];
  ordersByType: CountMetric[];
  serviceRequestsByType: CountMetric[];
  topSellingItems: TopSellingItemMetric[];
};

type TrendBucket = TrendMetric & {
  startDate: Date;
  endDate: Date;
};

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfWeek(date: Date) {
  const next = startOfDay(date);
  next.setDate(next.getDate() - next.getDay());
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatBucketLabel(date: Date, bucket: "week" | "month") {
  if (bucket === "month") {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function resolveBusinessInsightPeriod(
  periodKey: string | undefined,
): BusinessInsightPeriod {
  const selected =
    businessInsightPeriods.find((period) => period.key === periodKey) ??
    businessInsightPeriods[1];
  const endDate = new Date();
  const startDate =
    "months" in selected
      ? startOfMonth(addMonths(endDate, -(selected.months - 1)))
      : startOfDay(addDays(endDate, -(selected.days - 1)));

  return {
    key: selected.key,
    label: selected.label,
    shortLabel: selected.shortLabel,
    bucket: selected.bucket,
    startDate,
    endDate,
    dateRangeLabel: `${formatDate(startDate)} - ${formatDate(endDate)}`,
  };
}

function createTrendBuckets(period: BusinessInsightPeriod) {
  const buckets: TrendBucket[] = [];

  if (period.bucket === "month") {
    let cursor = startOfMonth(period.startDate);

    while (cursor <= period.endDate) {
      const startDate = new Date(cursor);
      const endDate = addMonths(startDate, 1);

      buckets.push({
        key: monthKey(startDate),
        label: formatBucketLabel(startDate, "month"),
        revenue: 0,
        orders: 0,
        startDate,
        endDate,
      });

      cursor = endDate;
    }

    return buckets;
  }

  let cursor = startOfWeek(period.startDate);

  while (cursor <= period.endDate) {
    const startDate = new Date(cursor);
    const endDate = addDays(startDate, 7);

    buckets.push({
      key: dateKey(startDate),
      label: formatBucketLabel(startDate, "week"),
      revenue: 0,
      orders: 0,
      startDate,
      endDate,
    });

    cursor = endDate;
  }

  return buckets;
}

function getOrderBucketKey(date: Date, bucket: "week" | "month") {
  if (bucket === "month") {
    return monthKey(startOfMonth(date));
  }

  return dateKey(startOfWeek(date));
}

function makeCountMetrics(
  keys: readonly string[],
  counts: Map<string, number>,
  formatter: (key: string) => string,
) {
  return keys
    .map((key) => ({
      key,
      label: formatter(key),
      value: counts.get(key) ?? 0,
    }))
    .filter((metric) => metric.value > 0);
}

export async function getBusinessInsightsMetrics(
  periodKey?: string,
): Promise<BusinessInsightsMetrics> {
  const period = resolveBusinessInsightPeriod(periodKey);
  const dateRange = {
    gte: period.startDate,
    lte: period.endDate,
  };

  const [orders, pendingServiceRequestApprovals, serviceRequestTypeCounts] =
    await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: dateRange,
        },
        select: {
          id: true,
          total: true,
          status: true,
          paymentStatus: true,
          approvalStatus: true,
          orderType: true,
          createdAt: true,
          requestedDateTime: true,
          items: {
            select: {
              name: true,
              quantity: true,
              lineTotal: true,
            },
          },
        },
      }),
      prisma.cateringRequest.count({
        where: {
          createdAt: dateRange,
          approvalStatus: "PENDING",
        },
      }),
      prisma.cateringRequest.groupBy({
        by: ["requestType"],
        where: {
          createdAt: dateRange,
        },
        _count: {
          id: true,
        },
      }),
    ]);

  const revenueOrders = orders.filter(
    (order) => !revenueExcludedStatuses.has(order.status),
  );
  const totalRevenue = revenueOrders.reduce(
    (sum, order) => sum + Number(order.total),
    0,
  );
  const pendingOrderApprovals = orders.filter(
    (order) => order.approvalStatus === "PENDING",
  ).length;
  const unpaidManualPaymentOrders = orders.filter(
    (order) =>
      manualPaymentStatuses.has(order.paymentStatus ?? "") &&
      !revenueExcludedStatuses.has(order.status),
  ).length;

  const statusCounts = new Map<string, number>();
  const typeCounts = new Map<string, number>();
  const itemMetrics = new Map<string, TopSellingItemMetric>();
  const trendBuckets = createTrendBuckets(period);
  const trendBucketByKey = new Map(
    trendBuckets.map((bucket) => [bucket.key, bucket]),
  );

  for (const order of orders) {
    statusCounts.set(order.status, (statusCounts.get(order.status) ?? 0) + 1);
    typeCounts.set(order.orderType, (typeCounts.get(order.orderType) ?? 0) + 1);
  }

  for (const order of revenueOrders) {
    const bucketKey = getOrderBucketKey(order.createdAt, period.bucket);
    const bucket = trendBucketByKey.get(bucketKey);

    if (bucket) {
      bucket.revenue += Number(order.total);
      bucket.orders += 1;
    }

    for (const item of order.items) {
      const existing = itemMetrics.get(item.name) ?? {
        name: item.name,
        quantity: 0,
        revenue: 0,
      };

      existing.quantity += item.quantity;
      existing.revenue += Number(item.lineTotal);
      itemMetrics.set(item.name, existing);
    }
  }

  const serviceTypeCounts = new Map(
    serviceRequestTypeCounts.map((row) => [
      row.requestType,
      row._count.id,
    ]),
  );
  const cateringRequestCount = serviceTypeCounts.get("CATERING") ?? 0;
  const personalChefRequestCount =
    serviceTypeCounts.get("PERSONAL_CHEF") ?? 0;
  const serviceRequestCount = cateringRequestCount + personalChefRequestCount;

  return {
    period,
    periodOptions: businessInsightPeriods.map((option) => ({
      key: option.key,
      label: option.label,
      shortLabel: option.shortLabel,
    })),
    kpis: {
      totalRevenue,
      orderCount: orders.length,
      averageOrderValue:
        revenueOrders.length > 0 ? totalRevenue / revenueOrders.length : 0,
      pendingApprovals: pendingOrderApprovals + pendingServiceRequestApprovals,
      pendingOrderApprovals,
      pendingServiceRequestApprovals,
      unpaidManualPaymentOrders,
      serviceRequestCount,
      cateringRequestCount,
      personalChefRequestCount,
    },
    revenueTrend: trendBuckets.map(({ key, label, revenue, orders }) => ({
      key,
      label,
      revenue,
      orders,
    })),
    ordersByStatus: makeCountMetrics(
      orderStatuses,
      statusCounts,
      formatOrderStatus,
    ),
    ordersByType: makeCountMetrics(orderTypes, typeCounts, formatOrderType),
    serviceRequestsByType: makeCountMetrics(
      serviceRequestTypes,
      serviceTypeCounts,
      formatServiceRequestType,
    ),
    topSellingItems: Array.from(itemMetrics.values())
      .sort((first, second) => {
        if (second.quantity !== first.quantity) {
          return second.quantity - first.quantity;
        }

        return second.revenue - first.revenue;
      })
      .slice(0, 6),
  };
}
