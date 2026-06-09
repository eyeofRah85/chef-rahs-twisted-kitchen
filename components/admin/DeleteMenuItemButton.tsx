"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  menuItemId: string;
  itemName: string;
};

async function readError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  return data?.error ?? fallback;
}

export function DeleteMenuItemButton({ menuItemId, itemName }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function deleteItem() {
    const confirmed = confirm(
      `Permanently delete "${itemName}"? Historical orders keep their saved item snapshots, but this menu item and its options will be removed.`,
    );

    if (!confirmed) return;

    setDeleting(true);

    const response = await fetch(`/api/admin/menu/${menuItemId}`, {
      method: "DELETE",
    });

    setDeleting(false);

    if (!response.ok) {
      alert(await readError(response, "Failed to delete menu item."));
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={deleteItem}
      disabled={deleting}
      className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-xs font-medium text-red-700 disabled:bg-neutral-100"
    >
      {deleting ? "Deleting..." : "Delete Item"}
    </button>
  );
}
