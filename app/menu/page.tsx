import { prisma } from "@/lib/prisma";
import { MenuCard } from "@/components/menu/MenuCard";

export default async function MenuPage() {
const categories = await prisma.menuCategory.findMany({
  orderBy: {
    sortOrder: "asc",
  },
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

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Seasonal Menu
          </p>

          <h1 className="mt-3 text-4xl font-bold">Order Menu</h1>

          <p className="mt-3 max-w-2xl text-neutral-700">
            Choose from seasonal plates, a la carte items, desserts, and
            catering options. Allergy notes and substitutions will be collected
            during checkout.
          </p>
        </div>

        <div className="space-y-10">
          {categories.map((category) => (
            <section key={category.id}>
              <h2 className="mb-4 text-2xl font-semibold">{category.name}</h2>

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {category.items.map((item) => (
                  <MenuCard
                    key={item.id}
                    item={{
                      id: item.id,
                      name: item.name,
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
                      optionGroups: item.optionGroups.map((group) => ({
                        id: group.id,
                        name: group.name,
                        required: group.required,
                        multiple: group.multiple,
                        choices: group.choices.map((choice) => ({
                          id: choice.id,
                          name: choice.name,
                          priceDelta: Number(choice.priceDelta),
                        })),
                      })),
                    }}
                  />
                ))}
              </div>

              {category.items.length === 0 && (
                <p className="text-sm text-neutral-500">
                  No items available in this category yet.
                </p>
              )}
            </section>
          ))}

          {categories.length === 0 && (
            <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
              <h2 className="text-2xl font-semibold">Menu coming soon</h2>
              <p className="mt-2 text-neutral-600">
                The chef has not added menu items yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}