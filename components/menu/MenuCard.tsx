import type { MenuItem } from "@/types/menu";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

type MenuCardProps = {
  item: MenuItem;
};

export function MenuCard({ item }: MenuCardProps) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">{item.name}</h3>
          <p className="mt-1 text-sm text-gray-600">{item.description}</p>
        </div>

        <span className="whitespace-nowrap text-lg font-bold">
          ${item.price.toFixed(2)}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-gray-100 px-3 py-1">
          {item.category}
        </span>

        {item.seasonal && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">
            Seasonal
          </span>
        )}

        {!item.available && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">
            Unavailable
          </span>
        )}
      </div>

      {item.allergens?.length ? (
        <p className="mb-4 text-xs text-gray-500">
          Allergens: {item.allergens.map((a) => a.name).join(", ")}
        </p>
      ) : null}

      <AddToCartButton item={item} />
    </div>
  );
}