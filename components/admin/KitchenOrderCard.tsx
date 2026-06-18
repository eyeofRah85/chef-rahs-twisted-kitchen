"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatOrderStatus, formatOrderType } from "@/lib/format-labels";
import {
  getWeeklyMealPlanSelectionDetails,
  type WeeklyOrderSelectionDisplay,
} from "@/lib/weekly-order-display";

type KitchenOrderItem = {
  id: string;
  name: string;
  quantity: number;
  lineTotal: number;
  notes: string | null;
  weeklyMealPlanSelection: WeeklyOrderSelectionDisplay | null;
};

type KitchenOrder = {
  id: string;
  orderType: string;
  status: string;
  customerName: string;
  requestedDateTime: Date | string | null;
  allergyNotes: string | null;
  items: KitchenOrderItem[];
};

type KitchenOrderCardProps = {
  order: KitchenOrder;
};

const nextStatuses: Record<string, string> = {
  PENDING: "ACCEPTED",
  ACCEPTED: "PREPARING",
  PREPARING: "READY",
  READY: "COMPLETED",
};

export function KitchenOrderCard({ order }: KitchenOrderCardProps) {
  const router = useRouter();

  async function advanceStatus() {
    const nextStatus = nextStatuses[order.status];

    if (!nextStatus) return;

    const response = await fetch(`/api/admin/orders/${order.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: nextStatus,
        note: `Kitchen updated order to ${formatOrderStatus(nextStatus)}.`,
      }),
    });

    if (!response.ok) {
      alert("Failed to update order.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="admin-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="admin-eyebrow">{formatOrderType(order.orderType)}</p>

          <h2 className="mt-2 text-2xl font-black leading-tight">
            {order.customerName}
          </h2>
        </div>

        <div className="admin-badge admin-badge-warning">
          {formatOrderStatus(order.status)}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {order.items.map((item) => (
          <div key={item.id} className="rounded-lg border border-[#ead8c1] p-4">
            {item.weeklyMealPlanSelection ? (
              <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
                <p className="font-black">Weekly Meal Plan Snapshot</p>

                <dl className="mt-2 space-y-1">
                  {getWeeklyMealPlanSelectionDetails(
                    item.weeklyMealPlanSelection,
                  ).map((detail) => (
                    <div key={detail.label}>
                      <dt className="inline font-semibold">{detail.label}: </dt>
                      <dd className="inline">{detail.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-xl font-black leading-tight">
                  {item.quantity} x {item.name}
                </h3>

                {item.notes && (
                  <div className="mt-3 whitespace-pre-wrap rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                    {item.notes}
                  </div>
                )}
              </div>

              <div className="shrink-0 font-black sm:text-right">
                ${Number(item.lineTotal).toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {order.allergyNotes && (
        <div className="mt-6 rounded-lg border-2 border-red-500 bg-red-50 p-4">
          <p className="text-sm font-black uppercase text-red-700">
            Allergy Alert
          </p>

          <p className="mt-2 text-red-900">{order.allergyNotes}</p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4 border-t border-[#ead8c1] pt-5">
        <div>
          <p className="text-sm text-neutral-500">Requested</p>

          <p className="font-bold">
            {order.requestedDateTime
              ? new Date(order.requestedDateTime).toLocaleString()
              : "ASAP"}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/admin/orders/${order.id}`}
            className="brand-button-secondary px-5 py-3 text-sm"
          >
            View / Print Ticket
          </Link>

          {nextStatuses[order.status] && (
            <button
              onClick={advanceStatus}
              className="brand-button-primary px-5 py-3 text-sm"
            >
              Mark {formatOrderStatus(nextStatuses[order.status])}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
