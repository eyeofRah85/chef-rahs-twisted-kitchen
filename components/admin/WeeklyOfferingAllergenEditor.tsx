"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Allergen = {
  id: string;
  name: string;
};

type Props = {
  offeringId: string;
  allergens: Allergen[];
  selectedAllergenIds: string[];
};

async function readError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  return data?.error ?? fallback;
}

export function WeeklyOfferingAllergenEditor({
  offeringId,
  allergens,
  selectedAllergenIds,
}: Props) {
  const router = useRouter();
  const [selectedAllergens, setSelectedAllergens] =
    useState<string[]>(selectedAllergenIds);
  const [saving, setSaving] = useState(false);

  function toggleAllergen(allergenId: string, checked: boolean) {
    setSelectedAllergens((current) => {
      if (checked) {
        return current.includes(allergenId)
          ? current
          : [...current, allergenId];
      }

      return current.filter((id) => id !== allergenId);
    });
  }

  async function saveAllergens() {
    setSaving(true);

    try {
      const response = await fetch(
        `/api/admin/menu/weekly-offerings/${offeringId}/allergens`,
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
        alert(await readError(response, "Failed to save allergens."));
        return;
      }

      router.refresh();
    } catch {
      alert("Failed to save allergens.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-row-card">
      <h4 className="font-black">Allergens</h4>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {allergens.map((allergen) => (
          <label
            key={allergen.id}
            className="flex items-center gap-2 text-sm font-medium text-[#3f2a1d]"
          >
            <input
              type="checkbox"
              value={allergen.id}
              checked={selectedAllergens.includes(allergen.id)}
              onChange={(event) =>
                toggleAllergen(allergen.id, event.target.checked)
              }
            />
            {allergen.name}
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={saveAllergens}
        disabled={saving}
        className="admin-button-primary mt-5"
      >
        {saving ? "Saving..." : "Save Allergens"}
      </button>
    </section>
  );
}
