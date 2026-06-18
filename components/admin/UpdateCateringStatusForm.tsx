"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatServiceRequestStatus } from "@/lib/format-labels";
import { isTerminalServiceRequestStatus } from "@/lib/service-request-workflow";

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
  currentApprovalStatus: string;
  depositPaid: boolean;
  hasDepositDue: boolean;
};

export function UpdateCateringStatusForm({
  requestId,
  currentStatus,
  currentApprovalStatus,
  depositPaid,
  hasDepositDue,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  const terminalStatus = isTerminalServiceRequestStatus(currentStatus);
  const denied = currentApprovalStatus === "DENIED";
  const statusOptions = statuses.filter((statusOption) => {
    if (statusOption === currentStatus) {
      return true;
    }

    if (statusOption === "DEPOSIT_DUE" && !hasDepositDue) {
      return false;
    }

    if (statusOption === "DEPOSIT_PAID" && !depositPaid) {
      return false;
    }

    return true;
  });

  async function updateStatus() {
    if (saving || status === currentStatus || terminalStatus || denied) return;

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
      const errorData = await response.json().catch(() => null);

      alert(errorData?.error ?? "Failed to update service request status.");
      return;
    }

    router.refresh();
  }

  if (terminalStatus) {
    return (
      <div className="rounded-lg border border-[#ead8c1] bg-[#fff8ee] p-4 text-sm text-[#6b5a50]">
        This service request is{" "}
        {formatServiceRequestStatus(currentStatus).toLowerCase()}. Status
        changes are locked.
      </div>
    );
  }

  if (denied) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
        This service request was denied. Status changes are locked.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-bold">New Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mt-2 w-full rounded-lg border border-[#d7bea1] px-4 py-3 outline-none transition focus:border-[#8a2b18] focus:ring-2 focus:ring-[#d99426]/30"
        >
          {statusOptions.map((statusOption) => (
            <option key={statusOption} value={statusOption}>
              {formatServiceRequestStatus(statusOption)}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={updateStatus}
        disabled={saving || status === currentStatus}
        className="brand-button-primary w-full px-5 py-3 text-sm disabled:bg-neutral-400"
      >
        {saving
          ? "Saving..."
          : status === currentStatus
            ? "Status Unchanged"
            : "Update Status"}
      </button>
    </div>
  );
}
