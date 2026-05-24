import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { KitchenOrderCard } from "@/components/admin/KitchenOrderCard";
import Link from "next/link";
export default async function KitchenPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const activeOrders = await prisma.order.findMany({
    where: {
      approvalStatus: "APPROVED",

      status: {
        in: ["ACCEPTED", "PREPARING", "READY"],
      },
    },

    orderBy: {
      createdAt: "asc",
    },

    include: {
      items: true,
    },
  });

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
            ...order,

            subtotal: Number(order.subtotal),
            deliveryFee: Number(order.deliveryFee),
            lateFee: Number(order.lateFee),
            tipAmount: Number(order.tipAmount),
            total: Number(order.total),

            items: order.items.map((item) => ({
                ...item,
                unitPrice: Number(item.unitPrice),
                lineTotal: Number(item.lineTotal),
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