"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MenuItemForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaving(true);

    const response = await fetch("/api/admin/menu", {
      method: "POST",
      body: formData,
    });

    setSaving(false);

    if (!response.ok) {
      alert("Failed to create menu item.");
      return;
    }

    router.refresh();
  }

  return (
    <form action={handleSubmit} className="h-fit rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold">Add Menu Item</h2>

      <div className="mt-5 space-y-4">
        <input
          name="name"
          placeholder="Item name"
          className="w-full rounded-xl border px-4 py-3"
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          rows={4}
          className="w-full rounded-xl border px-4 py-3"
          required
        />

        <input
          name="price"
          type="number"
          min="0"
          step="0.01"
          placeholder="Price"
          className="w-full rounded-xl border px-4 py-3"
          required
        />

        <input
          name="category"
          placeholder="Category, e.g. Plates, A La Carte"
          className="w-full rounded-xl border px-4 py-3"
          required
        />

        <label className="flex items-center gap-2 text-sm">
          <input name="available" type="checkbox" defaultChecked />
          Available
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input name="seasonal" type="checkbox" />
          Seasonal
        </label>

        <select
          name="type"
          className="w-full rounded-xl border px-4 py-3"
          defaultValue="PLATE"
        >
          <option value="PLATE">Plate</option>
          <option value="A_LA_CARTE">A La Carte</option>
          <option value="MEAL_PLAN">Meal Plan</option>
          <option value="CATERING">Catering</option>
          <option value="DESSERT">Dessert</option>
          <option value="SIDE">Side</option>
          <option value="OTHER">Other</option>
        </select>

        <label className="flex items-center gap-2 text-sm">
          <input name="requiresApproval" type="checkbox" />
          Requires chef approval
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input name="customerInstructionsEnabled" type="checkbox" />
          Allow customer instructions
        </label>

        <button
          disabled={saving}
          className="w-full rounded-xl bg-black px-5 py-3 font-medium text-white disabled:bg-neutral-400"
        >
          {saving ? "Saving..." : "Add Item"}
        </button>
      </div>
    </form>
  );
}