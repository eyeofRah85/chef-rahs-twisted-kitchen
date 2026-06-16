"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  menuItemId: string;
};

export function ApplyMealPlanTemplateButton({ menuItemId }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function applyTemplate() {
    const confirmed = confirm(
      "Apply the fixed meal plan option groups to this item? Existing groups with the same name will be skipped.",
    );

    if (!confirmed) return;

    setSaving(true);

    const response = await fetch(
      `/api/admin/menu/${menuItemId}/apply-meal-plan-template`,
      {
        method: "POST",
      },
    );

    setSaving(false);

    if (!response.ok) {
      alert("Failed to apply meal plan template.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={applyTemplate}
      disabled={saving}
      className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800 disabled:bg-neutral-100"
    >
      {saving ? "Applying..." : "Apply Meal Plan Template"}
    </button>
  );
}
