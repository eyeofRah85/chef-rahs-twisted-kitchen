import { CartSummary } from "@/components/cart/CartSummary";

export default function CartPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Your Order
          </p>
          <h1 className="mt-3 text-4xl font-bold">Cart</h1>
        </div>

        <CartSummary />
      </div>
    </main>
  );
}