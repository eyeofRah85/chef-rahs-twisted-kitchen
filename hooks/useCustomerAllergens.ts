"use client";

import { useEffect, useMemo, useState } from "react";

type Allergen = {
  id: string;
  name: string;
};

type AccountAllergensResponse = {
  allergens: Allergen[];
  selectedAllergenIds: string[];
};

export function useCustomerAllergens() {
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [selectedAllergenIds, setSelectedAllergenIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAllergens() {
      setLoading(true);

      const response = await fetch("/api/account/allergens", {
        cache: "no-store",
      });

      if (!response.ok) {
        if (!cancelled) {
          setAllergens([]);
          setSelectedAllergenIds([]);
          setLoading(false);
        }

        return;
      }

      const data = (await response.json()) as AccountAllergensResponse;

      if (cancelled) return;

      setAllergens(data.allergens);
      setSelectedAllergenIds(data.selectedAllergenIds);
      setLoading(false);
    }

    loadAllergens().catch(() => {
      if (!cancelled) {
        setAllergens([]);
        setSelectedAllergenIds([]);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedAllergenIdSet = useMemo(
    () => new Set(selectedAllergenIds),
    [selectedAllergenIds],
  );

  const selectedAllergens = useMemo(
    () =>
      allergens.filter((allergen) =>
        selectedAllergenIdSet.has(allergen.id),
      ),
    [allergens, selectedAllergenIdSet],
  );

  return {
    allergens,
    selectedAllergens,
    selectedAllergenIds,
    selectedAllergenIdSet,
    loading,
  };
}