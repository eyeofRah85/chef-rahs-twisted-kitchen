import { prisma } from "@/lib/prisma";
import { MenuCard } from "@/components/menu/MenuCard";
import { MenuCategoryFilter } from "@/components/menu/MenuCategoryFilter";
import { WeeklyMenuSection } from "@/components/menu/WeeklyMenuSection";
import { filterMealPlanCustomerOptionGroups } from "@/lib/meal-plan-options";
import {
  formatWeeklyMenuDisplayDate,
  getWeeklyMenuQueryDateRange,
} from "@/lib/weekly-menu-dates";
import type { DecimalLike } from "@/types/display";
import type { PublicWeeklyMenu } from "@/types/weekly-menu";

export const dynamic = "force-dynamic";

type PublicMenuCategory = {
  id: string;
  name: string;
  items: {
    id: string;
    name: string;
    type: string;
    description: string;
    price: DecimalLike;
    imageUrl: string | null;
    available: boolean;
    seasonal: boolean;
    requiresApproval: boolean;
    customerInstructionsEnabled: boolean;
    allergens: {
      allergen: {
        id: string;
        name: string;
      };
    }[];
    optionGroups: {
      id: string;
      name: string;
      required: boolean;
      multiple: boolean;
      choices: {
        id: string;
        name: string;
        description: string | null;
        dietaryInfo: string | null;
        imageUrl: string | null;
        requestOnly: boolean;
        priceDelta: DecimalLike;
      }[];
    }[];
  }[];
};

function formatMenuDate(date: Date) {
  return formatWeeklyMenuDisplayDate(date);
}

function formatMenuDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function toCategoryId(category: string) {
  return category.toLowerCase().replace(/\s+/g, "-");
}

function toPublicWeeklyMenu(weeklyMenu: {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
  orderCutoffAt: Date | null;
  capacity: number;
  ordersPlaced: number;
  packages: {
    id: string;
    name: string;
    days: number;
    mealsPerDay: number;
    price: DecimalLike;
    notes: string | null;
  }[];
  offerings: {
    id: string;
    name: string;
    description: string;
    imageUrl: string | null;
    dietaryInfo: string | null;
    allergens: {
      allergen: {
        id: string;
        name: string;
      };
    }[];
    options: {
      id: string;
      optionType: string;
      name: string;
      description: string | null;
      dietaryInfo: string | null;
      priceDelta: DecimalLike;
      requestOnly: boolean;
      requiresApproval: boolean;
    }[];
  }[];
}): PublicWeeklyMenu {
  return {
    id: weeklyMenu.id,
    label: weeklyMenu.label,
    dateRange: `${formatMenuDate(weeklyMenu.startDate)} - ${formatMenuDate(
      weeklyMenu.endDate,
    )}`,
    orderCutoffLabel: weeklyMenu.orderCutoffAt
      ? formatMenuDateTime(weeklyMenu.orderCutoffAt)
      : null,
    orderingClosed: weeklyMenu.orderCutoffAt
      ? weeklyMenu.orderCutoffAt < new Date()
      : false,
    capacity: weeklyMenu.capacity,
    ordersPlaced: weeklyMenu.ordersPlaced,
    packages: weeklyMenu.packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      days: pkg.days,
      mealsPerDay: pkg.mealsPerDay,
      price: Number(pkg.price),
      notes: pkg.notes,
    })),
    offerings: weeklyMenu.offerings.map((offering) => ({
      id: offering.id,
      name: offering.name,
      description: offering.description,
      imageUrl: offering.imageUrl,
      dietaryInfo: offering.dietaryInfo,
      allergens: offering.allergens.map((entry) => ({
        id: entry.allergen.id,
        name: entry.allergen.name,
      })),
      options: offering.options.map((option) => ({
        id: option.id,
        optionType: option.optionType,
        name: option.name,
        description: option.description,
        dietaryInfo: option.dietaryInfo,
        priceDelta: Number(option.priceDelta),
        requestOnly: option.requestOnly,
        requiresApproval: option.requiresApproval,
      })),
    })),
  };
}

export default async function MenuPage() {
  const today = new Date();
  const { dayStart, dayEnd } = getWeeklyMenuQueryDateRange(today);

  const [categories, weeklyMenu] = await Promise.all([
    prisma.menuCategory.findMany({
      orderBy: {
        sortOrder: "asc",
      },
      include: {
        items: {
          where: {
            archived: false,
            type: {
              not: "CATERING",
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
            allergens: {
              include: {
                allergen: true,
              },
            },
            optionGroups: {
              include: {
                choices: true,
              },
            },
          },
        },
      },
    }) as Promise<PublicMenuCategory[]>,
    prisma.weeklyMenuPeriod.findFirst({
      where: {
        status: "PUBLISHED",
        startDate: {
          lte: dayEnd,
        },
        endDate: {
          gte: dayStart,
        },
      },
      orderBy: {
        startDate: "desc",
      },
      include: {
        packages: {
          where: {
            available: true,
          },
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
          where: {
            available: true,
          },
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
              where: {
                available: true,
              },
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
      },
    }),
  ]);

  const visibleCategories = categories.filter(
    (category) => category.items.length > 0,
  );
  const publicWeeklyMenu = weeklyMenu ? toPublicWeeklyMenu(weeklyMenu) : null;
  const filterCategories = [
    ...(publicWeeklyMenu ? ["Weekly Meal Plans"] : []),
    ...visibleCategories.map((category) => category.name),
  ];

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Meal Plans & A La Carte
          </p>

          <h1 className="mt-3 text-5xl font-bold">
            Weekly meal plans and chef-prepared a la carte options.
          </h1>

          <p className="mt-4 max-w-2xl text-neutral-700">
            Choose fixed meal plan offerings, select spice level and allowed
            protein substitutions, or explore a la carte options. Pork and beef
            are available by request only for meal plans, and pricing may vary.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
          <h2 className="text-xl font-semibold">Meal Plan Notes</h2>

          <p className="mt-2 text-sm leading-6">
            Meal plans are fixed offerings prepared by the business.
            Customer-facing choices are limited to spice level and allowed
            protein substitutions. Pork and beef are available by request only
            and pricing may vary.
          </p>
        </div>

        {filterCategories.length > 0 && (
          <MenuCategoryFilter categories={filterCategories} />
        )}

        <div className="space-y-10">
          {publicWeeklyMenu && (
            <WeeklyMenuSection weeklyMenu={publicWeeklyMenu} />
          )}

          {visibleCategories.map((category) => (
            <section key={category.id} id={toCategoryId(category.name)}>
              <h2 className="mb-4 text-2xl font-semibold">{category.name}</h2>

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {category.items.map((item) => {
                  const optionGroups = filterMealPlanCustomerOptionGroups(
                    item.type,
                    item.optionGroups,
                  );

                  return (
                    <MenuCard
                      key={item.id}
                      item={{
                        id: item.id,
                        name: item.name,
                        type: item.type,
                        description: item.description,
                        price: Number(item.price),
                        category: category.name,
                        imageUrl: item.imageUrl ?? undefined,
                        available: item.available,
                        seasonal: item.seasonal,
                        allergens: item.allergens.map((entry) => ({
                          id: entry.allergen.id,
                          name: entry.allergen.name,
                        })),
                        requiresApproval: item.requiresApproval,
                        customerInstructionsEnabled:
                          item.customerInstructionsEnabled,
                        optionGroups: optionGroups.map((group) => ({
                          id: group.id,
                          name: group.name,
                          required: group.required,
                          multiple: group.multiple,
                          choices: group.choices.map((choice) => ({
                            id: choice.id,
                            name: choice.name,
                            description: choice.description,
                            dietaryInfo: choice.dietaryInfo,
                            imageUrl: choice.imageUrl,
                            requestOnly: choice.requestOnly,
                            priceDelta: Number(choice.priceDelta),
                          })),
                        })),
                      }}
                    />
                  );
                })}
              </div>
            </section>
          ))}

          {visibleCategories.length === 0 && !publicWeeklyMenu && (
            <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
              <h2 className="text-2xl font-semibold">Menu coming soon</h2>
              <p className="mt-2 text-neutral-600">
                No meal plan or menu items are available yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
