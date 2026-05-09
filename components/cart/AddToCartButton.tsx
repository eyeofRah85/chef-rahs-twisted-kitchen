"use client";

import type { MenuItem } from "@/types/menu";
import { useCartStore } from "@/store/cart-store";

type AddToCartButtonProps = {
  item: MenuItem;
};

export function AddToCartButton({ item }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <button
      disabled={!item.available}
      onClick={() => addItem(item)}
      className="w-full rounded-xl bg-black px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
    >
      {item.available ? "Add to Order" : "Choose Substitute"}
    </button>
  );
}