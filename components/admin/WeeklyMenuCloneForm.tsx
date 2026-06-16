"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type WeeklyMenuCloneSource = {
  id: string;
  label: string;
  suggestedLabel: string;
  suggestedStartDate: string;
  suggestedEndDate: string;
  suggestedOrderCutoffAt: string | null;
  fulfillmentNotes: string | null;
  capacity: number;
  packageCount: number;
  offeringCount: number;
};

type Props = {
  source: WeeklyMenuCloneSource;
};

async function readError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  return data?.error ?? fallback;
}

export function WeeklyMenuCloneForm({ source }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(formData: FormData) {
    const confirmed = confirm(
      `Clone "${source.label}" into a new draft weekly menu?`,
    );

    if (!confirmed) return;

    setSaving(true);

    try {
      const response = await fetch(
        `/api/admin/menu/weekly-periods/${source.id}/clone`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        alert(await readError(response, "Failed to clone weekly menu."));
        return;
      }

      router.refresh();
    } catch {
      alert("Failed to clone weekly menu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form action={handleSubmit} className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-semibold">Clone Weekly Menu</h2>

        <p className="mt-1 text-sm text-neutral-500">
          Copies {source.packageCount} package
          {source.packageCount === 1 ? "" : "s"} and {source.offeringCount}{" "}
          offering{source.offeringCount === 1 ? "" : "s"} into a new draft.
        </p>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium">
          Week Label
          <input
            name="label"
            defaultValue={source.suggestedLabel}
            className="rounded-xl border px-4 py-3 text-sm font-normal"
            required
          />
        </label>

        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Start Date
            <input
              name="startDate"
              type="date"
              defaultValue={source.suggestedStartDate}
              className="rounded-xl border px-4 py-3 text-sm font-normal"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            End Date
            <input
              name="endDate"
              type="date"
              defaultValue={source.suggestedEndDate}
              className="rounded-xl border px-4 py-3 text-sm font-normal"
              required
            />
          </label>
        </div>

        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Ordering Cutoff
            <input
              name="orderCutoffAt"
              type="datetime-local"
              defaultValue={source.suggestedOrderCutoffAt ?? ""}
              className="rounded-xl border px-4 py-3 text-sm font-normal"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Order Capacity
            <input
              name="capacity"
              type="number"
              min="1"
              step="1"
              defaultValue={source.capacity}
              className="rounded-xl border px-4 py-3 text-sm font-normal"
              required
            />
            <span className="text-xs font-normal leading-5 text-neutral-500">
              Counts submitted customer orders for this weekly menu, not meal
              plan item quantity.
            </span>
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium">
          Fulfillment Notes
          <textarea
            name="fulfillmentNotes"
            rows={3}
            defaultValue={source.fulfillmentNotes ?? ""}
            className="rounded-xl border px-4 py-3 text-sm font-normal"
          />
        </label>

        <button
          disabled={saving}
          className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white disabled:bg-neutral-400"
        >
          {saving ? "Cloning..." : "Clone as Draft"}
        </button>
      </div>
    </form>
  );
}
