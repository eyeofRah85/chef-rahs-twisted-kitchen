"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatServiceRequestStatus } from "@/lib/format-labels";

const statuses = [
  "NEW",
  "REVIEWING",
  "QUOTED",
  "APPROVED",
  "DEPOSIT_DUE",
  "DEPOSIT_PAID",
  "COMPLETED",
  "CANCELLED",
];

type Props = {
  requestId: string;
  currentStatus: string;
};

export function UpdateCateringStatusForm({ requestId, currentStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  async function updateStatus() {
    setSaving(true);

    const response = await fetch(`/api/admin/catering/${requestId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    setSaving(false);

    if (!response.ok) {
      alert("Failed to update service request status.");
      return;
    }

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
              {formatServiceRequestStatus(statusOption)}
            </option>
          ))}
        </select>
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
