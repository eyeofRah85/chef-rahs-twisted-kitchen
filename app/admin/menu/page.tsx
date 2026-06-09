import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { MenuItemForm } from "@/components/admin/MenuItemForm";
import { MenuItemCustomizationEditor } from "@/components/admin/MenuItemCustomizationEditor";
import { MenuAvailabilityToggle } from "@/components/admin/MenuAvailabilityToggle";
import { MenuItemEditForm } from "@/components/admin/MenuItemEditForm";
import { DeleteOptionGroupButton } from "@/components/admin/DeleteOptionGroupButton";
import { EditOptionChoiceForm } from "@/components/admin/EditOptionChoiceForm";
import { ApplyMealPlanTemplateButton } from "@/components/admin/ApplyMealPlanTemplateButton";
import { ArchiveMenuItemButton } from "@/components/admin/ArchiveMenuItemButton";
import { DeleteMenuItemButton } from "@/components/admin/DeleteMenuItemButton";
import { formatMenuItemType } from "@/lib/format-labels";
import { parseEnumValue } from "@/lib/enum-values";
import { menuItemTypes } from "@/lib/prisma-enums";
import type { DecimalLike } from "@/types/display";

type PageProps = {
  searchParams: Promise<{
    type?: string;
  }>;
};

const menuTypeTabs = [
  { label: "All", value: "ALL" },
  { label: "Meal Plans", value: "MEAL_PLAN" },
  { label: "A La Carte", value: "A_LA_CARTE" },
  { label: "Catering Related", value: "CATERING" },
  { label: "Plate / Legacy", value: "PLATE" },
  { label: "Desserts", value: "DESSERT" },
  { label: "Sides", value: "SIDE" },
  { label: "Other", value: "OTHER" },
];

type AdminAllergen = {
  id: string;
  name: string;
};

type AdminMenuChoice = {
  id: string;
  name: string;
  description: string | null;
  dietaryInfo: string | null;
  imageUrl: string | null;
  requestOnly: boolean;
  priceDelta: DecimalLike;
};

type AdminMenuOptionGroup = {
  id: string;
  name: string;
  required: boolean;
  multiple: boolean;
  choices: AdminMenuChoice[];
};

type AdminMenuItem = {
  id: string;
  name: string;
  description: string;
  price: DecimalLike;
  type: string;
  available: boolean;
  seasonal: boolean;
  requiresApproval: boolean;
  customerInstructionsEnabled: boolean;
  optionGroups: AdminMenuOptionGroup[];
};

type AdminMenuCategory = {
  id: string;
  name: string;
  items: AdminMenuItem[];
};

export default async function AdminMenuPage({ searchParams }: PageProps) {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const params = await searchParams;
  const selectedType =
    parseEnumValue(menuItemTypes, params.type) ?? "ALL";

  const categories = (await prisma.menuCategory.findMany({
    orderBy: { sortOrder: "asc" },

    include: {
      items: {
        where: {
          archived: false,
          ...(selectedType !== "ALL"
            ? {
                type: selectedType,
              }
            : {}),
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
  })) as AdminMenuCategory[];

  const allergens = (await prisma.allergen.findMany({
    orderBy: {
      name: "asc",
    },
  })) as AdminAllergen[];

  const visibleCategories = categories.filter(
    (category) => category.items.length > 0,
  );

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link className="text-sm font-medium underline" href="/admin">
            &larr; Back to Dashboard
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Admin
          </p>

          <h1 className="mt-3 text-4xl font-bold">Menu Manager</h1>

          <p className="mt-3 max-w-3xl text-neutral-700">
            Manage weekly meal plans, a la carte items, customer-facing options,
            pricing, availability, substitutions, and request-only choices.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/admin/menu/archived"
            className="inline-flex rounded-xl border bg-white px-4 py-2 text-sm font-medium shadow-sm"
          >
            View Archived Items
          </Link>

          <Link
            href="/admin/menu/categories"
            className="inline-flex rounded-xl border bg-white px-4 py-2 text-sm font-medium shadow-sm"
          >
            Manage Categories
          </Link>
        </div>

        <div className="mb-8 rounded-2xl border bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold">Menu Type</p>
          <p className="mb-4 text-sm text-neutral-600">
            Personal chef services are handled through service requests, not menu items.
          </p>
          <div className="flex flex-wrap gap-2">
            {menuTypeTabs.map((tab) => {
              const active = selectedType === tab.value;

              return (
                <Link
                  key={tab.value}
                  href={
                    tab.value === "ALL"
                      ? "/admin/menu"
                      : `/admin/menu?type=${tab.value}`
                  }
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-black text-white"
                      : "bg-white hover:bg-neutral-100"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[380px_1fr]">
          <aside className="xl:sticky xl:top-24 xl:self-start">
            <MenuItemForm />
          </aside>

          <section className="space-y-8">
            {visibleCategories.map((category) => (
              <div
                key={category.id}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold">
                      {category.name}
                    </h2>

                    <p className="mt-1 text-sm text-neutral-500">
                      Showing {category.items.length} item
                      {category.items.length === 1 ? "" : "s"}
                      {selectedType !== "ALL"
                        ? ` in ${formatMenuItemType(selectedType)}`
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  {category.items.map((item) => (
                  <details
                      key={item.id}
                      className="group rounded-2xl border bg-neutral-50 shadow-sm open:bg-white"
                    >
                      <summary className="cursor-pointer list-none rounded-2xl p-5 transition hover:bg-neutral-100">
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-xl font-semibold">{item.name}</h3>

                              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-600">
                                {formatMenuItemType(item.type)}
                              </span>

                              {item.seasonal && (
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                                  Seasonal
                                </span>
                              )}

                              {item.requiresApproval && (
                                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                                  Approval Required
                                </span>
                              )}

                              {item.customerInstructionsEnabled && (
                                <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-medium text-neutral-700">
                                  Instructions Enabled
                                </span>
                              )}
                            </div>

                            <p className="mt-2 line-clamp-2 text-sm text-neutral-600">
                              {item.description}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                              <span className="font-bold">
                                ${Number(item.price).toFixed(2)}
                              </span>

                              <span
                                className={
                                  item.available
                                    ? "font-medium text-green-700"
                                    : "font-medium text-red-700"
                                }
                              >
                                {item.available ? "Available" : "Unavailable"}
                              </span>

                              <span className="text-neutral-500">
                                {item.optionGroups.length} option group
                                {item.optionGroups.length === 1 ? "" : "s"}
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
                        <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
                          <div className="rounded-xl border bg-white p-4">
                            <h4 className="font-semibold">Item Details</h4>

                            <p className="mt-3 text-sm leading-6 text-neutral-700">
                              {item.description}
                            </p>

                            <p className="mt-3 text-lg font-bold">
                              ${Number(item.price).toFixed(2)}
                            </p>
                          </div>

                          <div className="rounded-xl border bg-white p-4">
                            <p className="text-sm font-semibold">Actions</p>

                            <div className="mt-3 grid gap-2">
                              <MenuAvailabilityToggle
                                menuItemId={item.id}
                                available={item.available}
                              />

                              <MenuItemEditForm
                                item={{
                                  id: item.id,
                                  name: item.name,
                                  description: item.description,
                                  price: Number(item.price),
                                  type: item.type,
                                  categoryName: category.name,
                                  seasonal: item.seasonal,
                                  requiresApproval: item.requiresApproval,
                                  customerInstructionsEnabled:
                                    item.customerInstructionsEnabled,
                                }}
                              />

                              <ArchiveMenuItemButton menuItemId={item.id} />

                              <DeleteMenuItemButton
                                menuItemId={item.id}
                                itemName={item.name}
                              />

                              {item.type === "MEAL_PLAN" && (
                              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                                <p className="mb-2 text-xs text-amber-900">
                                  Adds meal plan length, meals per day, protein, vegetable, starch, and
                                  substitution choices.
                                </p>

                                <ApplyMealPlanTemplateButton menuItemId={item.id} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {item.optionGroups.length > 0 && (
                        <section className="mt-6 rounded-2xl border bg-white p-5">
                          <div className="mb-4">
                            <h4 className="text-lg font-semibold">
                              Option Groups
                            </h4>

                            <p className="mt-1 text-sm text-neutral-500">
                              Customer-facing choices for this item.
                            </p>
                          </div>

                          <div className="space-y-5">
                            {item.optionGroups.map((group) => (
                              <details
                                key={group.id}
                                className="group rounded-xl border bg-neutral-50"
                              >
                                <summary className="cursor-pointer list-none p-4 transition hover:bg-neutral-100">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                      <p className="font-semibold">{group.name}</p>

                                      <p className="mt-1 text-xs text-neutral-500">
                                        {group.required ? "Required" : "Optional"} -{" "}
                                        {group.multiple ? "Multiple" : "Single"} -{" "}
                                        {group.choices.length} choice
                                        {group.choices.length === 1 ? "" : "s"}
                                      </p>
                                    </div>

                                    <div className="text-xs font-medium text-neutral-500 group-open:hidden">
                                      Open choices &gt;
                                    </div>

                                    <div className="hidden text-xs font-medium text-neutral-500 group-open:block">
                                      Close choices ^
                                    </div>
                                  </div>
                                </summary>

                                <div className="border-t p-4">
                                  <div className="mb-4 flex justify-end">
                                    <DeleteOptionGroupButton optionGroupId={group.id} />
                                  </div>

                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                  {group.choices.map((choice) => (
                                    <div
                                      key={choice.id}
                                      className="rounded-xl border bg-white p-4"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-medium">
                                              {choice.name}
                                            </p>

                                            {choice.requestOnly && (
                                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                                                Request Only
                                              </span>
                                            )}
                                          </div>

                                          {choice.description && (
                                            <p className="mt-2 text-xs leading-5 text-neutral-600">
                                              {choice.description}
                                            </p>
                                          )}

                                          {choice.dietaryInfo && (
                                            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                                              {choice.dietaryInfo}
                                            </p>
                                          )}

                                          {choice.imageUrl && (
                                            <p className="mt-2 truncate text-xs text-neutral-500">
                                              Image: {choice.imageUrl}
                                            </p>
                                          )}

                                          {Number(choice.priceDelta) > 0 && (
                                            <p className="mt-2 text-sm font-semibold">
                                              +$
                                              {Number(
                                                choice.priceDelta,
                                              ).toFixed(2)}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      <EditOptionChoiceForm
                                        choice={{
                                          id: choice.id,
                                          name: choice.name,
                                          description: choice.description,
                                          dietaryInfo: choice.dietaryInfo,
                                          imageUrl: choice.imageUrl,
                                          requestOnly: choice.requestOnly,
                                          priceDelta: Number(
                                            choice.priceDelta,
                                          ),
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                              </details>
                            ))}
                          </div>
                        </section>
                      )}

                      <section className="mt-6 rounded-2xl border bg-white p-5">
                        <h4 className="text-lg font-semibold">
                          Add / Manage Customizations
                        </h4>

                        <p className="mt-1 text-sm text-neutral-500">
                          Add allergens, meal plan choices, substitutions,
                          request-only options, and customer-facing selections.
                        </p>

                        <MenuItemCustomizationEditor
                          menuItemId={item.id}
                          allergens={allergens}
                        />
                      </section>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}

            {visibleCategories.length === 0 && (
              <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
                <p className="font-medium">No menu items found.</p>

                <p className="mt-2 text-sm text-neutral-500">
                  Try another menu type tab, or create a new item using the form.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
