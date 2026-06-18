import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import {
  formatApprovalStatus,
  formatOrderStatus,
  formatOrderType,
  formatPaymentStatus,
} from "@/lib/format-labels";
import { parseEnumValue } from "@/lib/enum-values";
import { approvalStatuses, orderStatuses } from "@/lib/prisma-enums";
import type { DecimalLike } from "@/types/display";

const orderFilterTypes = ["DELIVERY", "PICKUP"] as const;

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
  items: {
    id: string;
    weeklyMealPlanSelection: {
      id: string;
    } | null;
  }[];
  total: DecimalLike;
  paymentStatus: string | null;
  payByDate: Date | null;
  createdAt: Date;
};

function orderStatusBadgeClass(status: string) {
  if (status === "COMPLETED") return "admin-badge admin-badge-success";
  if (status === "CANCELLED" || status === "REFUNDED") {
    return "admin-badge admin-badge-danger";
  }
  if (status === "READY") return "admin-badge admin-badge-info";
  if (status === "PREPARING" || status === "ACCEPTED") {
    return "admin-badge admin-badge-warning";
  }

  return "admin-badge admin-badge-neutral";
}

function approvalStatusBadgeClass(status: string) {
  if (status === "APPROVED") return "admin-badge admin-badge-success";
  if (status === "DENIED") return "admin-badge admin-badge-danger";
  return "admin-badge admin-badge-warning";
}

function paymentStatusBadgeClass(status: string | null) {
  if (status === "PAID") return "admin-badge admin-badge-success";
  if (status === "PAY_BY_DATE" || status === "OFFLINE_PAYMENT_DUE") {
    return "admin-badge admin-badge-warning";
  }
  if (status === "FAILED" || status === "REFUNDED") {
    return "admin-badge admin-badge-danger";
  }

  return "admin-badge admin-badge-neutral";
}

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
  const orderType = parseEnumValue(orderFilterTypes, typeFilter);
  const approvalStatus = parseEnumValue(approvalStatuses, approvalFilter);
  const noActiveFilters =
    !statusFilter && !paymentFilter && !typeFilter && !approvalFilter;

  function filterIsActive(href: string) {
    const [, query = ""] = href.split("?");
    const filterParams = new URLSearchParams(query);

    if (!query) return noActiveFilters;

    return Array.from(filterParams.entries()).every(([key, value]) => {
      if (key === "status") return statusFilter === value;
      if (key === "payment") return paymentFilter === value;
      if (key === "type") return typeFilter === value;
      if (key === "approval") return approvalFilter === value;
      return false;
    });
  }

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
      items: {
        select: {
          id: true,
          weeklyMealPlanSelection: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  })) as AdminOrderRow[];

  return (
    <main className="admin-page">
      <div className="admin-container">
        <div className="mb-8">
          <Link className="admin-back-link" href="/admin">
            &larr; Back to Dashboard
          </Link>
          <p className="admin-eyebrow mt-5">Admin</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Orders
          </h1>
          <p className="mt-3 max-w-2xl text-[#6b5a50]">
            View and manage customer orders.
          </p>
        </div>

        <div className="admin-card mb-6 p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-black">Filters</p>
              <p className="mt-1 text-sm text-[#6b5a50]">
                Narrow the order queue by workflow, payment, fulfillment, or
                approval state.
              </p>
            </div>

            <span className="text-sm font-bold text-[#6b5a50]">
              {orders.length} result{orders.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { label: "All", href: "/admin/orders" },
              { label: "Pending", href: "/admin/orders?status=PENDING" },
              { label: "Accepted", href: "/admin/orders?status=ACCEPTED" },
              { label: "Preparing", href: "/admin/orders?status=PREPARING" },
              { label: "Ready", href: "/admin/orders?status=READY" },
              { label: "Completed", href: "/admin/orders?status=COMPLETED" },
              {
                label: "Payments Due",
                href: "/admin/orders?payment=PAY_BY_DATE",
              },
              {
                label: "Offline Due",
                href: "/admin/orders?payment=OFFLINE_PAYMENT_DUE",
              },
              { label: "Delivery", href: "/admin/orders?type=DELIVERY" },
              { label: "Pickup", href: "/admin/orders?type=PICKUP" },
              {
                label: "Approval Pending",
                href: "/admin/orders?approval=PENDING",
              },
              { label: "Approved", href: "/admin/orders?approval=APPROVED" },
              { label: "Denied", href: "/admin/orders?approval=DENIED" },
              { label: "Cancelled", href: "/admin/orders?status=CANCELLED" },
            ].map((filter) => (
              <Link
                key={filter.href}
                href={filter.href}
                className={`admin-filter-chip ${
                  filterIsActive(filter.href) ? "admin-filter-chip-active" : ""
                }`}
              >
                {filter.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="admin-table-shell">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Type</th>
                <th>Status</th>
                <th>Approval</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Pay By</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => {
                const weeklyItemCount = order.items.filter(
                  (item) => item.weeklyMealPlanSelection,
                ).length;

                return (
                  <tr key={order.id}>
                    <td>
                      <div className="font-black">{order.customerName}</div>
                      <div className="mt-1 text-xs text-[#6b5a50]">
                        {order.customerEmail}
                      </div>
                    </td>

                    <td>{formatOrderType(order.orderType)}</td>

                    <td>
                      <span className={orderStatusBadgeClass(order.status)}>
                        {formatOrderStatus(order.status)}
                      </span>
                    </td>

                    <td>
                      <span
                        className={approvalStatusBadgeClass(
                          order.approvalStatus,
                        )}
                      >
                        {formatApprovalStatus(order.approvalStatus)}
                      </span>
                    </td>

                    <td>
                      <div>{order.items.length}</div>
                      {weeklyItemCount > 0 && (
                        <div className="mt-1 text-xs font-medium text-emerald-700">
                          {weeklyItemCount} weekly
                        </div>
                      )}
                    </td>

                    <td className="font-bold">
                      ${Number(order.total).toFixed(2)}
                    </td>
                    <td>
                      <span
                        className={paymentStatusBadgeClass(order.paymentStatus)}
                      >
                        {formatPaymentStatus(order.paymentStatus) ?? "N/A"}
                      </span>
                    </td>

                    <td className="text-[#6b5a50]">
                      {order.payByDate
                        ? order.payByDate.toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="text-[#6b5a50]">
                      {order.createdAt.toLocaleDateString()}
                    </td>

                    <td>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="admin-action-link"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {orders.length === 0 && (
                <tr>
                  <td className="text-center text-[#6b5a50]" colSpan={10}>
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
