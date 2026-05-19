"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  optionGroupId: string;
};

export function DeleteOptionGroupButton({ optionGroupId }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function deleteGroup() {
    const confirmed = confirm(
      "Delete this option group and its choices? This cannot be undone.",
    );

    if (!confirmed) return;

    setDeleting(true);

    const response = await fetch(`/api/admin/menu/options/${optionGroupId}`, {
      method: "DELETE",
    });

    setDeleting(false);

    if (!response.ok) {
      alert("Failed to delete option group.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={deleteGroup}
      disabled={deleting}
      className="mt-2 rounded-xl border border-red-300 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 disabled:bg-neutral-100"
    >
      {deleting ? "Deleting..." : "Delete Group"}
    </button>
  );
}