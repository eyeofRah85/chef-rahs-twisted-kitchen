import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminPage  } from "@/lib/auth-guards";
import { MarkOrderPaidButton } from "@/components/admin/MarkOrderPaidButton";
import { formatPaymentStatus } from "@/lib/format-labels";
import type { DecimalLike } from "@/types/display";

type PaymentDueOrder = {
  id: string;
  customerName: string;
  customerEmail: string;
  paymentStatus: string | null;
  payByDate: Date | null;
  total: DecimalLike;
};

export default async function AdminPaymentsPage() {
  try {
    await requireAdminPage ();
  } catch {
    redirect("/");
  }

  const paymentDueOrders = (await prisma.order.findMany({
    where: {
      status: {
        notIn: ["CANCELLED", "REFUNDED"],
      },
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
  })) as PaymentDueOrder[];

  const totalDue = paymentDueOrders.reduce(
    (sum, order) => sum + Number(order.total),
    0,
  );

  return (
    <main className="admin-page">
      <div className="admin-container">
        <div className="mb-8">
          <Link className="admin-back-link" href="/admin">
            &larr; Back to Dashboard
          </Link>
          <p className="admin-eyebrow mt-5">Admin</p>

          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Payment Management
          </h1>

          <p className="mt-3 max-w-2xl text-[#6b5a50]">
            Monitor manual invoices, offline payments, deposits, and future
            online payment integrations.
          </p>
        </div>

        <section className="grid gap-5 md:grid-cols-3">
          <div className="admin-card p-6">
            <p className="text-sm font-bold text-[#6b5a50]">Payments Due</p>
            <p className="mt-3 text-4xl font-black tracking-tight">
              {paymentDueOrders.length}
            </p>
          </div>

          <div className="admin-card p-6">
            <p className="text-sm font-bold text-[#6b5a50]">
              Outstanding Total
            </p>
            <p className="mt-3 text-4xl font-black tracking-tight">
              ${totalDue.toFixed(2)}
            </p>
          </div>

          <div className="admin-card p-6">
            <p className="text-sm font-bold text-[#6b5a50]">Stripe</p>
            <p className="mt-3 text-2xl font-black">Coming Soon</p>
          </div>
        </section>

        <section className="admin-card mt-10 overflow-hidden">
          <div className="border-b border-[#ead8c1] p-6">
            <h2 className="text-2xl font-black">Outstanding Payments</h2>
            <p className="mt-2 text-sm text-[#6b5a50]">
              Orders that still need manual payment, offline payment, or invoice
              follow-up.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="admin-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Pay By</th>
                  <th>Total</th>
                  <th>Action</th>
                  <th>Order</th>
                </tr>
              </thead>

              <tbody>
                {paymentDueOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className="font-black">{order.customerName}</div>
                      <div className="mt-1 text-xs text-[#6b5a50]">
                        {order.customerEmail}
                      </div>
                    </td>

                    <td>
                      <span className="admin-badge admin-badge-warning">
                        {formatPaymentStatus(order.paymentStatus)}
                      </span>
                    </td>

                    <td className="text-[#6b5a50]">
                      {order.payByDate
                        ? order.payByDate.toLocaleDateString()
                        : "Not set"}
                    </td>

                    <td className="font-black">
                      ${Number(order.total).toFixed(2)}
                    </td>

                    <td>
                      <MarkOrderPaidButton orderId={order.id} />
                    </td>

                    <td>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="admin-action-link"
                      >
                        View Order
                      </Link>
                    </td>
                  </tr>
                ))}

                {paymentDueOrders.length === 0 && (
                  <tr>
                    <td className="text-center text-[#6b5a50]" colSpan={6}>
                      No outstanding payments.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
