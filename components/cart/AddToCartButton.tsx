"use client";

import { useState } from "react";
import type { MenuItem } from "@/types/menu";
import { useCartStore } from "@/store/cart-store";
import { MenuItemModal } from "@/components/menu/MenuItemModal";

type AddToCartButtonProps = {
  item: MenuItem;
};

export function AddToCartButton({ item }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [open, setOpen] = useState(false);

  const hasOptions = Boolean(item.optionGroups?.length);

  return (
    <>
      <button
        disabled={!item.available}
        onClick={() => {
          if (hasOptions || item.allergens?.length) {
            setOpen(true);
            return;
          }

          addItem(item);
        }}
        className="brand-button-primary w-full px-4 py-3 text-sm disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-600 disabled:shadow-none"
      >
        {!item.available
          ? "Unavailable"
          : hasOptions
            ? "Customize"
            : "Add to Order"}
      </button>

      <MenuItemModal item={item} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
