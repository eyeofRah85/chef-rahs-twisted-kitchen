"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export type WeeklyMealPlanPackageFormData = {
  id: string;
  name: string;
  days: number;
  mealsPerDay: number;
  price: number;
  available: boolean;
  displayOrder: number;
  notes: string | null;
};

type Props = {
  periodId: string;
  pkg?: WeeklyMealPlanPackageFormData;
};

async function readError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  return data?.error ?? fallback;
}

export function WeeklyMealPlanPackageForm({ periodId, pkg }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(pkg);

  async function handleSubmit(formData: FormData) {
    setSaving(true);

    try {
      const response = await fetch(
        pkg
          ? `/api/admin/menu/weekly-packages/${pkg.id}`
          : `/api/admin/menu/weekly-periods/${periodId}/packages`,
        {
          method: pkg ? "PATCH" : "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        alert(
          await readError(
            response,
            "Failed to save weekly meal plan package.",
          ),
        );
        return;
      }

      if (!pkg) {
        formRef.current?.reset();
      }

      router.refresh();
    } catch {
      alert("Failed to save weekly meal plan package.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="grid gap-4 rounded-xl border bg-white p-4"
    >
      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium">
          Package Name
          <input
            name="name"
            defaultValue={pkg?.name ?? ""}
            className="rounded-xl border px-4 py-3 text-sm font-normal"
            placeholder="5-Day Lunch Package"
            required
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Package Price
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={pkg ? pkg.price.toFixed(2) : ""}
            className="rounded-xl border px-4 py-3 text-sm font-normal"
            required
          />
        </label>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium">
          Days
          <select
            name="days"
            defaultValue={String(pkg?.days ?? 5)}
            className="rounded-xl border px-4 py-3 text-sm font-normal"
          >
            <option value="5">5 days</option>
            <option value="7">7 days</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Meals Per Day
          <select
            name="mealsPerDay"
            defaultValue={String(pkg?.mealsPerDay ?? 1)}
            className="rounded-xl border px-4 py-3 text-sm font-normal"
          >
            <option value="1">1 meal</option>
            <option value="2">2 meals</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Display Order
          <input
            name="displayOrder"
            type="number"
            min="0"
            step="1"
            defaultValue={pkg?.displayOrder ?? 0}
            className="rounded-xl border px-4 py-3 text-sm font-normal"
            required
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium">
        Notes
        <textarea
          name="notes"
          rows={3}
          defaultValue={pkg?.notes ?? ""}
          className="rounded-xl border px-4 py-3 text-sm font-normal"
          placeholder="Optional package details"
        />
      </label>

      <label className="flex items-center gap-3 text-sm font-medium">
        <input
          name="available"
          type="checkbox"
          defaultChecked={pkg?.available ?? true}
          className="h-4 w-4"
        />
        Available for this weekly menu
      </label>

      <button
        disabled={saving}
        className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white disabled:bg-neutral-400"
      >
        {saving
          ? "Saving..."
          : isEditing
            ? "Save Package"
            : "Add Package"}
      </button>
    </form>
  );
}
