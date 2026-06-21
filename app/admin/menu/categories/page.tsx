import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminPage  } from "@/lib/auth-guards";
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
    await requireAdminPage ();
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
    <main className="admin-page">
      <div className="admin-container max-w-5xl">
        <div className="mb-8">
          <Link className="admin-back-link" href="/admin/menu">
            &larr; Back to Menu Manager
          </Link>
          <p className="admin-eyebrow mt-5">Admin Menu</p>

          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Menu Categories
          </h1>

          <p className="mt-3 max-w-2xl text-[#6b5a50]">
            Rename categories and control the order they appear on the public
            menu.
          </p>
        </div>

        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.id} className="admin-card p-6">
              <div className="mb-4">
                <h2 className="text-xl font-black">{category.name}</h2>

                <p className="mt-1 text-sm text-[#6b5a50]">
                  {category.items.length} item
                  {category.items.length === 1 ? "" : "s"} - Sort order{" "}
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
            <div className="admin-card p-8 text-center">
              <p className="font-bold">No categories yet.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
