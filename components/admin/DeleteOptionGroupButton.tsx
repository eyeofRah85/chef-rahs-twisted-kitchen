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
      className="admin-button-danger mt-2 text-xs"
    >
      {deleting ? "Deleting..." : "Delete Group"}
    </button>
  );
}
