import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { MenuItemForm } from "@/components/admin/MenuItemForm";
import { MenuItemCustomizationEditor } from "@/components/admin/MenuItemCustomizationEditor";

export default async function AdminMenuPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const categories = await prisma.menuCategory.findMany({
  orderBy: { sortOrder: "asc" },

  include: {
    items: {
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
});

const allergens =
  await prisma.allergen.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Admin
          </p>
          <h1 className="mt-3 text-4xl font-bold">Menu Manager</h1>
          <p className="mt-3 text-neutral-700">
            Add seasonal items, a la carte options, pricing, and availability.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          <MenuItemForm />

          <section className="space-y-8">
            {categories.map((category) => (
              <div key={category.id} className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-semibold">{category.name}</h2>

                <div className="mt-5 space-y-3">
                  {category.items.map((item) => (
                    <div key={item.id} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="mt-1 text-sm text-neutral-600">
                            {item.description}
                          </p>
                          <p className="mt-2 text-sm font-medium">
                            ${Number(item.price).toFixed(2)}
                          </p>
                        </div>

                        <div className="text-right text-xs">
                          <p
                            className={
                              item.available
                                ? "text-green-700"
                                : "text-red-700"
                            }
                          >
                            {item.available ? "Available" : "Unavailable"}
                          </p>
                          <MenuItemCustomizationEditor
                            menuItemId={item.id}
                            allergens={allergens}
                          />

                          {item.seasonal && (
                            <p className="mt-1 text-amber-700">Seasonal</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {category.items.length === 0 && (
                    <p className="text-sm text-neutral-500">
                      No items in this category yet.
                    </p>
                  )}
                </div>
              </div>
            ))}

            {categories.length === 0 && (
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <p className="text-neutral-600">
                  No categories yet. Add your first menu item to create one.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}