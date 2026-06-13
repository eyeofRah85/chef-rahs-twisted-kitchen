import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteWeeklyMealPlanOfferingButton } from "@/components/admin/DeleteWeeklyMealPlanOfferingButton";
import { DeleteWeeklyMealPlanOptionButton } from "@/components/admin/DeleteWeeklyMealPlanOptionButton";
import {
  WeeklyMealPlanOfferingForm,
  type WeeklyMealPlanOfferingFormData,
} from "@/components/admin/WeeklyMealPlanOfferingForm";
import {
  WeeklyMealPlanOptionForm,
  type WeeklyMealPlanAllowedOptionFormData,
} from "@/components/admin/WeeklyMealPlanOptionForm";
import {
  WeeklyMealPlanPackageForm,
  type WeeklyMealPlanPackageFormData,
} from "@/components/admin/WeeklyMealPlanPackageForm";
import {
  WeeklyMenuPeriodForm,
  type WeeklyMenuPeriodFormData,
} from "@/components/admin/WeeklyMenuPeriodForm";
import {
  WeeklyMenuCloneForm,
  type WeeklyMenuCloneSource,
} from "@/components/admin/WeeklyMenuCloneForm";
import { WeeklyOfferingAllergenEditor } from "@/components/admin/WeeklyOfferingAllergenEditor";
import { requireAdmin } from "@/lib/auth-guards";
import {
  formatApprovalStatus,
  formatOrderStatus,
  formatWeeklyMealPlanOptionType,
  formatWeeklyMenuStatus,
} from "@/lib/format-labels";
import { prisma } from "@/lib/prisma";

type AdminAllergen = {
  id: string;
  name: string;
};

type WeeklyFulfillmentSelection = {
  id: string;
  packageName: string;
  offeringName: string;
  spiceLevel: string | null;
  proteinSubstitution: string | null;
  requestOnly: boolean;
  requiresApproval: boolean;
  orderItem: {
    quantity: number;
    allergenAcknowledged: boolean;
    allergenConflictSnapshot: unknown;
    order: {
      id: string;
      customerName: string;
      status: string;
      approvalStatus: string;
      requestedDateTime: Date | null;
    };
  };
};

type FulfillmentCountRow = {
  label: string;
  quantity: number;
  orderCount: number;
};

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

function formatDisplayDateTime(date: Date | null) {
  if (!date) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);

  nextDate.setUTCDate(nextDate.getUTCDate() + days);

  return nextDate;
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

function toCloneSource(period: {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
  orderCutoffAt: Date | null;
  fulfillmentNotes: string | null;
  capacity: number;
  packages: unknown[];
  offerings: unknown[];
}): WeeklyMenuCloneSource {
  return {
    id: period.id,
    label: period.label,
    suggestedLabel: `Copy of ${period.label}`,
    suggestedStartDate: formatDateInput(addDays(period.startDate, 7)),
    suggestedEndDate: formatDateInput(addDays(period.endDate, 7)),
    suggestedOrderCutoffAt: formatDateTimeInput(
      period.orderCutoffAt ? addDays(period.orderCutoffAt, 7) : null,
    ),
    fulfillmentNotes: period.fulfillmentNotes,
    capacity: period.capacity,
    packageCount: period.packages.length,
    offeringCount: period.offerings.length,
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

function toOfferingFormData(offering: {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  dietaryInfo: string | null;
  available: boolean;
  displayOrder: number;
}): WeeklyMealPlanOfferingFormData {
  return {
    id: offering.id,
    name: offering.name,
    description: offering.description,
    imageUrl: offering.imageUrl,
    dietaryInfo: offering.dietaryInfo,
    available: offering.available,
    displayOrder: offering.displayOrder,
  };
}

function toOptionFormData(option: {
  id: string;
  optionType: string;
  name: string;
  description: string | null;
  dietaryInfo: string | null;
  priceDelta: unknown;
  requestOnly: boolean;
  requiresApproval: boolean;
  available: boolean;
  displayOrder: number;
}): WeeklyMealPlanAllowedOptionFormData {
  return {
    id: option.id,
    optionType: option.optionType,
    name: option.name,
    description: option.description,
    dietaryInfo: option.dietaryInfo,
    priceDelta: Number(option.priceDelta),
    requestOnly: option.requestOnly,
    requiresApproval: option.requiresApproval,
    available: option.available,
    displayOrder: option.displayOrder,
  };
}

function isActiveFulfillmentSelection(selection: WeeklyFulfillmentSelection) {
  const order = selection.orderItem.order;

  return (
    order.approvalStatus !== "DENIED" &&
    order.status !== "CANCELLED" &&
    order.status !== "REFUNDED"
  );
}

function sumSelectionQuantity(selections: WeeklyFulfillmentSelection[]) {
  return selections.reduce(
    (total, selection) => total + selection.orderItem.quantity,
    0,
  );
}

function countFlaggedQuantity(
  selections: WeeklyFulfillmentSelection[],
  predicate: (selection: WeeklyFulfillmentSelection) => boolean,
) {
  return selections.reduce(
    (total, selection) =>
      predicate(selection) ? total + selection.orderItem.quantity : total,
    0,
  );
}

function getAllergenConflictNames(snapshot: unknown) {
  if (!Array.isArray(snapshot)) {
    return [];
  }

  return snapshot
    .map((entry) => {
      if (!entry || typeof entry !== "object" || !("name" in entry)) {
        return null;
      }

      const name = (entry as { name?: unknown }).name;

      return typeof name === "string" ? name : null;
    })
    .filter((name): name is string => Boolean(name));
}

function buildFulfillmentCountRows(
  selections: WeeklyFulfillmentSelection[],
  getLabel: (selection: WeeklyFulfillmentSelection) => string,
) {
  const rowsByLabel = new Map<
    string,
    {
      quantity: number;
      orderIds: Set<string>;
    }
  >();

  for (const selection of selections) {
    const label = getLabel(selection);
    const current = rowsByLabel.get(label) ?? {
      quantity: 0,
      orderIds: new Set<string>(),
    };

    current.quantity += selection.orderItem.quantity;
    current.orderIds.add(selection.orderItem.order.id);
    rowsByLabel.set(label, current);
  }

  return Array.from(rowsByLabel.entries())
    .map(([label, row]): FulfillmentCountRow => ({
      label,
      quantity: row.quantity,
      orderCount: row.orderIds.size,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function FulfillmentCountList({ rows }: { rows: FulfillmentCountRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg bg-white/70 p-3 text-sm text-neutral-500">
        No active weekly selections.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-start justify-between gap-3 rounded-lg bg-white/80 p-3 text-sm"
        >
          <div>
            <p className="font-medium text-neutral-900">{row.label}</p>
            <p className="mt-1 text-xs text-neutral-500">
              {row.orderCount} order{row.orderCount === 1 ? "" : "s"}
            </p>
          </div>

          <p className="font-semibold">{row.quantity}</p>
        </div>
      ))}
    </div>
  );
}

export default async function AdminWeeklyMenuPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const [periods, allergens] = await Promise.all([
    prisma.weeklyMenuPeriod.findMany({
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
        offerings: {
          orderBy: [
            {
              displayOrder: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
          include: {
            allergens: {
              include: {
                allergen: true,
              },
            },
            options: {
              orderBy: [
                {
                  optionType: "asc",
                },
                {
                  displayOrder: "asc",
                },
                {
                  createdAt: "asc",
                },
              ],
            },
          },
        },
        _count: {
          select: {
            orderSelections: true,
          },
        },
        orderSelections: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            packageName: true,
            offeringName: true,
            spiceLevel: true,
            proteinSubstitution: true,
            requestOnly: true,
            requiresApproval: true,
            orderItem: {
              select: {
                quantity: true,
                allergenAcknowledged: true,
                allergenConflictSnapshot: true,
                order: {
                  select: {
                    id: true,
                    customerName: true,
                    status: true,
                    approvalStatus: true,
                    requestedDateTime: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.allergen.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);
  const allergenOptions: AdminAllergen[] = allergens;

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
            2-meal packages for the public weekly menu and fulfillment prep.
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-[380px_1fr]">
          <aside className="xl:sticky xl:top-24 xl:self-start">
            <WeeklyMenuPeriodForm />
          </aside>

          <section className="space-y-5">
            {periods.map((period) => {
              const periodFormData = toPeriodFormData(period);
              const cloneSource = toCloneSource(period);
              const dateRange = `${formatDisplayDate(
                period.startDate,
              )} - ${formatDisplayDate(period.endDate)}`;
              const spotsRemaining = Math.max(
                period.capacity - period.ordersPlaced,
                0,
              );
              const fulfillmentSelections =
                period.orderSelections as WeeklyFulfillmentSelection[];
              const activeFulfillmentSelections =
                fulfillmentSelections.filter(isActiveFulfillmentSelection);
              const inactiveSelectionCount =
                fulfillmentSelections.length - activeFulfillmentSelections.length;
              const activeFulfillmentQuantity = sumSelectionQuantity(
                activeFulfillmentSelections,
              );
              const activeFulfillmentOrderCount = new Set(
                activeFulfillmentSelections.map(
                  (selection) => selection.orderItem.order.id,
                ),
              ).size;
              const packageRows = buildFulfillmentCountRows(
                activeFulfillmentSelections,
                (selection) => selection.packageName,
              );
              const offeringRows = buildFulfillmentCountRows(
                activeFulfillmentSelections,
                (selection) => selection.offeringName,
              );
              const spiceRows = buildFulfillmentCountRows(
                activeFulfillmentSelections,
                (selection) => selection.spiceLevel ?? "No spice selected",
              );
              const proteinRows = buildFulfillmentCountRows(
                activeFulfillmentSelections,
                (selection) =>
                  selection.proteinSubstitution ?? "No protein substitution",
              );
              const requestOnlyQuantity = countFlaggedQuantity(
                activeFulfillmentSelections,
                (selection) => selection.requestOnly,
              );
              const approvalRequiredQuantity = countFlaggedQuantity(
                activeFulfillmentSelections,
                (selection) => selection.requiresApproval,
              );
              const allergenFlagQuantity = countFlaggedQuantity(
                activeFulfillmentSelections,
                (selection) =>
                  getAllergenConflictNames(
                    selection.orderItem.allergenConflictSnapshot,
                  ).length > 0,
              );
              const allergenConflictNames = Array.from(
                new Set(
                  activeFulfillmentSelections.flatMap((selection) =>
                    getAllergenConflictNames(
                      selection.orderItem.allergenConflictSnapshot,
                    ),
                  ),
                ),
              ).sort((a, b) => a.localeCompare(b));

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
                            Capacity used: {period.ordersPlaced}/
                            {period.capacity}
                            {" - "}
                            {spotsRemaining === 0
                              ? "sold out"
                              : `${spotsRemaining} left`}
                          </span>

                          <span>
                            Packages: {period.packages.length}
                          </span>

                          <span>
                            Offerings: {period.offerings.length}
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
                        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                            <div>
                              <h3 className="text-lg font-semibold">
                                Weekly Fulfillment Prep
                              </h3>

                              <p className="mt-1 text-sm text-emerald-950">
                                {activeFulfillmentQuantity} weekly meal plan
                                item
                                {activeFulfillmentQuantity === 1 ? "" : "s"}{" "}
                                across {activeFulfillmentOrderCount} active
                                order
                                {activeFulfillmentOrderCount === 1 ? "" : "s"}.
                              </p>
                            </div>

                            <Link
                              href="/admin/kitchen"
                              className="inline-flex rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-950"
                            >
                              Open Kitchen Board
                            </Link>
                          </div>

                          {period.fulfillmentNotes && (
                            <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-4 text-sm text-emerald-950">
                              <p className="font-semibold">
                                Fulfillment Notes
                              </p>
                              <p className="mt-2 whitespace-pre-wrap">
                                {period.fulfillmentNotes}
                              </p>
                            </div>
                          )}

                          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                            <div className="rounded-xl bg-white p-4">
                              <p className="text-xs font-medium uppercase text-neutral-500">
                                Capacity
                              </p>
                              <p className="mt-2 text-2xl font-bold">
                                {period.ordersPlaced}/{period.capacity}
                              </p>
                              <p className="mt-1 text-xs text-neutral-500">
                                {spotsRemaining} remaining
                              </p>
                            </div>

                            <div className="rounded-xl bg-white p-4">
                              <p className="text-xs font-medium uppercase text-neutral-500">
                                Active Orders
                              </p>
                              <p className="mt-2 text-2xl font-bold">
                                {activeFulfillmentOrderCount}
                              </p>
                            </div>

                            <div className="rounded-xl bg-white p-4">
                              <p className="text-xs font-medium uppercase text-neutral-500">
                                Request Only
                              </p>
                              <p className="mt-2 text-2xl font-bold">
                                {requestOnlyQuantity}
                              </p>
                            </div>

                            <div className="rounded-xl bg-white p-4">
                              <p className="text-xs font-medium uppercase text-neutral-500">
                                Approval Required
                              </p>
                              <p className="mt-2 text-2xl font-bold">
                                {approvalRequiredQuantity}
                              </p>
                            </div>

                            <div className="rounded-xl bg-white p-4">
                              <p className="text-xs font-medium uppercase text-neutral-500">
                                Allergen Flags
                              </p>
                              <p className="mt-2 text-2xl font-bold">
                                {allergenFlagQuantity}
                              </p>
                            </div>
                          </div>

                          {inactiveSelectionCount > 0 && (
                            <p className="mt-3 text-xs text-neutral-600">
                              {inactiveSelectionCount} selection
                              {inactiveSelectionCount === 1 ? "" : "s"} from
                              denied, cancelled, or refunded orders excluded
                              from prep counts.
                            </p>
                          )}

                          {allergenConflictNames.length > 0 && (
                            <p className="mt-3 text-sm font-medium text-red-800">
                              Allergen conflicts:{" "}
                              {allergenConflictNames.join(", ")}
                            </p>
                          )}

                          <div className="mt-5 grid gap-4 xl:grid-cols-4">
                            <div>
                              <h4 className="mb-2 text-sm font-semibold">
                                By Offering
                              </h4>
                              <FulfillmentCountList rows={offeringRows} />
                            </div>

                            <div>
                              <h4 className="mb-2 text-sm font-semibold">
                                By Package
                              </h4>
                              <FulfillmentCountList rows={packageRows} />
                            </div>

                            <div>
                              <h4 className="mb-2 text-sm font-semibold">
                                By Spice Level
                              </h4>
                              <FulfillmentCountList rows={spiceRows} />
                            </div>

                            <div>
                              <h4 className="mb-2 text-sm font-semibold">
                                By Protein
                              </h4>
                              <FulfillmentCountList rows={proteinRows} />
                            </div>
                          </div>

                          <div className="mt-5">
                            <h4 className="mb-2 text-sm font-semibold">
                              Active Weekly Orders
                            </h4>

                            {activeFulfillmentSelections.length > 0 ? (
                              <div className="space-y-2">
                                {activeFulfillmentSelections.map(
                                  (selection) => {
                                    const order = selection.orderItem.order;

                                    return (
                                      <Link
                                        key={selection.id}
                                        href={`/admin/orders/${order.id}`}
                                        className="block rounded-lg bg-white/80 p-3 text-sm transition hover:bg-white"
                                      >
                                        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                                          <div>
                                            <p className="font-medium">
                                              {order.customerName}
                                            </p>

                                            <p className="mt-1 text-neutral-600">
                                              {selection.orderItem.quantity} x{" "}
                                              {selection.packageName} -{" "}
                                              {selection.offeringName}
                                            </p>

                                            <p className="mt-1 text-xs text-neutral-500">
                                              Spice:{" "}
                                              {selection.spiceLevel ??
                                                "Not selected"}{" "}
                                              | Protein:{" "}
                                              {selection.proteinSubstitution ??
                                                "No substitution"}
                                            </p>

                                            <p className="mt-1 text-xs text-neutral-500">
                                              Requested:{" "}
                                              {formatDisplayDateTime(
                                                order.requestedDateTime,
                                              )}
                                            </p>
                                          </div>

                                          <div className="flex flex-wrap gap-2 lg:justify-end">
                                            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                                              {formatOrderStatus(order.status)}
                                            </span>

                                            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                                              {formatApprovalStatus(
                                                order.approvalStatus,
                                              )}
                                            </span>

                                            {selection.requestOnly && (
                                              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                                                Request Only
                                              </span>
                                            )}

                                            {getAllergenConflictNames(
                                              selection.orderItem
                                                .allergenConflictSnapshot,
                                            ).length > 0 && (
                                              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                                                Allergen Flag
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </Link>
                                    );
                                  },
                                )}
                              </div>
                            ) : (
                              <p className="rounded-lg bg-white/70 p-3 text-sm text-neutral-500">
                                No active weekly orders for this period yet.
                              </p>
                            )}
                          </div>
                        </section>

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

                        <section className="border-t pt-5">
                          <div>
                            <h3 className="text-lg font-semibold">
                              Weekly Offerings
                            </h3>

                            <p className="mt-1 text-sm text-neutral-500">
                              Offerings are the fixed meals customers will see
                              for this weekly menu. Add allergen tags and the
                              allowed spice or protein choices to each offering.
                            </p>
                          </div>

                          <div className="mt-5">
                            <WeeklyMealPlanOfferingForm periodId={period.id} />
                          </div>

                          {period.offerings.length > 0 ? (
                            <div className="mt-5 space-y-3">
                              {period.offerings.map((offering) => {
                                const offeringFormData =
                                  toOfferingFormData(offering);
                                const selectedAllergenIds =
                                  offering.allergens.map(
                                    (entry) => entry.allergen.id,
                                  );
                                const selectedAllergenNames =
                                  offering.allergens.map(
                                    (entry) => entry.allergen.name,
                                  );

                                return (
                                  <details
                                    key={offering.id}
                                    className="group rounded-xl border bg-neutral-50"
                                  >
                                    <summary className="cursor-pointer list-none p-4 transition hover:bg-neutral-100">
                                      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                                        <div>
                                          <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-semibold">
                                              {offering.name}
                                            </p>

                                            <span
                                              className={
                                                offering.available
                                                  ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800"
                                                  : "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800"
                                              }
                                            >
                                              {offering.available
                                                ? "Available"
                                                : "Unavailable"}
                                            </span>
                                          </div>

                                          <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
                                            {offering.description}
                                          </p>

                                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-500">
                                            <span>
                                              Allergens:{" "}
                                              {selectedAllergenNames.length > 0
                                                ? selectedAllergenNames.join(
                                                    ", ",
                                                  )
                                                : "None"}
                                            </span>

                                            <span>
                                              Options: {offering.options.length}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="text-xs font-medium text-neutral-500 group-open:hidden">
                                          Manage &gt;
                                        </div>

                                        <div className="hidden text-xs font-medium text-neutral-500 group-open:block">
                                          Close ^
                                        </div>
                                      </div>
                                    </summary>

                                    <div className="space-y-5 border-t p-4">
                                      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
                                        <WeeklyMealPlanOfferingForm
                                          periodId={period.id}
                                          offering={offeringFormData}
                                        />

                                        <div className="space-y-3">
                                          {offering.imageUrl && (
                                            <div className="rounded-xl border bg-white p-4 text-sm text-neutral-600">
                                              <p className="font-medium text-neutral-900">
                                                Image URL
                                              </p>
                                              <p className="mt-2 break-all">
                                                {offering.imageUrl}
                                              </p>
                                            </div>
                                          )}

                                          <DeleteWeeklyMealPlanOfferingButton
                                            offeringId={offering.id}
                                            offeringName={offering.name}
                                          />
                                        </div>
                                      </div>

                                      <WeeklyOfferingAllergenEditor
                                        offeringId={offering.id}
                                        allergens={allergenOptions}
                                        selectedAllergenIds={
                                          selectedAllergenIds
                                        }
                                      />

                                      <section className="space-y-4 rounded-xl border bg-white p-4">
                                        <div>
                                          <h4 className="font-semibold">
                                            Spice and Protein Options
                                          </h4>

                                          <p className="mt-1 text-sm text-neutral-500">
                                            Customers can choose spice level and
                                            approved protein substitutions only.
                                          </p>
                                        </div>

                                        <WeeklyMealPlanOptionForm
                                          offeringId={offering.id}
                                        />

                                        {offering.options.length > 0 ? (
                                          <div className="space-y-3">
                                            {offering.options.map((option) => {
                                              const optionFormData =
                                                toOptionFormData(option);

                                              return (
                                                <details
                                                  key={option.id}
                                                  className="group rounded-xl border bg-neutral-50"
                                                >
                                                  <summary className="cursor-pointer list-none p-4 transition hover:bg-neutral-100">
                                                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                                                      <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                          <p className="font-semibold">
                                                            {option.name}
                                                          </p>

                                                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-700">
                                                            {formatWeeklyMealPlanOptionType(
                                                              option.optionType,
                                                            )}
                                                          </span>

                                                          {option.requiresApproval && (
                                                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                                                              Approval Required
                                                            </span>
                                                          )}

                                                          {!option.available && (
                                                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                                                              Unavailable
                                                            </span>
                                                          )}
                                                        </div>

                                                        <p className="mt-1 text-sm text-neutral-600">
                                                          +$
                                                          {Number(
                                                            option.priceDelta,
                                                          ).toFixed(2)}
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

                                                  <div className="space-y-3 border-t p-4">
                                                    <WeeklyMealPlanOptionForm
                                                      offeringId={offering.id}
                                                      option={optionFormData}
                                                    />

                                                    <DeleteWeeklyMealPlanOptionButton
                                                      optionId={option.id}
                                                      optionName={option.name}
                                                    />
                                                  </div>
                                                </details>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <div className="rounded-xl border bg-neutral-50 p-4 text-sm text-neutral-600">
                                            No spice or protein options have
                                            been added for this offering yet.
                                          </div>
                                        )}
                                      </section>
                                    </div>
                                  </details>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="mt-5 rounded-xl border bg-neutral-50 p-5 text-sm text-neutral-600">
                              No offerings have been added for this weekly menu
                              yet.
                            </div>
                          )}
                        </section>
                      </section>

                      <aside className="space-y-5">
                        <WeeklyMenuPeriodForm period={periodFormData} />
                        <WeeklyMenuCloneForm source={cloneSource} />
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
