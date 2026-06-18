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
    <form action={handleSubmit} className="admin-card p-5">
      <div className="mb-5">
        <h2 className="text-xl font-black">Clone Weekly Menu</h2>

        <p className="mt-1 text-sm text-[#6b5a50]">
          Copies {source.packageCount} package
          {source.packageCount === 1 ? "" : "s"} and {source.offeringCount}{" "}
          offering{source.offeringCount === 1 ? "" : "s"} into a new draft.
        </p>
      </div>

      <div className="grid gap-4">
        <label className="admin-label">
          Week Label
          <input
            name="label"
            defaultValue={source.suggestedLabel}
            className="admin-input"
            required
          />
        </label>

        <div className="grid gap-4">
          <label className="admin-label">
            Start Date
            <input
              name="startDate"
              type="date"
              defaultValue={source.suggestedStartDate}
              className="admin-input"
              required
            />
          </label>

          <label className="admin-label">
            End Date
            <input
              name="endDate"
              type="date"
              defaultValue={source.suggestedEndDate}
              className="admin-input"
              required
            />
          </label>
        </div>

        <div className="grid gap-4">
          <label className="admin-label">
            Ordering Cutoff
            <input
              name="orderCutoffAt"
              type="datetime-local"
              defaultValue={source.suggestedOrderCutoffAt ?? ""}
              className="admin-input"
            />
          </label>

          <label className="admin-label">
            Order Capacity
            <input
              name="capacity"
              type="number"
              min="1"
              step="1"
              defaultValue={source.capacity}
              className="admin-input"
              required
            />
            <span className="text-xs font-normal leading-5 text-[#6b5a50]">
              Counts submitted customer orders for this weekly menu, not meal
              plan item quantity.
            </span>
          </label>
        </div>

        <label className="admin-label">
          Fulfillment Notes
          <textarea
            name="fulfillmentNotes"
            rows={3}
            defaultValue={source.fulfillmentNotes ?? ""}
            className="admin-input"
          />
        </label>

        <button disabled={saving} className="admin-button-primary">
          {saving ? "Cloning..." : "Clone as Draft"}
        </button>
      </div>
    </form>
  );
}
