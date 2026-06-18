"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  requestId: string;
};

export function MarkDepositPaidButton({ requestId }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function markPaid() {
    const confirmed = confirm("Mark this service request deposit as paid?");

    if (!confirmed) return;

    setSaving(true);

    const response = await fetch(
      `/api/admin/catering/${requestId}/mark-deposit-paid`,
      {
        method: "PATCH",
      },
    );

    setSaving(false);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      alert(errorData?.error ?? "Failed to mark deposit as paid.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={markPaid}
      disabled={saving}
      className="brand-button-primary w-full px-5 py-3 text-sm disabled:bg-neutral-400"
    >
      {saving ? "Saving..." : "Mark Deposit Paid"}
    </button>
  );
}
