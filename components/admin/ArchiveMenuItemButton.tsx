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
      className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-xs font-medium text-red-700 disabled:bg-neutral-100"
    >
      {saving ? "Archiving..." : "Archive Item"}
    </button>
  );
}
