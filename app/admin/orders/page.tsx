import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

export default async function AdminOrdersPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const orders = await prisma.order.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      items: true,
    },
  });

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Admin
          </p>
          <h1 className="mt-3 text-4xl font-bold">Orders</h1>
          <p className="mt-3 text-neutral-700">
            View and manage customer orders.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Items</th>
                <th className="p-4">Total</th>
                <th className="p-4">Created</th>
                <th className="p-4"></th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="p-4">
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-xs text-neutral-500">
                      {order.customerEmail}
                    </div>
                  </td>

                  <td className="p-4">{order.orderType}</td>

                  <td className="p-4">
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                      {order.status}
                    </span>
                  </td>

                  <td className="p-4">{order.items.length}</td>

                  <td className="p-4 font-medium">
                    ${Number(order.total).toFixed(2)}
                  </td>

                  <td className="p-4 text-neutral-600">
                    {order.createdAt.toLocaleDateString()}
                  </td>

                  <td className="p-4">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium text-black underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}

              {orders.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-neutral-500" colSpan={7}>
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}