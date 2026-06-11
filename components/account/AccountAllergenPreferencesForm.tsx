"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Allergen = {
  id: string;
  name: string;
};

type AllergenResponse = {
  allergens: Allergen[];
  selectedAllergenIds: string[];
};

export function AccountAllergenPreferencesForm() {
  const router = useRouter();

  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [selectedAllergenIds, setSelectedAllergenIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedSet = useMemo(
    () => new Set(selectedAllergenIds),
    [selectedAllergenIds],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadAllergens() {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/account/allergens", {
        cache: "no-store",
      });

      if (!response.ok) {
        if (!cancelled) {
          setError("Failed to load allergen preferences.");
          setLoading(false);
        }

        return;
      }

      const data = (await response.json()) as AllergenResponse;

      if (cancelled) {
        return;
      }

      setAllergens(data.allergens);
      setSelectedAllergenIds(data.selectedAllergenIds);
      setLoading(false);
    }

    loadAllergens().catch(() => {
      if (!cancelled) {
        setError("Failed to load allergen preferences.");
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function toggleAllergen(allergenId: string) {
    setMessage(null);
    setError(null);

    setSelectedAllergenIds((current) => {
      if (current.includes(allergenId)) {
        return current.filter((id) => id !== allergenId);
      }

      return [...current, allergenId];
    });
  }

  async function saveAllergens() {
    if (saving) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    const response = await fetch("/api/account/allergens", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        selectedAllergenIds,
      }),
    });

    setSaving(false);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      setError(errorData?.error ?? "Failed to save allergen preferences.");
      return;
    }

    const data = (await response.json()) as {
      selectedAllergenIds: string[];
    };

    setSelectedAllergenIds(data.selectedAllergenIds);
    setMessage("Allergen preferences saved.");
    router.refresh();
  }

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Allergen Preferences</h2>

          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Select allergens that should be flagged before you place meal plan
            or a la carte orders. This does not replace contacting the business
            for severe allergies, but it gives the app a preference record to
            check against.
          </p>
        </div>

        {selectedAllergenIds.length > 0 && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            {selectedAllergenIds.length} selected
          </span>
        )}
      </div>

      {loading && (
        <p className="mt-5 text-sm text-neutral-600">
          Loading allergen options...
        </p>
      )}

      {!loading && allergens.length === 0 && (
        <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          No allergens have been created yet. Add allergens in the admin menu
          tools before customers can select preferences.
        </div>
      )}

      {!loading && allergens.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allergens.map((allergen) => {
            const selected = selectedSet.has(allergen.id);

            return (
              <label
                key={allergen.id}
                className={
                  selected
                    ? "flex cursor-pointer items-center gap-3 rounded-xl border border-amber-500 bg-amber-50 p-4 text-sm font-medium text-amber-950"
                    : "flex cursor-pointer items-center gap-3 rounded-xl border bg-neutral-50 p-4 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
                }
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleAllergen(allergen.id)}
                  className="h-4 w-4"
                />

                <span>{allergen.name}</span>
              </label>
            );
          })}
        </div>
      )}

      {message && (
        <p className="mt-4 rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-900">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={loading || saving}
        onClick={saveAllergens}
        className="mt-6 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white disabled:bg-neutral-400"
      >
        {saving ? "Saving..." : "Save Allergen Preferences"}
      </button>
    </section>
  );
}