"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  orderId: string;
};

export function MarkOrderPaidButton({ orderId }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function markPaid() {
    const confirmed = confirm("Mark this order as paid?");

    if (!confirmed) return;

    setSaving(true);

    const response = await fetch(`/api/admin/orders/${orderId}/mark-paid`, {
      method: "PATCH",
    });

    setSaving(false);

    if (!response.ok) {
      alert("Failed to mark order as paid.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={markPaid}
      disabled={saving}
      className="w-full rounded-xl bg-black px-5 py-3 text-sm font-medium text-white disabled:bg-neutral-400"
    >
      {saving ? "Saving..." : "Mark Paid"}
    </button>
  );
}