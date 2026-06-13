import Link from "next/link";
import { redirect } from "next/navigation";
import {
  WeeklyMealPlanPackageForm,
  type WeeklyMealPlanPackageFormData,
} from "@/components/admin/WeeklyMealPlanPackageForm";
import {
  WeeklyMenuPeriodForm,
  type WeeklyMenuPeriodFormData,
} from "@/components/admin/WeeklyMenuPeriodForm";
import { requireAdmin } from "@/lib/auth-guards";
import { formatWeeklyMenuStatus } from "@/lib/format-labels";
import { prisma } from "@/lib/prisma";

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDateTimeInput(date: Date | null) {
  if (!date) {
    return null;
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  return localDate.toISOString().slice(0, 16);
}

function formatDisplayDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function toPeriodFormData(period: {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
  orderCutoffAt: Date | null;
  fulfillmentNotes: string | null;
  status: string;
  capacity: number;
}): WeeklyMenuPeriodFormData {
  return {
    id: period.id,
    label: period.label,
    startDate: formatDateInput(period.startDate),
    endDate: formatDateInput(period.endDate),
    orderCutoffAt: formatDateTimeInput(period.orderCutoffAt),
    fulfillmentNotes: period.fulfillmentNotes,
    status: period.status,
    capacity: period.capacity,
  };
}

function toPackageFormData(pkg: {
  id: string;
  name: string;
  days: number;
  mealsPerDay: number;
  price: unknown;
  available: boolean;
  displayOrder: number;
  notes: string | null;
}): WeeklyMealPlanPackageFormData {
  return {
    id: pkg.id,
    name: pkg.name,
    days: pkg.days,
    mealsPerDay: pkg.mealsPerDay,
    price: Number(pkg.price),
    available: pkg.available,
    displayOrder: pkg.displayOrder,
    notes: pkg.notes,
  };
}

export default async function AdminWeeklyMenuPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const periods = await prisma.weeklyMenuPeriod.findMany({
    orderBy: [
      {
        startDate: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    include: {
      packages: {
        orderBy: [
          {
            displayOrder: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      },
      _count: {
        select: {
          offerings: true,
          orderSelections: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link className="text-sm font-medium underline" href="/admin/menu">
            &larr; Back to Menu Manager
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Admin
          </p>

          <h1 className="mt-3 text-4xl font-bold">Weekly Menu Manager</h1>

          <p className="mt-3 max-w-3xl text-neutral-700">
            Draft and maintain weekly meal plan periods and fixed-price 1- or
            2-meal packages before the public weekly menu is wired into checkout.
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-[380px_1fr]">
          <aside className="xl:sticky xl:top-24 xl:self-start">
            <WeeklyMenuPeriodForm />
          </aside>

          <section className="space-y-5">
            {periods.map((period) => {
              const periodFormData = toPeriodFormData(period);
              const dateRange = `${formatDisplayDate(
                period.startDate,
              )} - ${formatDisplayDate(period.endDate)}`;

              return (
                <details
                  key={period.id}
                  className="group rounded-2xl border bg-white shadow-sm open:bg-white"
                >
                  <summary className="cursor-pointer list-none rounded-2xl p-5 transition hover:bg-neutral-100">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-2xl font-semibold">
                            {period.label}
                          </h2>

                          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                            {formatWeeklyMenuStatus(period.status)}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-neutral-600">
                          {dateRange}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-3 text-sm text-neutral-600">
                          <span>
                            Capacity: {period.ordersPlaced}/{period.capacity}
                          </span>

                          <span>
                            Packages: {period.packages.length}
                          </span>

                          <span>
                            Offerings: {period._count.offerings}
                          </span>
                        </div>
                      </div>

                      <div className="text-sm font-medium text-neutral-500 group-open:hidden">
                        Open details &gt;
                      </div>

                      <div className="hidden text-sm font-medium text-neutral-500 group-open:block">
                        Close details ^
                      </div>
                    </div>
                  </summary>

                  <div className="border-t p-5">
                    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
                      <section className="space-y-5">
                        <div>
                          <h3 className="text-lg font-semibold">
                            Weekly Packages
                          </h3>

                          <p className="mt-1 text-sm text-neutral-500">
                            Packages are fixed price and limited to 5- or 7-day
                            options with 1 or 2 meals per day.
                          </p>
                        </div>

                        <WeeklyMealPlanPackageForm periodId={period.id} />

                        {period.packages.length > 0 ? (
                          <div className="space-y-3">
                            {period.packages.map((pkg) => {
                              const packageFormData = toPackageFormData(pkg);

                              return (
                                <details
                                  key={pkg.id}
                                  className="group rounded-xl border bg-neutral-50"
                                >
                                  <summary className="cursor-pointer list-none p-4 transition hover:bg-neutral-100">
                                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="font-semibold">
                                            {pkg.name}
                                          </p>

                                          <span
                                            className={
                                              pkg.available
                                                ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800"
                                                : "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800"
                                            }
                                          >
                                            {pkg.available
                                              ? "Available"
                                              : "Unavailable"}
                                          </span>
                                        </div>

                                        <p className="mt-1 text-sm text-neutral-600">
                                          {pkg.days} days, {pkg.mealsPerDay}{" "}
                                          meal
                                          {pkg.mealsPerDay === 1 ? "" : "s"}{" "}
                                          per day - $
                                          {Number(pkg.price).toFixed(2)}
                                        </p>
                                      </div>

                                      <div className="text-xs font-medium text-neutral-500 group-open:hidden">
                                        Edit &gt;
                                      </div>

                                      <div className="hidden text-xs font-medium text-neutral-500 group-open:block">
                                        Close ^
                                      </div>
                                    </div>
                                  </summary>

                                  <div className="border-t p-4">
                                    <WeeklyMealPlanPackageForm
                                      periodId={period.id}
                                      pkg={packageFormData}
                                    />
                                  </div>
                                </details>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-xl border bg-neutral-50 p-5 text-sm text-neutral-600">
                            No packages have been added for this weekly menu yet.
                          </div>
                        )}
                      </section>

                      <aside>
                        <WeeklyMenuPeriodForm period={periodFormData} />
                      </aside>
                    </div>
                  </div>
                </details>
              );
            })}

            {periods.length === 0 && (
              <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
                <p className="font-medium">No weekly menus yet.</p>

                <p className="mt-2 text-sm text-neutral-500">
                  Create the first weekly menu period, then add 1- and 2-meal
                  packages to it.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
