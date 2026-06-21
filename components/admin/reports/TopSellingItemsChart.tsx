import { ChartEmptyState } from "@/components/admin/reports/ChartEmptyState";
import type { TopSellingItemMetric } from "@/lib/admin-report-metrics";

type TopSellingItemsChartProps = {
  items: TopSellingItemMetric[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function TopSellingItemsChart({ items }: TopSellingItemsChartProps) {
  const maxQuantity = Math.max(0, ...items.map((item) => item.quantity));

  return (
    <section className="admin-card p-6">
      <div>
        <h3 className="text-xl font-black text-[#24130f]">
          Top Selling Items
        </h3>
        <p className="mt-1 text-sm leading-6 text-[#6b5a50]">
          Ranked by quantity sold, with revenue included for quick comparison.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="mt-5">
          <ChartEmptyState
            title="No item sales yet"
            message="Customer order items in the selected period will appear here."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((item, index) => {
            const percent =
              maxQuantity > 0
                ? Math.max((item.quantity / maxQuantity) * 100, 5)
                : 0;

            return (
              <article
                key={item.name}
                className="rounded-lg border border-[#ead8c1] bg-white p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-[#8a2b18]">
                      #{index + 1}
                    </p>
                    <p className="mt-1 truncate text-base font-black text-[#24130f]">
                      {item.name}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-left sm:text-right">
                    <div>
                      <p className="text-xs font-bold text-[#6b5a50]">
                        Quantity
                      </p>
                      <p className="text-lg font-black text-[#24130f]">
                        {item.quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#6b5a50]">
                        Revenue
                      </p>
                      <p className="text-lg font-black text-[#24130f]">
                        {formatCurrency(item.revenue)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#f1ede7]">
                  <div
                    className="h-full rounded-full bg-[#d99426]"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
