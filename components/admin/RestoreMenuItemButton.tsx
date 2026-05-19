"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  menuItemId: string;
};

export function RestoreMenuItemButton({ menuItemId }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function restoreItem() {
    setSaving(true);

    const response = await fetch(`/api/admin/menu/${menuItemId}/restore`, {
      method: "PATCH",
    });

    setSaving(false);

    if (!response.ok) {
      alert("Failed to restore menu item.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={restoreItem}
      disabled={saving}
      className="rounded-xl bg-black px-4 py-2 text-xs font-medium text-white disabled:bg-neutral-400"
    >
      {saving ? "Restoring..." : "Restore"}
    </button>
  );
}