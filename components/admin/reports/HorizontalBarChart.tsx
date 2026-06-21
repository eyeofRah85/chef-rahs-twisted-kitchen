import { ChartEmptyState } from "@/components/admin/reports/ChartEmptyState";

export type HorizontalBarDatum = {
  key: string;
  label: string;
  value: number;
  detail?: string;
};

type HorizontalBarChartProps = {
  title: string;
  description?: string;
  data: HorizontalBarDatum[];
  valueLabel?: string;
  valueFormatter?: (value: number) => string;
  emptyTitle: string;
  emptyMessage: string;
};

export function HorizontalBarChart({
  title,
  description,
  data,
  valueLabel = "value",
  valueFormatter = (value) => value.toLocaleString("en-US"),
  emptyTitle,
  emptyMessage,
}: HorizontalBarChartProps) {
  const maxValue = Math.max(0, ...data.map((item) => item.value));
  const populatedData = data.filter((item) => item.value > 0);

  return (
    <section className="admin-card p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-black text-[#24130f]">{title}</h3>
          {description && (
            <p className="mt-1 text-sm leading-6 text-[#6b5a50]">
              {description}
            </p>
          )}
        </div>
      </div>

      {populatedData.length === 0 ? (
        <div className="mt-5">
          <ChartEmptyState title={emptyTitle} message={emptyMessage} />
        </div>
      ) : (
        <div
          className="mt-6 space-y-4"
          role="img"
          aria-label={`${title}: ${populatedData
            .map((item) => `${item.label} ${valueFormatter(item.value)}`)
            .join(", ")}`}
        >
          {populatedData.map((item) => {
            const percent =
              maxValue > 0 ? Math.max((item.value / maxValue) * 100, 5) : 0;

            return (
              <div key={item.key} className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#24130f]">
                      {item.label}
                    </p>
                    {item.detail && (
                      <p className="text-xs font-medium text-[#6b5a50]">
                        {item.detail}
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 text-sm font-black text-[#24130f]">
                    {valueFormatter(item.value)}
                    <span className="sr-only"> {valueLabel}</span>
                  </p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#f1ede7]">
                  <div
                    className="h-full rounded-full bg-[#8a2b18]"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
