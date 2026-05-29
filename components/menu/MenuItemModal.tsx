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


  if (!open) return null;

  function toggleChoice(
    groupId: string,
    choiceId: string,
    multiple: boolean,
  ) {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];

      if (!multiple) {
        return {
          ...prev,
          [groupId]: [choiceId],
        };
      }

      const exists = current.includes(choiceId);

      return {
        ...prev,
        [groupId]: exists
          ? current.filter((id) => id !== choiceId)
          : [...current, choiceId],
      };
    });
  }

  function handleAddToCart() {
    const requiredMissing = item.optionGroups?.some(
      (group) => group.required && !(selected[group.id]?.length > 0),
    );

    if (requiredMissing) {
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
          });
        }
      }
    }

    addItem(item, selectedOptions, customerInstructions);
    setSelected({});
    setCustomerInstructions("");
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
              Customize
            </p>

            <h2 className="mt-2 text-3xl font-bold">{item.name}</h2>

            <p className="mt-2 text-neutral-600">{item.description}</p>
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

        <div className="mt-6 space-y-6">
          {item.optionGroups?.map((group) => (
            <section key={group.id} className="rounded-xl border p-4">
              <div className="mb-3">
                <h3 className="font-semibold">{group.name}</h3>
                <p className="text-xs text-neutral-500">
                  {group.required ? "Required" : "Optional"} ·{" "}
                  {group.multiple ? "Choose multiple" : "Choose one"}
                </p>
              </div>

              <div className="space-y-2">
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
          ))}

          {!item.optionGroups?.length && (
            <p className="text-sm text-neutral-600">
              No customization options for this item.
            </p>
          )}
        </div>

        {item.customerInstructionsEnabled && (
          <section className="mt-6 rounded-xl border p-4">
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