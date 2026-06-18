"use client";

import { useMemo, useState } from "react";
import { AllergenConflictWarning } from "@/components/allergens/AllergenConflictWarning";
import { useCustomerAllergens } from "@/hooks/useCustomerAllergens";
import { formatWeeklyMealPlanOptionType } from "@/lib/format-labels";
import {
  useCartStore,
  type WeeklyMealPlanCartSelection,
} from "@/store/cart-store";
import type { PublicWeeklyMenu } from "@/types/weekly-menu";

type Props = {
  weeklyMenu: PublicWeeklyMenu;
};

function optionsForType(
  offering: PublicWeeklyMenu["offerings"][number] | undefined,
  optionType: string,
) {
  return (
    offering?.options.filter((option) => option.optionType === optionType) ?? []
  );
}

export function WeeklyMenuOrderForm({ weeklyMenu }: Props) {
  const addWeeklyMealPlan = useCartStore((state) => state.addWeeklyMealPlan);
  const { selectedAllergenIdSet } = useCustomerAllergens();
  const [packageId, setPackageId] = useState(weeklyMenu.packages[0]?.id ?? "");
  const [offeringId, setOfferingId] = useState(
    weeklyMenu.offerings[0]?.id ?? "",
  );
  const [spiceOptionId, setSpiceOptionId] = useState("");
  const [proteinOptionId, setProteinOptionId] = useState("");
  const [added, setAdded] = useState(false);

  const selectedPackage = weeklyMenu.packages.find(
    (pkg) => pkg.id === packageId,
  );
  const selectedOffering = weeklyMenu.offerings.find(
    (offering) => offering.id === offeringId,
  );
  const spiceOptions = useMemo(
    () => optionsForType(selectedOffering, "SPICE_LEVEL"),
    [selectedOffering],
  );
  const proteinOptions = useMemo(
    () => optionsForType(selectedOffering, "PROTEIN_SUBSTITUTION"),
    [selectedOffering],
  );
  const selectedSpiceOption =
    spiceOptions.find((option) => option.id === spiceOptionId) ??
    spiceOptions[0] ??
    null;
  const selectedProteinOption = proteinOptions.find(
    (option) => option.id === proteinOptionId,
  );
  const allergenConflicts =
    selectedOffering?.allergens.filter((allergen) =>
      selectedAllergenIdSet.has(allergen.id),
    ) ?? [];
  const orderSlotsRemaining = Math.max(
    weeklyMenu.capacity - weeklyMenu.ordersPlaced,
    0,
  );
  const unavailable =
    weeklyMenu.orderingClosed ||
    orderSlotsRemaining < 1 ||
    weeklyMenu.packages.length === 0 ||
    weeklyMenu.offerings.length === 0;
  const spiceRequired = spiceOptions.length > 0;
  const missingRequiredSpice = spiceRequired && !selectedSpiceOption;
  const optionDelta =
    Number(selectedSpiceOption?.priceDelta ?? 0) +
    Number(selectedProteinOption?.priceDelta ?? 0);
  const displayTotal = selectedPackage
    ? selectedPackage.price + optionDelta
    : 0;

  function addSelection() {
    if (!selectedPackage || !selectedOffering || unavailable) return;

    if (missingRequiredSpice) {
      alert("Please choose a spice level.");
      return;
    }

    const selection: WeeklyMealPlanCartSelection = {
      weeklyMenuPeriodId: weeklyMenu.id,
      weeklyMealPlanPackageId: selectedPackage.id,
      weeklyMealPlanOfferingId: selectedOffering.id,
      spiceOptionId: selectedSpiceOption?.id ?? null,
      proteinSubstitutionOptionId: selectedProteinOption?.id ?? null,
      periodLabel: weeklyMenu.label,
      packageName: selectedPackage.name,
      packageDays: selectedPackage.days,
      packageMealsPerDay: selectedPackage.mealsPerDay,
      packagePrice: selectedPackage.price,
      offeringName: selectedOffering.name,
      spiceLevel: selectedSpiceOption?.name ?? null,
      spicePriceDelta: selectedSpiceOption?.priceDelta ?? 0,
      proteinSubstitution: selectedProteinOption?.name ?? null,
      proteinSubstitutionPriceDelta: selectedProteinOption?.priceDelta ?? 0,
      requestOnly: Boolean(
        selectedSpiceOption?.requestOnly || selectedProteinOption?.requestOnly,
      ),
      requiresApproval: Boolean(
        selectedSpiceOption?.requiresApproval ||
        selectedProteinOption?.requiresApproval ||
        selectedSpiceOption?.requestOnly ||
        selectedProteinOption?.requestOnly,
      ),
      priceDelta: optionDelta,
    };

    addWeeklyMealPlan(selection, selectedOffering.allergens);
    setAdded(true);
  }

  return (
    <div className="mb-8 rounded-lg border border-[#f4c46f]/35 bg-[#fff8ee] p-5 text-[#24130f] shadow-xl sm:p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <h3 className="text-2xl font-black">Build Your Weekly Plan</h3>

          <p className="mt-2 text-sm leading-6 text-[#6b5a50]">
            Choose a package, one fixed meal offering, spice level, and any
            allowed protein substitution.
          </p>
        </div>

        <div className="rounded-lg bg-[#24130f] px-4 py-3 text-white">
          <p className="text-xs font-bold uppercase text-[#f4c46f]">
            Plan total
          </p>
          <p className="text-2xl font-black">${displayTotal.toFixed(2)}</p>
        </div>
      </div>

      {unavailable && (
        <div className="mt-5 rounded-lg border border-[#d99426] bg-[#fff3cf] p-4 text-sm font-medium text-[#6f1f12]">
          {orderSlotsRemaining < 1
            ? "This weekly menu has reached its weekly order limit."
            : weeklyMenu.orderingClosed
              ? "Ordering for this weekly menu has closed."
              : "This weekly menu is not ready for ordering yet."}
        </div>
      )}

      <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2">
        <label className="grid min-w-0 gap-2 text-sm font-bold">
          Package
          <select
            value={packageId}
            onChange={(event) => {
              setPackageId(event.target.value);
              setAdded(false);
            }}
            className="w-full min-w-0 rounded-lg border border-[#d7bea1] bg-white px-4 py-3 text-sm font-medium text-[#24130f] outline-none transition focus:border-[#9f2f18] focus:ring-2 focus:ring-[#f4c46f]/40"
            disabled={unavailable}
          >
            {weeklyMenu.packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name} - ${pkg.price.toFixed(2)}
              </option>
            ))}
          </select>
        </label>

        <label className="grid min-w-0 gap-2 text-sm font-bold">
          Offering
          <select
            value={offeringId}
            onChange={(event) => {
              setOfferingId(event.target.value);
              setSpiceOptionId("");
              setProteinOptionId("");
              setAdded(false);
            }}
            className="w-full min-w-0 rounded-lg border border-[#d7bea1] bg-white px-4 py-3 text-sm font-medium text-[#24130f] outline-none transition focus:border-[#9f2f18] focus:ring-2 focus:ring-[#f4c46f]/40"
            disabled={unavailable}
          >
            {weeklyMenu.offerings.map((offering) => (
              <option key={offering.id} value={offering.id}>
                {offering.name}
              </option>
            ))}
          </select>
        </label>

        {spiceOptions.length > 0 && (
          <label className="grid min-w-0 gap-2 text-sm font-bold">
            {formatWeeklyMealPlanOptionType("SPICE_LEVEL")}
            <select
              value={selectedSpiceOption?.id ?? ""}
              onChange={(event) => {
                setSpiceOptionId(event.target.value);
                setAdded(false);
              }}
              className="w-full min-w-0 rounded-lg border border-[#d7bea1] bg-white px-4 py-3 text-sm font-medium text-[#24130f] outline-none transition focus:border-[#9f2f18] focus:ring-2 focus:ring-[#f4c46f]/40"
              disabled={unavailable}
            >
              {spiceOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                  {option.priceDelta > 0
                    ? ` +$${option.priceDelta.toFixed(2)}`
                    : ""}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="grid min-w-0 gap-2 text-sm font-bold">
          {formatWeeklyMealPlanOptionType("PROTEIN_SUBSTITUTION")}
          <select
            value={proteinOptionId}
            onChange={(event) => {
              setProteinOptionId(event.target.value);
              setAdded(false);
            }}
            className="w-full min-w-0 rounded-lg border border-[#d7bea1] bg-white px-4 py-3 text-sm font-medium text-[#24130f] outline-none transition focus:border-[#9f2f18] focus:ring-2 focus:ring-[#f4c46f]/40"
            disabled={unavailable}
          >
            <option value="">No substitution</option>
            {proteinOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
                {option.priceDelta > 0
                  ? ` +$${option.priceDelta.toFixed(2)}`
                  : ""}
                {option.requiresApproval ? " - approval required" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {allergenConflicts.length > 0 && (
        <div className="mt-5">
          <AllergenConflictWarning conflicts={allergenConflicts} />
        </div>
      )}

      <button
        type="button"
        onClick={addSelection}
        disabled={unavailable || missingRequiredSpice}
        className="brand-button-primary mt-5 w-full px-5 py-3 disabled:cursor-not-allowed disabled:bg-neutral-400 disabled:text-neutral-700 disabled:shadow-none"
      >
        {missingRequiredSpice
          ? "Choose Spice Level"
          : unavailable
            ? "Unavailable"
            : "Add Weekly Plan to Order"}
      </button>

      {added && (
        <p className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-bold text-green-800">
          Weekly meal plan added to your order.
        </p>
      )}
    </div>
  );
}
