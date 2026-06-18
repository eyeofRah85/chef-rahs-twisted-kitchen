import type { MenuItem } from "@/types/menu";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import Image from "next/image";

type MenuCardProps = {
  item: MenuItem;
};

export function MenuCard({ item }: MenuCardProps) {
  return (
    <article className="brand-card group flex h-full flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f7ead7]">
        <Image
          src={item.imageUrl || "/placeholder.png"}
          alt={item.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-300 group-hover:scale-105"
          unoptimized
        />

        <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-sm font-black text-[#24130f] shadow-sm">
          ${item.price.toFixed(2)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-[#f4eadb] px-3 py-1 font-semibold text-[#6f1f12]">
            {item.category}
          </span>

          {item.seasonal && (
            <span className="rounded-full bg-[#fff0bd] px-3 py-1 font-semibold text-[#8a5a00]">
              Seasonal
            </span>
          )}

          {!item.available && (
            <span className="rounded-full bg-red-100 px-3 py-1 font-semibold text-red-700">
              Unavailable
            </span>
          )}
        </div>

        <h3 className="text-xl font-black leading-tight">{item.name}</h3>

        <p className="mt-3 flex-1 break-words text-sm leading-6 text-[#6b5a50]">
          {item.description}
        </p>

        {item.allergens?.length ? (
          <p className="mt-4 text-xs font-medium text-[#6b5a50]">
            Allergens: {item.allergens.map((a) => a.name).join(", ")}
          </p>
        ) : null}

        <div className="mt-5">
          <AddToCartButton item={item} />
        </div>
      </div>
    </article>
  );
}
