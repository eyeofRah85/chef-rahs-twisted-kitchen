"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cart-store";
import { useCustomerAllergens } from "@/hooks/useCustomerAllergens";
import { AllergenConflictWarning } from "@/components/allergens/AllergenConflictWarning";

export function CartSummary() {
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal);
  const itemCount = useCartStore((state) => state.itemCount);
  const increaseQuantity = useCartStore((state) => state.increaseQuantity);
  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const { selectedAllergenIdSet } = useCustomerAllergens();

  const deliveryFee = 10;
  const lateFee = 0;
  const total = subtotal() + deliveryFee + lateFee;

  const cartAllergenConflicts = items.flatMap((item) =>
    (item.allergens ?? []).filter((allergen) =>
      selectedAllergenIdSet.has(allergen.id),
    ),
  );

  const uniqueCartAllergenConflicts = Array.from(
    new Map(
      cartAllergenConflicts.map((allergen) => [allergen.id, allergen]),
    ).values(),
  );

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
        <h2 className="text-2xl font-semibold">Your order is empty</h2>
        <p className="mt-2 text-neutral-600">
          Add menu items to begin your order.
        </p>

        <Link
          href="/menu"
          className="mt-6 inline-flex rounded-xl bg-black px-6 py-3 font-medium text-white"
        >
          View Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section className="space-y-4">
        {uniqueCartAllergenConflicts.length > 0 && (
          <AllergenConflictWarning conflicts={uniqueCartAllergenConflicts} />
        )}

        {items.map((item) => {
          const itemAllergenConflicts = (item.allergens ?? []).filter(
            (allergen) => selectedAllergenIdSet.has(allergen.id),
          );

          return (
            <div
              key={item.cartId}
              className="rounded-2xl border bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{item.name}</h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    {item.category}
                  </p>
                  <p className="mt-2 font-medium">${item.price.toFixed(2)}</p>

                  {itemAllergenConflicts.length > 0 && (
                    <div className="mt-3">
                      <AllergenConflictWarning
                        conflicts={itemAllergenConflicts}
                        compact
                      />
                    </div>
                  )}

                  {item.selectedOptions?.length ? (
                    <ul className="mt-3 space-y-1 text-sm text-neutral-600">
                      {item.selectedOptions.map((option, index) => (
                        <li
                          key={`${option.groupName}-${option.choiceName}-${index}`}
                        >
                          {option.groupName}: {option.choiceName}
                          {option.priceDelta > 0
                            ? ` (+$${option.priceDelta.toFixed(2)})`
                            : ""}

                          {option.requestOnly && (
                            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                              Request Only
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {item.requiresApproval && (
                    <div className="mt-3 rounded-xl border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900">
                      This item requires chef approval before the order is
                      confirmed.
                    </div>
                  )}

                  {item.customerInstructions && (
                    <div className="mt-3 rounded-xl bg-neutral-100 p-3 text-sm text-neutral-700">
                      <p className="font-semibold">Special Instructions</p>
                      <p className="mt-1 whitespace-pre-wrap">
                        {item.customerInstructions}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => removeItem(item.cartId)}
                  className="text-sm text-red-600"
                >
                  Remove
                </button>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => decreaseQuantity(item.cartId)}
                  className="h-9 w-9 rounded-full border"
                >
                  -
                </button>

                <span className="w-8 text-center font-semibold">
                  {item.quantity}
                </span>

                <button
                  onClick={() => increaseQuantity(item.cartId)}
                  className="h-9 w-9 rounded-full border"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}

        <button onClick={clearCart} className="text-sm text-red-600">
          Clear order
        </button>
      </section>

      <aside className="h-fit rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Order Summary</h2>

        <div className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <span>Items</span>
            <span>{itemCount()}</span>
          </div>

          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal().toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span>${deliveryFee.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span>Late Fee</span>
            <span>${lateFee.toFixed(2)}</span>
          </div>

          <div className="border-t pt-3 text-base font-bold">
            <div className="flex justify-between">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {uniqueCartAllergenConflicts.length > 0 && (
          <div className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
            Please review the allergen warning before continuing to checkout.
          </div>
        )}

        <Link
          href="/checkout"
          className="mt-6 block rounded-xl bg-black px-5 py-3 text-center font-medium text-white"
        >
          Continue to Checkout
        </Link>
      </aside>
    </div>
  );
}