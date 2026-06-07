"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatOrderStatus, formatOrderType } from "@/lib/format-labels";

type KitchenOrderItem = {
  id: string;
  name: string;
  quantity: number;
  lineTotal: number;
  notes: string | null;
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
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
            {formatOrderType(order.orderType)}
          </p>

          <h2 className="mt-2 text-2xl font-bold">{order.customerName}</h2>
        </div>

        <div className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium">
          {formatOrderStatus(order.status)}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {order.items.map((item) => (
          <div key={item.id} className="rounded-2xl border p-4">
            <div className="flex justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {item.quantity} x {item.name}
                </h3>

                {item.notes && (
                  <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 whitespace-pre-wrap">
                    {item.notes}
                  </div>
                )}
              </div>

              <div className="text-right font-bold">
                ${Number(item.lineTotal).toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {order.allergyNotes && (
        <div className="mt-6 rounded-2xl border-2 border-red-500 bg-red-50 p-4">
          <p className="text-sm font-bold uppercase text-red-700">
            Allergy Alert
          </p>

          <p className="mt-2 text-red-900">{order.allergyNotes}</p>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">Requested</p>

          <p className="font-medium">
            {order.requestedDateTime
              ? new Date(order.requestedDateTime).toLocaleString()
              : "ASAP"}
          </p>
        </div>

        <Link
          href={`/admin/orders/${order.id}`}
          className="rounded-2xl border px-5 py-3 font-medium"
        >
          View / Print Ticket
        </Link>

        {nextStatuses[order.status] && (
          <button
            onClick={advanceStatus}
            className="rounded-2xl bg-black px-5 py-3 font-medium text-white"
          >
            Mark {formatOrderStatus(nextStatuses[order.status])}
          </button>
        )}
      </div>
    </div>
  );
}
