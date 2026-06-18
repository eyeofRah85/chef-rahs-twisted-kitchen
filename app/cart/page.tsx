import { CartSummary } from "@/components/cart/CartSummary";

export default function CartPage() {
  return (
    <main className="brand-page px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="brand-eyebrow">Your Order</p>
            <h1 className="mt-3 text-5xl font-black">Cart</h1>
            <p className="mt-3 max-w-2xl leading-7 text-[#6b5a50]">
              Review quantities, request-only selections, allergen warnings, and
              your estimated total before checkout.
            </p>
          </div>
        </div>

        <CartSummary />
      </div>
    </main>
  );
}
