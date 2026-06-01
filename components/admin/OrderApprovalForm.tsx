"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  orderId: string;
  currentApprovalStatus: string;
};

export function OrderApprovalForm({
  orderId,
  currentApprovalStatus,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [approvalNote, setApprovalNote] = useState("");

  const finalized =
    currentApprovalStatus === "APPROVED" ||
    currentApprovalStatus === "DENIED";

  async function submitApproval(approvalStatus: "APPROVED" | "DENIED") {
    if (saving || finalized) return;

    const confirmed = confirm(
      approvalStatus === "APPROVED"
        ? "Are you sure you want to approve this order? This will notify the customer and move the order forward."
        : "Are you sure you want to deny this order? This will notify the customer and cancel the order.",
    );

    if (!confirmed) return;

    setSaving(true);

    const response = await fetch(
      `/api/admin/orders/${orderId}/approval`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          approvalStatus,
          approvalNote,
        }),
      },
    );

    setSaving(false);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      alert(errorData?.error ?? "Failed to update approval.");
      return;
    }

    router.refresh();
  }

  if (currentApprovalStatus === "APPROVED") {
    return (
      <div className="rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-900">
        This order has already been approved.
      </div>
    );
  }

  if (currentApprovalStatus === "DENIED") {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
        This order has already been denied.
      </div>
    );
  }

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold">Approval Decision</h2>

      <p className="mt-2 text-sm text-neutral-600">
        Approve the order to move it into the kitchen workflow, or deny it if
        the selected options cannot be fulfilled.
      </p>

      <textarea
        value={approvalNote}
        onChange={(e) => setApprovalNote(e.target.value)}
        rows={3}
        placeholder="Optional note to include with the decision"
        className="mt-5 w-full rounded-xl border px-4 py-3 text-sm"
      />

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => submitApproval("APPROVED")}
          className="rounded-xl bg-green-700 px-5 py-3 text-sm font-medium text-white disabled:bg-neutral-400"
        >
          {saving ? "Saving..." : "Approve Order"}
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() => submitApproval("DENIED")}
          className="rounded-xl bg-red-700 px-5 py-3 text-sm font-medium text-white disabled:bg-neutral-400"
        >
          {saving ? "Saving..." : "Deny Order"}
        </button>
      </div>
    </section>
  );
}