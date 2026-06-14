"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { formatWeeklyMenuStatus } from "@/lib/format-labels";
import { weeklyMenuStatuses } from "@/lib/prisma-enums";

export type WeeklyMenuPeriodFormData = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  orderCutoffAt: string | null;
  fulfillmentNotes: string | null;
  status: string;
  capacity: number;
};

type Props = {
  period?: WeeklyMenuPeriodFormData;
};

async function readError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  return data?.error ?? fallback;
}

export function WeeklyMenuPeriodForm({ period }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(period);

  async function handleSubmit(formData: FormData) {
    setSaving(true);

    try {
      const response = await fetch(
        period
          ? `/api/admin/menu/weekly-periods/${period.id}`
          : "/api/admin/menu/weekly-periods",
        {
          method: period ? "PATCH" : "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        alert(await readError(response, "Failed to save weekly menu."));
        return;
      }

      if (!period) {
        formRef.current?.reset();
      }

      router.refresh();
    } catch {
      alert("Failed to save weekly menu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="rounded-2xl border bg-white p-5 shadow-sm"
    >
      <div className="mb-5">
        <h2 className="text-xl font-semibold">
          {isEditing ? "Edit Weekly Menu" : "Create Weekly Menu"}
        </h2>

        <p className="mt-1 text-sm text-neutral-500">
          Weekly menus can be drafted before they are published to customers.
        </p>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium">
          Week Label
          <input
            name="label"
            defaultValue={period?.label ?? ""}
            className="rounded-xl border px-4 py-3 text-sm font-normal"
            placeholder="June 17-23 Meal Prep"
            required
          />
        </label>

        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Start Date
            <input
              name="startDate"
              type="date"
              defaultValue={period?.startDate ?? ""}
              className="rounded-xl border px-4 py-3 text-sm font-normal"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            End Date
            <input
              name="endDate"
              type="date"
              defaultValue={period?.endDate ?? ""}
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
              defaultValue={period?.orderCutoffAt ?? ""}
              className="rounded-xl border px-4 py-3 text-sm font-normal"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Capacity
            <input
              name="capacity"
              type="number"
              min="1"
              step="1"
              defaultValue={period?.capacity ?? 10}
              className="rounded-xl border px-4 py-3 text-sm font-normal"
              required
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium">
          Status
          <select
            name="status"
            defaultValue={period?.status ?? "DRAFT"}
            className="rounded-xl border px-4 py-3 text-sm font-normal"
          >
            {weeklyMenuStatuses.map((status) => (
              <option key={status} value={status}>
                {formatWeeklyMenuStatus(status)}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Fulfillment Notes
          <textarea
            name="fulfillmentNotes"
            rows={4}
            defaultValue={period?.fulfillmentNotes ?? ""}
            className="rounded-xl border px-4 py-3 text-sm font-normal"
            placeholder="Pickup or delivery notes for this weekly menu"
          />
        </label>

        <button
          disabled={saving}
          className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white disabled:bg-neutral-400"
        >
          {saving ? "Saving..." : isEditing ? "Save Weekly Menu" : "Create Weekly Menu"}
        </button>
      </div>
    </form>
  );
}
