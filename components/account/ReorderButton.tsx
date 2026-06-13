"use client";

import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart-store";

type ReorderItem = {
  id: string;
  menuItemId: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
  isWeeklyMealPlan?: boolean;
};

type ReorderButtonProps = {
  items: ReorderItem[];
};

export function ReorderButton({ items }: ReorderButtonProps) {
  const router = useRouter();
  const addRecoveredItem = useCartStore((state) => state.addRecoveredItem);
  const reorderableItems = items.filter((item) => !item.isWeeklyMealPlan);
  const skippedWeeklyItemCount = items.length - reorderableItems.length;
  const hasReorderableItems = reorderableItems.length > 0;

  return (
    <div className="mt-3">
      <button
        type="button"
        disabled={!hasReorderableItems}
        onClick={() => {
          if (!hasReorderableItems) return;

          reorderableItems.forEach((item) => addRecoveredItem(item));
          router.push("/cart");
        }}
        className={
          hasReorderableItems
            ? "inline-flex rounded-xl border px-5 py-2 text-sm font-medium"
            : "inline-flex cursor-not-allowed rounded-xl border bg-neutral-100 px-5 py-2 text-sm font-medium text-neutral-500"
        }
      >
        {skippedWeeklyItemCount > 0 ? "Reorder Available Items" : "Reorder"}
      </button>

      {skippedWeeklyItemCount > 0 && (
        <p className="mt-2 max-w-xs text-xs text-neutral-500">
          Weekly meal plans must be ordered from the current weekly menu.
        </p>
      )}
    </div>
  );
}
