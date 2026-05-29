"use client";

import { useState } from "react";
import type { MenuItem } from "@/types/menu";
import type { SelectedCartOption } from "@/store/cart-store";
import { useCartStore } from "@/store/cart-store";

type Props = {
  item: MenuItem;
  open: boolean;
  onClose: () => void;
};

export function MenuItemModal({ item, open, onClose }: Props) {
  const addItem = useCartStore((state) => state.addItem);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [customerInstructions, setCustomerInstructions] = useState("");
  const [showRequiredErrors, setShowRequiredErrors] = useState(false);

  if (!open) return null;

  function toggleChoice(
    groupId: string,
    choiceId: string,
    multiple: boolean,
  ) {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];

      const nextSelected = !multiple
        ? {
            ...prev,
            [groupId]: [choiceId],
          }
        : {
            ...prev,
            [groupId]: current.includes(choiceId)
              ? current.filter((id) => id !== choiceId)
              : [...current, choiceId],
          };

      const stillMissingRequired = item.optionGroups?.some(
        (group) => group.required && !(nextSelected[group.id]?.length > 0),
      );

      if (!stillMissingRequired) {
        setShowRequiredErrors(false);
      }

      return nextSelected;
    });
  }

  function handleAddToCart() {
    const requiredMissing = item.optionGroups?.some(
      (group) => group.required && !(selected[group.id]?.length > 0),
    );

    if (requiredMissing) {
      setShowRequiredErrors(true);
      alert("Please choose all required options.");
      return;
    }

    const selectedOptions: SelectedCartOption[] = [];

    for (const group of item.optionGroups ?? []) {
      const selectedChoiceIds = selected[group.id] ?? [];

      for (const choice of group.choices) {
        if (selectedChoiceIds.includes(choice.id)) {
          selectedOptions.push({
            groupName: group.name,
            choiceName: choice.requestOnly
              ? `${choice.name} (Request Only)`
              : choice.name,
            priceDelta: choice.priceDelta,
            requestOnly: choice.requestOnly,
          });
        }
      }
    }

    addItem(item, selectedOptions, customerInstructions);
    setSelected({});
    setCustomerInstructions("");
    setShowRequiredErrors(false);
    onClose();
  }

  const selectedOptionsTotal =
    item.optionGroups?.reduce((total, group) => {
      const selectedChoiceIds = selected[group.id] ?? [];

      return (
        total +
        group.choices
          .filter((choice) => selectedChoiceIds.includes(choice.id))
          .reduce((sum, choice) => sum + choice.priceDelta, 0)
      );
    }, 0) ?? 0;

  const displayTotal = item.price + selectedOptionsTotal;

  const selectedSummary =
    item.optionGroups?.flatMap((group) => {
      const selectedChoiceIds = selected[group.id] ?? [];

      return group.choices
        .filter((choice) => selectedChoiceIds.includes(choice.id))
        .map((choice) => ({
          groupName: group.name,
          choiceName: choice.requestOnly
            ? `${choice.name} (Request Only)`
            : choice.name,
          priceDelta: choice.priceDelta,
          requestOnly: choice.requestOnly,
        }));
    }) ?? [];

  return (
    
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Customize
            </p>

          <h2 className="mt-2 text-3xl font-bold">{item.name}</h2>

          <p className="mt-2 text-neutral-600">{item.description}</p>

          {item.type === "MEAL_PLAN" && (
            <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              Meal plans are package-based. Choose your plan length, meal count, and
              preferred meal components. Pork and beef are available by request only and
              pricing may vary.
            </div>
          )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full border px-3 py-1 text-sm"
          >
            Close
          </button>
        </div>

        {item.allergens?.length ? (
          <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Allergens:</strong>{" "}
            {item.allergens.map((a) => a.name).join(", ")}
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {item.optionGroups?.map((group) => {
  const missingRequired =
    showRequiredErrors &&
    group.required &&
    !(selected[group.id]?.length > 0);

  return (
    <section
      key={group.id}
      className={`rounded-2xl border p-5 ${
        missingRequired ? "border-red-400 bg-red-50" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold">{group.name}</h3>

        {group.required && (
          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
            Required
          </span>
        )}
      </div>

      <p className="mt-1 text-sm text-neutral-500">
        {group.multiple ? "Choose one or more" : "Choose one"}
      </p>

      {missingRequired && (
        <p className="mt-3 rounded-xl bg-red-100 p-3 text-sm text-red-800">
          Please make a selection for this required option.
        </p>
      )}

      <div className="mt-4 space-y-2">
        {group.choices.map((choice) => {
                  const checked = selected[group.id]?.includes(choice.id) ?? false;

                  return (
                    <label
                      key={choice.id}
                      className={`flex cursor-pointer gap-4 rounded-xl border p-4 transition ${
                        checked ? "border-black bg-neutral-50" : "hover:bg-neutral-50"
                      }`}
                    >
                      <input
                        type={group.multiple ? "checkbox" : "radio"}
                        name={group.id}
                        checked={checked}
                        onChange={() =>
                          toggleChoice(group.id, choice.id, group.multiple)
                        }
                        className="mt-1"
                      />

                      {choice.imageUrl && (
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                          <img
                            src={choice.imageUrl}
                            alt={choice.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold">{choice.name}</p>

                          <div className="flex items-center gap-2">
                            {choice.requestOnly && (
                              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                                Request Only
                              </span>
                            )}

                            {choice.priceDelta > 0 && (
                              <span className="text-sm font-medium">
                                +${choice.priceDelta.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        {choice.description && (
                          <p className="mt-2 text-sm text-neutral-600">
                            {choice.description}
                          </p>
                        )}

                        {choice.dietaryInfo && (
                          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                            {choice.dietaryInfo}
                          </p>
                        )}

                        {choice.requestOnly && (
                          <p className="mt-2 text-xs text-amber-700">
                            This option may require chef approval and pricing may vary.
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>
          );
        })}

          {!item.optionGroups?.length && (
            <p className="text-sm text-neutral-600">
              No customization options for this item.
            </p>
          )}
        </div>

        {item.customerInstructionsEnabled && (
          <section className="mt-6 rounded-2xl border p-5">
            <label className="block font-semibold">
              Special Instructions
            </label>

            <textarea
              rows={4}
              value={customerInstructions}
              onChange={(e) => setCustomerInstructions(e.target.value)}
              className="mt-3 w-full rounded-xl border px-4 py-3 text-sm"
              placeholder="Describe your custom meal plan request, substitutions, or preferences."
            />
          </section>
        )}
          {selectedSummary.length > 0 && (
            <section className="mt-6 rounded-2xl border bg-neutral-50 p-5">
              <h3 className="font-semibold">Your Selections</h3>

              <div className="mt-3 space-y-2 text-sm">
                {selectedSummary.map((selection, index) => (
                  <div
                    key={`${selection.groupName}-${selection.choiceName}-${index}`}
                    className="flex flex-wrap justify-between gap-2 rounded-xl bg-white p-3"
                  >
                    <div>
                      <span className="font-medium">{selection.groupName}:</span>{" "}
                      {selection.choiceName}

                      {selection.requestOnly && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Request Only
                        </span>
                      )}
                    </div>

                    {selection.priceDelta > 0 && (
                      <span className="font-medium">
                        +${selection.priceDelta.toFixed(2)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        <div className="mt-8 flex items-center justify-between border-t pt-5">
          <div>
            <p className="text-sm text-neutral-500">Item total</p>
            <p className="text-2xl font-bold">${displayTotal.toFixed(2)}</p>
          </div>

          <button
            onClick={handleAddToCart}
            className="rounded-xl bg-black px-6 py-3 font-medium text-white"
          >
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
}