import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { formatOrderType, formatPaymentStatus, formatApprovalStatus } from "@/lib/format-labels";
import { parseEnumValue } from "@/lib/enum-values";
import {
  approvalStatuses,
  orderStatuses,
  orderTypes,
} from "@/lib/prisma-enums";
import type { DecimalLike } from "@/types/display";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    payment?: string;
    type?: string;
    approval?: string;
  }>;
};

type AdminOrderRow = {
  id: string;
  customerName: string;
  customerEmail: string;
  orderType: string;
  status: string;
  approvalStatus: string;
  items: { id: string }[];
  total: DecimalLike;
  paymentStatus: string | null;
  payByDate: Date | null;
  createdAt: Date;
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const params = await searchParams;

  const statusFilter = params.status;
  const paymentFilter = params.payment;
  const typeFilter = params.type;
  const approvalFilter = params.approval;
  const status = parseEnumValue(orderStatuses, statusFilter);
  const orderType = parseEnumValue(orderTypes, typeFilter);
  const approvalStatus = parseEnumValue(
    approvalStatuses,
    approvalFilter,
  );

  const where = {
    ...(status ? { status } : {}),
    ...(paymentFilter && paymentFilter !== "ALL"
      ? { paymentStatus: paymentFilter }
      : {}),
    ...(orderType ? { orderType } : {}),
    ...(approvalStatus ? { approvalStatus } : {}),
  };

  const orders = (await prisma.order.findMany({
  where,

  orderBy: {
    createdAt: "desc",
  },

  include: {
    items: true,
  },
})) as AdminOrderRow[];

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link className="text-sm font-medium underline" href="/admin">
            &larr;  Back to Dashboard
          </Link>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Admin
          </p>
          <h1 className="mt-3 text-4xl font-bold">Orders</h1>
          <p className="mt-3 text-neutral-700">
            View and manage customer orders.
          </p>
        </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm"></div>
        <div className="mb-6 rounded-2xl border bg-white p-5 shadow-sm">
          <p className="mb-4 font-semibold">Filters</p>

          <div className="flex flex-wrap gap-3">
            {[
              { label: "All", href: "/admin/orders" },
              { label: "Pending", href: "/admin/orders?status=PENDING" },
              { label: "Accepted", href: "/admin/orders?status=ACCEPTED" },
              { label: "Preparing", href: "/admin/orders?status=PREPARING" },
              { label: "Ready", href: "/admin/orders?status=READY" },
              { label: "Completed", href: "/admin/orders?status=COMPLETED" },
              { label: "Payments Due", href: "/admin/orders?payment=PAY_BY_DATE" },
              { label: "Offline Due", href: "/admin/orders?payment=OFFLINE_PAYMENT_DUE" },
              { label: "Delivery", href: "/admin/orders?type=DELIVERY" },
              { label: "Pickup", href: "/admin/orders?type=PICKUP" },
              { label: "Catering", href: "/admin/orders?type=CATERING" },
              { label: "Approval Pending", href: "/admin/orders?approval=PENDING" },
              { label: "Approved", href: "/admin/orders?approval=APPROVED" },
              { label: "Denied", href: "/admin/orders?approval=DENIED" },
              {label:  "Cancelled", href: "/admin/orders?status=CANCELLED"}
            ].map((filter) => (
              <Link
                key={filter.href}
                href={filter.href}
                className="rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-neutral-100"
              >
                {filter.label}
              </Link>
            ))}
          </div>
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
                <th className="p-4">Payment</th>
                <th className="p-4">Pay By</th>
                <th className="p-4">Created</th>
                <th className="p-4">Approval</th>
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

                  <td className="p-4">{formatOrderType(order.orderType)}</td>

                  <td className="p-4">
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                      {order.status}
                    </span>
                  </td>

                  <td className="p-4">
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                      {formatApprovalStatus(order.approvalStatus)}
                    </span>
                  </td>

                  <td className="p-4">{order.items.length}</td>

                  <td className="p-4 font-medium">
                    ${Number(order.total).toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                      {formatPaymentStatus(order.paymentStatus) ?? "N/A"}
                    </span>
                  </td>

                  <td className="p-4 text-neutral-600">
                    {order.payByDate
                      ? order.payByDate.toLocaleDateString()
                      : "-"}
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
                  <td className="p-6 text-center text-neutral-500" colSpan={10}>
                    No orders match the selected filters.
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
