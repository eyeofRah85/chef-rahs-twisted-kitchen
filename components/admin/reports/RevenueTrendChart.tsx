import { ChartEmptyState } from "@/components/admin/reports/ChartEmptyState";
import type { TrendMetric } from "@/lib/admin-report-metrics";

type RevenueTrendChartProps = {
  data: TrendMetric[];
  periodLabel: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function RevenueTrendChart({
  data,
  periodLabel,
}: RevenueTrendChartProps) {
  const maxRevenue = Math.max(0, ...data.map((item) => item.revenue));
  const hasData = maxRevenue > 0;

  const width = 720;
  const height = 300;
  const padding = {
    top: 28,
    right: 24,
    bottom: 58,
    left: 56,
  };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const slotWidth = data.length > 0 ? chartWidth / data.length : chartWidth;
  const barWidth = Math.max(10, slotWidth * 0.58);
  const tickStep = Math.max(1, Math.ceil(data.length / 6));

  return (
    <section className="admin-card p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-black text-[#24130f]">Revenue Trend</h3>
          <p className="mt-1 text-sm leading-6 text-[#6b5a50]">
            Revenue grouped by {periodLabel}.
          </p>
        </div>
        <p className="admin-badge admin-badge-neutral w-fit">
          Max {formatCurrency(maxRevenue)}
        </p>
      </div>

      {!hasData ? (
        <div className="mt-5">
          <ChartEmptyState
            title="No revenue yet"
            message="Orders created in this period will appear here once there is revenue to review."
          />
        </div>
      ) : (
        <div
          className="mt-6 overflow-hidden rounded-lg border border-[#ead8c1] bg-[#fffaf3] p-3"
          role="img"
          aria-label={`Revenue trend: ${data
            .map((item) => `${item.label} ${formatCurrency(item.revenue)}`)
            .join(", ")}`}
        >
          <svg
            className="h-72 w-full"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            {[0, 1, 2, 3].map((line) => {
              const y = padding.top + (chartHeight / 3) * line;

              return (
                <line
                  key={line}
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="#ead8c1"
                  strokeDasharray={line === 3 ? "0" : "6 8"}
                />
              );
            })}

            {data.map((item, index) => {
              const valueRatio =
                maxRevenue > 0 ? item.revenue / maxRevenue : 0;
              const barHeight =
                item.revenue > 0 ? Math.max(valueRatio * chartHeight, 3) : 0;
              const x =
                padding.left +
                slotWidth * index +
                Math.max((slotWidth - barWidth) / 2, 0);
              const y = padding.top + chartHeight - barHeight;
              const showLabel = index % tickStep === 0;

              return (
                <g key={item.key}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="6"
                    fill="#8a2b18"
                  />
                  {showLabel && (
                    <text
                      x={x + barWidth / 2}
                      y={height - 28}
                      textAnchor="middle"
                      fill="#6b5a50"
                      fontSize="11"
                      fontWeight="700"
                    >
                      {item.label}
                    </text>
                  )}
                </g>
              );
            })}

            <text
              x={padding.left}
              y={18}
              fill="#6b5a50"
              fontSize="12"
              fontWeight="800"
            >
              {formatCurrency(maxRevenue)}
            </text>
            <text
              x={padding.left}
              y={height - 8}
              fill="#6b5a50"
              fontSize="12"
              fontWeight="800"
            >
              {formatCurrency(0)}
            </text>
          </svg>
        </div>
      )}
    </section>
  );
}
