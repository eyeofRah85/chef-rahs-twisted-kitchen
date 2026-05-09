"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const statuses = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
];

type UpdateOrderStatusFormProps = {
  orderId: string;
  currentStatus: string;
};

export function UpdateOrderStatusForm({
  orderId,
  currentStatus,
}: UpdateOrderStatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function updateStatus() {
    setSaving(true);

    const response = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        note,
      }),
    });

    setSaving(false);

    if (!response.ok) {
      alert("Failed to update order status.");
      return;
    }

    setNote("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">New Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mt-2 w-full rounded-xl border px-4 py-3"
        >
          {statuses.map((statusOption) => (
            <option key={statusOption} value={statusOption}>
              {statusOption}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Status Note</label>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-2 w-full rounded-xl border px-4 py-3"
          placeholder="Optional note for this status update."
        />
      </div>

      <button
        type="button"
        onClick={updateStatus}
        disabled={saving}
        className="w-full rounded-xl bg-black px-5 py-3 font-medium text-white disabled:bg-neutral-400"
      >
        {saving ? "Saving..." : "Update Status"}
      </button>
    </div>
  );
}