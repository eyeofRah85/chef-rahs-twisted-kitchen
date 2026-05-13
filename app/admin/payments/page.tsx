import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

export default async function AdminPaymentsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const paymentDueOrders = await prisma.order.findMany({
    where: {
      paymentStatus: {
        in: ["PAY_BY_DATE", "OFFLINE_PAYMENT_DUE"],
      },
    },
    orderBy: {
      payByDate: "asc",
    },
    include: {
      items: true,
    },
  });

  const totalDue = paymentDueOrders.reduce(
    (sum, order) => sum + Number(order.total),
    0,
  );

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Admin
          </p>

          <h1 className="mt-3 text-4xl font-bold">Payment Management</h1>

          <p className="mt-3 text-neutral-700">
            Monitor manual invoices, offline payments, deposits, and future
            online payment integrations.
          </p>
        </div>

        <section className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-neutral-500">Payments Due</p>
            <p className="mt-3 text-4xl font-bold">
              {paymentDueOrders.length}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-neutral-500">Outstanding Total</p>
            <p className="mt-3 text-4xl font-bold">
              ${totalDue.toFixed(2)}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-neutral-500">Stripe</p>
            <p className="mt-3 text-2xl font-bold">Coming Soon</p>
          </div>
        </section>

        <section className="mt-10 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b p-6">
            <h2 className="text-2xl font-semibold">Outstanding Payments</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Orders that still need manual payment, offline payment, or invoice follow-up.
            </p>
          </div>

          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Status</th>
                <th className="p-4">Pay By</th>
                <th className="p-4">Total</th>
                <th className="p-4">Order</th>
              </tr>
            </thead>

            <tbody>
              {paymentDueOrders.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="p-4">
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-xs text-neutral-500">
                      {order.customerEmail}
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                      {order.paymentStatus}
                    </span>
                  </td>

                  <td className="p-4 text-neutral-600">
                    {order.payByDate
                      ? order.payByDate.toLocaleDateString()
                      : "Not set"}
                  </td>

                  <td className="p-4 font-semibold">
                    ${Number(order.total).toFixed(2)}
                  </td>

                  <td className="p-4">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium underline"
                    >
                      View Order
                    </Link>
                  </td>
                </tr>
              ))}

              {paymentDueOrders.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-neutral-500" colSpan={5}>
                    No outstanding payments.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}