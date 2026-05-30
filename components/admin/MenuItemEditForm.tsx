"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  item: {
    id: string;
    name: string;
    description: string;
    price: number;
    type: string;
    seasonal: boolean;
    requiresApproval: boolean;
    customerInstructionsEnabled: boolean;
  };
};

export function MenuItemEditForm({ item }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaving(true);

    const response = await fetch(`/api/admin/menu/${item.id}`, {
      method: "PATCH",
      body: formData,
    });

    setSaving(false);

    if (!response.ok) {
      alert("Failed to update menu item.");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 rounded-xl border px-4 py-2 text-xs font-medium"
      >
        Edit Item
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="mt-4 space-y-3 rounded-xl border p-4">
      <input
        name="name"
        defaultValue={item.name}
        className="w-full rounded-xl border px-4 py-3 text-sm"
        required
      />

      <textarea
        name="description"
        defaultValue={item.description}
        rows={3}
        className="w-full rounded-xl border px-4 py-3 text-sm"
        required
      />

      <input
        name="price"
        type="number"
        min="0"
        step="0.01"
        defaultValue={item.price}
        className="w-full rounded-xl border px-4 py-3 text-sm"
        required
      />

      <select
        name="type"
        defaultValue={item.type}
        className="w-full rounded-xl border px-4 py-3 text-sm"
      >
        <option value="MEAL_PLAN">Meal Plan</option>
        <option value="A_LA_CARTE">A La Carte</option>
        <option value="CATERING">Catering Related</option>
        <option value="PLATE">Plate / Legacy</option>
        <option value="DESSERT">Dessert</option>
        <option value="SIDE">Side</option>
        <option value="OTHER">Other</option>
      </select>

      <label className="flex items-center gap-2 text-sm">
        <input name="seasonal" type="checkbox" defaultChecked={item.seasonal} />
        Seasonal
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          name="requiresApproval"
          type="checkbox"
          defaultChecked={item.requiresApproval}
        />
        Requires chef approval
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          name="customerInstructionsEnabled"
          type="checkbox"
          defaultChecked={item.customerInstructionsEnabled}
        />
        Allow customer instructions
      </label>

      <div className="flex gap-3">
        <button
          disabled={saving}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:bg-neutral-400"
        >
          {saving ? "Saving..." : "Save"}
        </button>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border px-4 py-2 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}