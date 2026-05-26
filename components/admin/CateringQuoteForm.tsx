"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  requestId: string;
  currentEstimatedTotal: number | null;
  currentDepositAmount: number | null;
};

export function CateringQuoteForm({
  requestId,
  currentEstimatedTotal,
  currentDepositAmount,
}: Props) {
  const router = useRouter();
  const [estimatedTotal, setEstimatedTotal] = useState(
    currentEstimatedTotal?.toString() ?? "",
  );
  const [depositAmount, setDepositAmount] = useState(
    currentDepositAmount?.toString() ?? "",
  );
  const [saving, setSaving] = useState(false);

  async function saveQuote() {
    setSaving(true);

    const response = await fetch(`/api/admin/catering/${requestId}/quote`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        estimatedTotal: estimatedTotal ? Number(estimatedTotal) : null,
        depositAmount: depositAmount ? Number(depositAmount) : null,
      }),
    });

    setSaving(false);

    if (!response.ok) {
      alert("Failed to save quote.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Estimated Total</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={estimatedTotal}
          onChange={(e) => setEstimatedTotal(e.target.value)}
          className="mt-2 w-full rounded-xl border px-4 py-3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Deposit Amount</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          className="mt-2 w-full rounded-xl border px-4 py-3"
        />
        <p className="mt-2 text-xs text-neutral-500">
          Leave blank to automatically calculate the deposit from business settings.
        </p>
      </div>

      <button
        type="button"
        onClick={saveQuote}
        disabled={saving}
        className="w-full rounded-xl bg-black px-5 py-3 text-sm font-medium text-white disabled:bg-neutral-400"
      >
        {saving ? "Saving..." : "Save Quote"}
      </button>
    </div>
  );
}