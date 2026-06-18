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
      className="admin-button-primary text-xs"
    >
      {saving ? "Restoring..." : "Restore"}
    </button>
  );
}
