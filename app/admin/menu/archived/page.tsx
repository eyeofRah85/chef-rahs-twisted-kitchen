import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { RestoreMenuItemButton } from "@/components/admin/RestoreMenuItemButton";
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
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
            <Link className="text-sm font-medium underline" href="/admin/menu">
            &larr;  Back to Menu Management
            </Link>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Admin Menu
          </p>

          <h1 className="mt-3 text-4xl font-bold">Archived Menu Items</h1>

          <p className="mt-3 text-neutral-700">
            Restore archived items if they need to return to the menu.
          </p>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{item.name}</h2>

                  <p className="mt-1 text-sm text-neutral-600">
                    {item.description}
                  </p>

                  <p className="mt-2 text-sm font-medium">
                    {item.category.name} · ${Number(item.price).toFixed(2)}
                  </p>
                </div>

                <RestoreMenuItemButton menuItemId={item.id} />
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
              <p className="font-medium">No archived menu items.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
