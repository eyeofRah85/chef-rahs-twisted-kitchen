import { prisma } from "@/lib/prisma";
import { MenuCard } from "@/components/menu/MenuCard";
import { MenuCategoryFilter } from "@/components/menu/MenuCategoryFilter";
import type { DecimalLike } from "@/types/display";

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

export default async function MenuPage() {

const categories = (await prisma.menuCategory.findMany({
  orderBy: {
    sortOrder: "asc",
  },
  include: {
    items: {
         where: {
          archived: false,
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
})) as PublicMenuCategory[];

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Meal Plans & A La Carte
          </p>

          <h1 className="mt-3 text-5xl font-bold">
            Weekly meal plans and custom chef-prepared options.
          </h1>

          <p className="mt-4 max-w-2xl text-neutral-700">
            Choose meal plan packages, customize meal components, select substitutions,
            or explore a la carte options. Pork and beef are available by request only
            for meal plans, and pricing may vary.
          </p>
                  </div>
          <div className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
            <h2 className="text-xl font-semibold">Meal Plan Notes</h2>

            <p className="mt-2 text-sm leading-6">
              Meal plans are package-based. Standard meal plans include lunch and dinner
              options, with protein, starch, and vegetable selections. Pork and beef are
              not included in standard meal plans and are available by request only.
              Pricing may vary.
            </p>
          </div>

        <MenuCategoryFilter categories={categories.map((category) => category.name)} />

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
                      customerInstructionsEnabled: item.customerInstructionsEnabled,
                      optionGroups: item.optionGroups.map((group) => ({
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
                ))}
              </div>

              {category.items.length === 0 && (
                <p className="text-sm text-neutral-500">
                  No meal plan or menu items are available yet.
                </p>
              )}
            </section>
          ))}

          {categories.length === 0 && (
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
