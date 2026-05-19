"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cart-store";

export function CartSummary() {
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal);
  const itemCount = useCartStore((state) => state.itemCount);
  const increaseQuantity = useCartStore((state) => state.increaseQuantity);
  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const deliveryFee = 10;
  const lateFee = 0;
  const total = subtotal() + deliveryFee + lateFee;

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
        {items.map((item) => (
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
              </div>
              {item.selectedOptions?.length ? (
                <ul className="mt-3 space-y-1 text-sm text-neutral-600">
                  {item.selectedOptions.map((option, index) => (
                    <li key={`${option.groupName}-${option.choiceName}-${index}`}>
                      {option.groupName}: {option.choiceName}
                      {option.priceDelta > 0
                        ? ` (+$${option.priceDelta.toFixed(2)})`
                        : ""}
                    </li>
                  ))}
                </ul>
              ) : null}

              {item.customerInstructions && (
                <div className="mt-3 rounded-xl bg-neutral-100 p-3 text-sm text-neutral-700">
                  <p className="font-semibold">Special Instructions</p>
                  <p className="mt-1 whitespace-pre-wrap">{item.customerInstructions}</p>
                </div>
              )}

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
        ))}

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