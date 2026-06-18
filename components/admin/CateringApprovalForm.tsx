"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  requestId: string;
  currentApprovalStatus: string;
};

export function CateringApprovalForm({
  requestId,
  currentApprovalStatus,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [approvalNote, setApprovalNote] = useState("");

  const finalized =
    currentApprovalStatus === "APPROVED" || currentApprovalStatus === "DENIED";

  async function submitApproval(approvalStatus: "APPROVED" | "DENIED") {
    if (saving || finalized) return;

    const confirmed = confirm(
      approvalStatus === "APPROVED"
        ? "Are you sure you want to approve this service request? This will notify the customer and move the request forward."
        : "Are you sure you want to deny this service request? This will notify the customer.",
    );

    if (!confirmed) return;

    setSaving(true);

    const response = await fetch(`/api/admin/catering/${requestId}/approval`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        approvalStatus,
        approvalNote,
      }),
    });

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
      <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm font-medium text-green-900">
        This service request has already been approved.
      </div>
    );
  }

  if (currentApprovalStatus === "DENIED") {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-900">
        This service request has already been denied.
      </div>
    );
  }

  return (
    <div>
      <p className="mt-2 text-sm text-neutral-600">
        Approve this request to continue quoting and planning, or deny it if the
        request cannot be fulfilled.
      </p>

      <textarea
        value={approvalNote}
        onChange={(e) => setApprovalNote(e.target.value)}
        rows={3}
        placeholder="Optional note to include with the decision"
        className="mt-5 w-full rounded-lg border border-[#d7bea1] px-4 py-3 text-sm outline-none transition focus:border-[#8a2b18] focus:ring-2 focus:ring-[#d99426]/30"
      />

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => submitApproval("APPROVED")}
          className="rounded-lg bg-green-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800 disabled:bg-neutral-400"
        >
          {saving ? "Saving..." : "Approve Request"}
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() => submitApproval("DENIED")}
          className="rounded-lg bg-red-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-800 disabled:bg-neutral-400"
        >
          {saving ? "Saving..." : "Deny Request"}
        </button>
      </div>
    </div>
  );
}
