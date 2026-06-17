import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { RestoreMenuItemButton } from "@/components/admin/RestoreMenuItemButton";
import { DeleteMenuItemButton } from "@/components/admin/DeleteMenuItemButton";
import Link from "next/link";
import type { DecimalLike } from "@/types/display";

type ArchivedMenuItem = {
  id: string;
  name: string;
  description: string;
  price: DecimalLike;
  category: {
    name: string;
  };
};

export default async function ArchivedMenuItemsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const items = (await prisma.menuItem.findMany({
    where: {
      archived: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      category: true,
    },
  })) as ArchivedMenuItem[];

  return (
    <main className="admin-page">
      <div className="admin-container max-w-5xl">
        <div className="mb-8">
          <Link className="admin-back-link" href="/admin/menu">
            &larr; Back to Menu Management
          </Link>
          <p className="admin-eyebrow mt-5">Admin Menu</p>

          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Archived Menu Items
          </h1>

          <p className="mt-3 max-w-2xl text-[#6b5a50]">
            Restore archived items if they need to return to the menu.
          </p>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="admin-card p-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <h2 className="text-xl font-black">{item.name}</h2>

                  <p className="mt-1 text-sm text-[#6b5a50]">
                    {item.description}
                  </p>

                  <p className="mt-2 text-sm font-bold">
                    {item.category.name} - ${Number(item.price).toFixed(2)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <RestoreMenuItemButton menuItemId={item.id} />
                  <DeleteMenuItemButton
                    menuItemId={item.id}
                    itemName={item.name}
                  />
                </div>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="admin-card p-8 text-center">
              <p className="font-bold">No archived menu items.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
