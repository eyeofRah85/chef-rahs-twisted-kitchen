import Link from "next/link";
import { HorizontalBarChart } from "@/components/admin/reports/HorizontalBarChart";
import { ReportKpiCard } from "@/components/admin/reports/ReportKpiCard";
import { RevenueTrendChart } from "@/components/admin/reports/RevenueTrendChart";
import { TopSellingItemsChart } from "@/components/admin/reports/TopSellingItemsChart";
import type { BusinessInsightsMetrics } from "@/lib/admin-report-metrics";

type BusinessInsightsSectionProps = {
  metrics: BusinessInsightsMetrics;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function BusinessInsightsSection({
  metrics,
}: BusinessInsightsSectionProps) {
  const periodUnit = metrics.period.bucket === "month" ? "month" : "week";
  const kpis = [
    {
      label: "Total Revenue",
      value: formatCurrency(metrics.kpis.totalRevenue),
      helperText: "Non-cancelled and non-refunded orders.",
      tone: "success" as const,
    },
    {
      label: "Orders",
      value: metrics.kpis.orderCount.toLocaleString("en-US"),
      helperText: "Customer orders created in this period.",
    },
    {
      label: "Average Order Value",
      value: formatCurrency(metrics.kpis.averageOrderValue),
      helperText: "Average across revenue-counted orders.",
    },
    {
      label: "Pending Approvals",
      value: metrics.kpis.pendingApprovals.toLocaleString("en-US"),
      helperText: `${metrics.kpis.pendingOrderApprovals} order / ${metrics.kpis.pendingServiceRequestApprovals} service request`,
      tone: metrics.kpis.pendingApprovals > 0 ? ("warning" as const) : undefined,
    },
    {
      label: "Manual Payments Due",
      value: metrics.kpis.unpaidManualPaymentOrders.toLocaleString("en-US"),
      helperText: "Pay-by-date or offline payment orders.",
      tone:
        metrics.kpis.unpaidManualPaymentOrders > 0
          ? ("warning" as const)
          : undefined,
    },
    {
      label: "Service Requests",
      value: metrics.kpis.serviceRequestCount.toLocaleString("en-US"),
      helperText: `${metrics.kpis.cateringRequestCount} catering / ${metrics.kpis.personalChefRequestCount} personal chef`,
    },
  ];

  return (
    <section
      id="business-insights"
      className="mt-12 border-t border-[#ead8c1] pt-10"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="admin-eyebrow">Business Insights</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
            Period performance
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6b5a50]">
            A business-focused view of revenue, order volume, approvals,
            payment follow-up, service requests, and item demand for{" "}
            {metrics.period.dateRangeLabel}.
          </p>
        </div>

        <div
          className="flex flex-wrap gap-2"
          aria-label="Business insights period"
        >
          {metrics.periodOptions.map((option) => {
            const isActive = option.key === metrics.period.key;

            return (
              <Link
                key={option.key}
                href={`/admin/reports?period=${option.key}#business-insights`}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "admin-filter-chip admin-filter-chip-active"
                    : "admin-filter-chip"
                }
              >
                <span className="sm:hidden">{option.shortLabel}</span>
                <span className="hidden sm:inline">Last {option.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <ReportKpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            helperText={kpi.helperText}
            tone={kpi.tone}
          />
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <RevenueTrendChart
          data={metrics.revenueTrend}
          periodLabel={periodUnit}
        />

        <div className="grid gap-6">
          <HorizontalBarChart
            title="Orders by Status"
            description="Status mix for orders created in the selected period."
            data={metrics.ordersByStatus}
            valueLabel="orders"
            emptyTitle="No order status data"
            emptyMessage="Orders created in this period will appear here."
          />

          <HorizontalBarChart
            title="Orders by Type"
            description="Delivery, pickup, and any legacy order type records."
            data={metrics.ordersByType}
            valueLabel="orders"
            emptyTitle="No order type data"
            emptyMessage="Order type breakdown will appear after orders are submitted."
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)]">
        <TopSellingItemsChart items={metrics.topSellingItems} />

        <HorizontalBarChart
          title="Service Requests by Type"
          description="Catering and Personal Chef request mix in the selected period."
          data={metrics.serviceRequestsByType}
          valueLabel="requests"
          emptyTitle="No service requests yet"
          emptyMessage="Catering and Personal Chef requests created in this period will appear here."
        />
      </div>
    </section>
  );
}
