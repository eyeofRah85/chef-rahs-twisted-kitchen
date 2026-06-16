"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  optionId: string;
  optionName: string;
};

async function readError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  return data?.error ?? fallback;
}

export function DeleteWeeklyMealPlanOptionButton({
  optionId,
  optionName,
}: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function deleteOption() {
    const confirmed = confirm(`Delete option "${optionName}"?`);

    if (!confirmed) return;

    setDeleting(true);

    try {
      const response = await fetch(
        `/api/admin/menu/weekly-options/${optionId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        alert(
          await readError(response, "Failed to delete weekly meal option."),
        );
        return;
      }

      router.refresh();
    } catch {
      alert("Failed to delete weekly meal option.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={deleteOption}
      disabled={deleting}
      className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 disabled:bg-neutral-100"
    >
      {deleting ? "Deleting..." : "Delete Option"}
    </button>
  );
}
