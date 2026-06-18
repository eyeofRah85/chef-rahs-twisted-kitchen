"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  menuItemId: string;
};

export function ArchiveMenuItemButton({ menuItemId }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function archiveItem() {
    const confirmed = confirm(
      "Archive this menu item? Existing orders will remain unchanged.",
    );

    if (!confirmed) return;

    setSaving(true);

    const response = await fetch(`/api/admin/menu/${menuItemId}/archive`, {
      method: "PATCH",
    });

    setSaving(false);

    if (!response.ok) {
      alert("Failed to archive menu item.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={archiveItem}
      disabled={saving}
      className="admin-button-danger text-xs"
    >
      {saving ? "Archiving..." : "Archive Item"}
    </button>
  );
}
