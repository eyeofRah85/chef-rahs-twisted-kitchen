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
          await readError(response, "Failed to save weekly meal plan package."),
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
      className="admin-row-card grid gap-4"
    >
      <div className="grid gap-4">
        <label className="admin-label">
          Package Name
          <input
            name="name"
            defaultValue={pkg?.name ?? ""}
            className="admin-input"
            placeholder="5-Day Lunch Package"
            required
          />
        </label>

        <label className="admin-label">
          Package Price
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={pkg ? pkg.price.toFixed(2) : ""}
            className="admin-input"
            required
          />
        </label>
      </div>

      <div className="grid gap-4">
        <label className="admin-label">
          Days
          <select
            name="days"
            defaultValue={String(pkg?.days ?? 5)}
            className="admin-input"
          >
            <option value="5">5 days</option>
            <option value="7">7 days</option>
          </select>
        </label>

        <label className="admin-label">
          Meals Per Day
          <select
            name="mealsPerDay"
            defaultValue={String(pkg?.mealsPerDay ?? 1)}
            className="admin-input"
          >
            <option value="1">1 meal</option>
            <option value="2">2 meals</option>
          </select>
        </label>

        <label className="admin-label">
          Display Order
          <input
            name="displayOrder"
            type="number"
            min="0"
            step="1"
            defaultValue={pkg?.displayOrder ?? 0}
            className="admin-input"
            required
          />
        </label>
      </div>

      <label className="admin-label">
        Notes
        <textarea
          name="notes"
          rows={3}
          defaultValue={pkg?.notes ?? ""}
          className="admin-input"
          placeholder="Optional package details"
        />
      </label>

      <label className="flex items-center gap-3 text-sm font-bold text-[#3f2a1d]">
        <input
          name="available"
          type="checkbox"
          defaultChecked={pkg?.available ?? true}
          className="h-4 w-4"
        />
        Available for this weekly menu
      </label>

      <button disabled={saving} className="admin-button-primary">
        {saving ? "Saving..." : isEditing ? "Save Package" : "Add Package"}
      </button>
    </form>
  );
}
