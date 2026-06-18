"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  requestId: string;
  currentEstimatedTotal: number | null;
  currentDepositAmount: number | null;
  lockedReason?: string | null;
};

export function CateringQuoteForm({
  requestId,
  currentEstimatedTotal,
  currentDepositAmount,
  lockedReason,
}: Props) {
  const router = useRouter();
  const [estimatedTotal, setEstimatedTotal] = useState(
    currentEstimatedTotal === null ? "" : currentEstimatedTotal.toString(),
  );
  const [depositAmount, setDepositAmount] = useState(
    currentDepositAmount === null ? "" : currentDepositAmount.toString(),
  );
  const [saving, setSaving] = useState(false);

  function parseOptionalAmount(value: string) {
    const trimmedValue = value.trim();

    return trimmedValue ? Number(trimmedValue) : null;
  }

  async function saveQuote() {
    if (lockedReason) return;

    const nextEstimatedTotal = parseOptionalAmount(estimatedTotal);
    const nextDepositAmount = parseOptionalAmount(depositAmount);

    if (
      nextEstimatedTotal !== null &&
      (!Number.isFinite(nextEstimatedTotal) || nextEstimatedTotal < 0)
    ) {
      alert("Estimated total must be a valid amount of zero or more.");
      return;
    }

    if (
      nextDepositAmount !== null &&
      (!Number.isFinite(nextDepositAmount) || nextDepositAmount < 0)
    ) {
      alert("Deposit amount must be a valid amount of zero or more.");
      return;
    }

    setSaving(true);

    const response = await fetch(`/api/admin/catering/${requestId}/quote`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        estimatedTotal: nextEstimatedTotal,
        depositAmount: nextDepositAmount,
      }),
    });

    setSaving(false);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      alert(errorData?.error ?? "Failed to save quote.");
      return;
    }

    router.refresh();
  }

  if (lockedReason) {
    return (
      <div className="rounded-lg border border-[#ead8c1] bg-[#fff8ee] p-4 text-sm text-[#6b5a50]">
        {lockedReason}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-bold">Estimated Total</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={estimatedTotal}
          onChange={(e) => setEstimatedTotal(e.target.value)}
          className="mt-2 w-full rounded-lg border border-[#d7bea1] px-4 py-3 outline-none transition focus:border-[#8a2b18] focus:ring-2 focus:ring-[#d99426]/30"
        />
        <p className="mt-2 text-xs text-neutral-500">
          Use 0.00 only when there is intentionally no charge.
        </p>
      </div>

      <div>
        <label className="block text-sm font-bold">Deposit Amount</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          className="mt-2 w-full rounded-lg border border-[#d7bea1] px-4 py-3 outline-none transition focus:border-[#8a2b18] focus:ring-2 focus:ring-[#d99426]/30"
        />
        <p className="mt-2 text-xs text-neutral-500">
          Leave blank to automatically calculate the deposit from business
          settings. Use 0.00 when no deposit is due.
        </p>
      </div>

      <button
        type="button"
        onClick={saveQuote}
        disabled={saving}
        className="brand-button-primary w-full px-5 py-3 text-sm disabled:bg-neutral-400"
      >
        {saving ? "Saving..." : "Save Quote"}
      </button>
    </div>
  );
}
