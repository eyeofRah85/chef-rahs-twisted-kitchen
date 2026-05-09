"use client";

import { useState } from "react";

type Allergen = {
  id: string;
  name: string;
};

type Props = {
  menuItemId: string;
  allergens: Allergen[];
};

export function MenuItemCustomizationEditor({
  menuItemId,
  allergens,
}: Props) {
  const [selectedAllergens, setSelectedAllergens] =
    useState<string[]>([]);

  async function saveAllergens() {
    const response = await fetch(
      `/api/admin/menu/${menuItemId}/allergens`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          allergenIds: selectedAllergens,
        }),
      },
    );

    if (!response.ok) {
      alert("Failed to save allergens.");
      return;
    }

    alert("Allergens saved.");
  }

  return (
    <div className="mt-5 rounded-xl border p-4">
      <h4 className="font-semibold">
        Allergens
      </h4>

      <div className="mt-4 grid gap-2">
        {allergens.map((allergen) => (
          <label
            key={allergen.id}
            className="flex items-center gap-2 text-sm"
          >
            <input
              type="checkbox"
              value={allergen.id}
              checked={selectedAllergens.includes(
                allergen.id,
              )}

              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedAllergens((prev) => [
                    ...prev,
                    allergen.id,
                  ]);
                } else {
                  setSelectedAllergens((prev) =>
                    prev.filter(
                      (id) => id !== allergen.id,
                    ),
                  );
                }
              }}
            />

            {allergen.name}
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={saveAllergens}
        className="mt-5 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
      >
        Save Allergens
      </button>
    </div>
  );
}