"use client";

import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart-store";

type ReorderItem = {
  menuItemId: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
};

type ReorderButtonProps = {
  items: ReorderItem[];
};

export function ReorderButton({ items }: ReorderButtonProps) {
  const router = useRouter();
  const addRecoveredItem = useCartStore((state) => state.addRecoveredItem);

  return (
    <button
      type="button"
      onClick={() => {
        items.forEach((item) => addRecoveredItem(item));
        router.push("/cart");
      }}
      className="mt-3 inline-flex rounded-xl border px-5 py-2 text-sm font-medium"
    >
      Reorder
    </button>
  );
}