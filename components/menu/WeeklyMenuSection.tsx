import Image from "next/image";
import { WeeklyMenuOrderForm } from "@/components/menu/WeeklyMenuOrderForm";
import { formatWeeklyMealPlanOptionType } from "@/lib/format-labels";
import type { PublicWeeklyMenu, PublicWeeklyOption } from "@/types/weekly-menu";

type Props = {
  weeklyMenu: PublicWeeklyMenu;
};

function groupOptionsByType(options: PublicWeeklyOption[]) {
  return options.reduce<Record<string, PublicWeeklyOption[]>>(
    (groups, option) => {
      groups[option.optionType] = [
        ...(groups[option.optionType] ?? []),
        option,
      ];

      return groups;
    },
    {},
  );
}

export function WeeklyMenuSection({ weeklyMenu }: Props) {
  const orderSlotsRemaining = Math.max(
    weeklyMenu.capacity - weeklyMenu.ordersPlaced,
    0,
  );

  return (
    <section id="weekly-meal-plans" className="mb-12">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Weekly Meal Plans
          </p>

          <h2 className="mt-2 text-3xl font-bold">{weeklyMenu.label}</h2>

          <p className="mt-2 text-neutral-600">{weeklyMenu.dateRange}</p>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full border bg-white px-4 py-2 font-medium shadow-sm">
            {orderSlotsRemaining} of {weeklyMenu.capacity} weekly order slots
            available
          </span>

          {weeklyMenu.orderCutoffLabel && (
            <span className="rounded-full border bg-white px-4 py-2 font-medium shadow-sm">
              Order by {weeklyMenu.orderCutoffLabel}
            </span>
          )}
        </div>
      </div>

      {weeklyMenu.packages.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-3 text-xl font-semibold">Packages</h3>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {weeklyMenu.packages.map((pkg) => (
              <article
                key={pkg.id}
                className="rounded-2xl border bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-semibold">{pkg.name}</h4>

                    <p className="mt-1 text-sm text-neutral-600">
                      {pkg.days} days, {pkg.mealsPerDay} meal
                      {pkg.mealsPerDay === 1 ? "" : "s"} per day
                    </p>
                  </div>

                  <p className="shrink-0 text-xl font-bold">
                    ${pkg.price.toFixed(2)}
                  </p>
                </div>

                {pkg.notes && (
                  <p className="mt-4 text-sm leading-6 text-neutral-600">
                    {pkg.notes}
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      <WeeklyMenuOrderForm weeklyMenu={weeklyMenu} />

      <div>
        <h3 className="mb-3 text-xl font-semibold">
          This Week&apos;s Offerings
        </h3>

        <div className="grid gap-5 md:grid-cols-2">
          {weeklyMenu.offerings.map((offering) => {
            const groupedOptions = groupOptionsByType(offering.options);

            return (
              <article
                key={offering.id}
                className="rounded-2xl border bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl border bg-neutral-100 sm:h-28 sm:w-28 sm:shrink-0">
                    <Image
                      src={offering.imageUrl || "/placeholder.png"}
                      alt={offering.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 112px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xl font-semibold">
                        {offering.name}
                      </h4>

                      {offering.dietaryInfo && (
                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                          {offering.dietaryInfo}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-neutral-600">
                      {offering.description}
                    </p>
                  </div>
                </div>

                {offering.allergens.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    {offering.allergens.map((allergen) => (
                      <span
                        key={allergen.id}
                        className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-800"
                      >
                        {allergen.name}
                      </span>
                    ))}
                  </div>
                )}

                {offering.options.length > 0 && (
                  <div className="mt-5 grid gap-3">
                    {Object.entries(groupedOptions).map(
                      ([optionType, options]) => (
                        <div key={optionType} className="rounded-xl border p-4">
                          <h5 className="text-sm font-semibold">
                            {formatWeeklyMealPlanOptionType(optionType)}
                          </h5>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {options.map((option) => (
                              <span
                                key={option.id}
                                className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700"
                              >
                                {option.name}
                                {option.priceDelta > 0
                                  ? ` +$${option.priceDelta.toFixed(2)}`
                                  : ""}
                                {option.requiresApproval
                                  ? " - approval required"
                                  : ""}
                              </span>
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
