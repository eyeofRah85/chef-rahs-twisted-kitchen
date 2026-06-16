"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  offeringId: string;
  offeringName: string;
};

async function readError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  return data?.error ?? fallback;
}

export function DeleteWeeklyMealPlanOfferingButton({
  offeringId,
  offeringName,
}: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function deleteOffering() {
    const confirmed = confirm(
      `Delete "${offeringName}" from this weekly menu? Existing orders keep their saved snapshots.`,
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const response = await fetch(
        `/api/admin/menu/weekly-offerings/${offeringId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        alert(
          await readError(response, "Failed to delete weekly meal offering."),
        );
        return;
      }

      router.refresh();
    } catch {
      alert("Failed to delete weekly meal offering.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={deleteOffering}
      disabled={deleting}
      className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-xs font-medium text-red-700 disabled:bg-neutral-100"
    >
      {deleting ? "Deleting..." : "Delete Offering"}
    </button>
  );
}
