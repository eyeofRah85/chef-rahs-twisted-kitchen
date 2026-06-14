"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export type WeeklyMealPlanOfferingFormData = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  dietaryInfo: string | null;
  available: boolean;
  displayOrder: number;
};

type Props = {
  periodId: string;
  offering?: WeeklyMealPlanOfferingFormData;
};

async function readError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  return data?.error ?? fallback;
}

export function WeeklyMealPlanOfferingForm({ periodId, offering }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(offering);

  async function handleSubmit(formData: FormData) {
    setSaving(true);

    try {
      const response = await fetch(
        offering
          ? `/api/admin/menu/weekly-offerings/${offering.id}`
          : `/api/admin/menu/weekly-periods/${periodId}/offerings`,
        {
          method: offering ? "PATCH" : "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        alert(
          await readError(
            response,
            "Failed to save weekly meal plan offering.",
          ),
        );
        return;
      }

      if (!offering) {
        formRef.current?.reset();
      }

      router.refresh();
    } catch {
      alert("Failed to save weekly meal plan offering.");
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
          Offering Name
          <input
            name="name"
            defaultValue={offering?.name ?? ""}
            className="rounded-xl border px-4 py-3 text-sm font-normal"
            placeholder="Jerk Chicken Bowl"
            required
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Display Order
          <input
            name="displayOrder"
            type="number"
            min="0"
            step="1"
            defaultValue={offering?.displayOrder ?? 0}
            className="rounded-xl border px-4 py-3 text-sm font-normal"
            required
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium">
        Description
        <textarea
          name="description"
          rows={4}
          defaultValue={offering?.description ?? ""}
          className="rounded-xl border px-4 py-3 text-sm font-normal"
          placeholder="Fixed weekly meal description"
          required
        />
      </label>

      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium">
          Dietary Info
          <input
            name="dietaryInfo"
            defaultValue={offering?.dietaryInfo ?? ""}
            className="rounded-xl border px-4 py-3 text-sm font-normal"
            placeholder="Gluten-free, dairy-free, etc."
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Image URL
          <input
            name="imageUrl"
            defaultValue={offering?.imageUrl ?? ""}
            className="rounded-xl border px-4 py-3 text-sm font-normal"
            placeholder="/uploads/menu/example.webp"
          />
        </label>
      </div>

      <label className="flex items-center gap-3 text-sm font-medium">
        <input
          name="available"
          type="checkbox"
          defaultChecked={offering?.available ?? true}
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
            ? "Save Offering"
            : "Add Offering"}
      </button>
    </form>
  );
}
