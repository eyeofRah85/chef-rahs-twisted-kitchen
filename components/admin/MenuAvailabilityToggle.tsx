"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  menuItemId: string;
  available: boolean;
};

export function MenuAvailabilityToggle({ menuItemId, available }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function toggleAvailability() {
    setSaving(true);

    const response = await fetch(`/api/admin/menu/${menuItemId}/availability`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        available: !available,
      }),
    });

    setSaving(false);

    if (!response.ok) {
      alert("Failed to update availability.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggleAvailability}
      disabled={saving}
      className="mt-3 rounded-xl border px-4 py-2 text-xs font-medium disabled:bg-neutral-100"
    >
      {saving
        ? "Saving..."
        : available
          ? "Mark Unavailable"
          : "Mark Available"}
    </button>
  );
}