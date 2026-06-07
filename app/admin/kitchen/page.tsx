import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { KitchenOrderCard } from "@/components/admin/KitchenOrderCard";
import Link from "next/link";
import type { DecimalLike } from "@/types/display";

type KitchenOrderRow = {
  id: string;
  orderType: string;
  status: string;
  customerName: string;
  requestedDateTime: Date | null;
  allergyNotes: string | null;
  items: {
    id: string;
    name: string;
    quantity: number;
    lineTotal: DecimalLike;
    notes: string | null;
  }[];
};

export default async function KitchenPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const activeOrders = (await prisma.order.findMany({
    where: {
      approvalStatus: "APPROVED",

      status: {
        in: ["ACCEPTED", "PREPARING", "READY"],
      },
    },

    orderBy: {
      createdAt: "asc",
    },

    select: {
      id: true,
      orderType: true,
      status: true,
      customerName: true,
      requestedDateTime: true,
      allergyNotes: true,
      items: {
        select: {
          id: true,
          name: true,
          quantity: true,
          lineTotal: true,
          notes: true,
        },
      },
    },
  })) as KitchenOrderRow[];

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mb-8">
        <Link className="text-sm font-medium underline" href="/admin">
          &larr;  Back to Dashboard
        </Link>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
          Kitchen View
        </p>

        <h1 className="mt-3 text-5xl font-bold">
          Approved Kitchen Orders
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {activeOrders.map((order) => (
        <KitchenOrderCard
            key={order.id}
            order={{
              id: order.id,
              orderType: order.orderType,
              status: order.status,
              customerName: order.customerName,
              requestedDateTime:
                order.requestedDateTime?.toISOString() ?? null,
              allergyNotes: order.allergyNotes,
              items: order.items.map((item) => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                lineTotal: Number(item.lineTotal),
                notes: item.notes,
              })),
            }}
        />
        ))}

        {activeOrders.length === 0 && (
          <div className="rounded-2xl border bg-white p-10 shadow-sm">
            <p className="text-lg font-medium">
              No active orders.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
