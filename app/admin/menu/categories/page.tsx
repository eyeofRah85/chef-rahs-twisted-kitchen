import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { MenuCategoryEditForm } from "@/components/admin/MenuCategoryEditForm";
import Link from "next/link";

type MenuCategoryRow = {
  id: string;
  name: string;
  sortOrder: number;
  items: { id: string }[];
};

export default async function MenuCategoriesPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const categories = (await prisma.menuCategory.findMany({
    orderBy: {
      sortOrder: "asc",
    },
    include: {
      items: true,
    },
  })) as MenuCategoryRow[];

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link className="text-sm font-medium underline" href="/admin/menu">
            &larr;  Back to Menu Manager
          </Link>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Admin Menu
          </p>

          <h1 className="mt-3 text-4xl font-bold">Menu Categories</h1>

          <p className="mt-3 text-neutral-700">
            Rename categories and control the order they appear on the public
            menu.
          </p>
        </div>

        <div className="space-y-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="rounded-2xl border bg-white p-6 shadow-sm"
            >
              <div className="mb-4">
                <h2 className="text-xl font-semibold">{category.name}</h2>

                <p className="mt-1 text-sm text-neutral-600">
                  {category.items.length} item
                  {category.items.length === 1 ? "" : "s"} · Sort order{" "}
                  {category.sortOrder}
                </p>
              </div>

              <MenuCategoryEditForm
                category={{
                  id: category.id,
                  name: category.name,
                  sortOrder: category.sortOrder,
                }}
              />
            </div>
          ))}

          {categories.length === 0 && (
            <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
              <p className="font-medium">No categories yet.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
