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
        className="w-full rounded-xl bg-black px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
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