import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto flex max-w-6xl flex-col px-6 py-20">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
          Chef Rah&apos;s Twisted Kitchen
        </p>

        <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-neutral-950">
          Elegant comfort food with a creative twist.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-neutral-700">
          Order seasonal plates, a la carte favorites, pickup, delivery, and
          catering from Chef Rah&apos;s Twisted Kitchen.
        </p>

        <div className="mt-8 flex gap-4">
          <Link
            href="/menu"
            className="rounded-xl bg-black px-6 py-3 font-medium text-white"
          >
            View Menu
          </Link>
          <Link
            href="/cart"
            className="rounded-xl border border-neutral-300 px-6 py-3 font-medium"
          >
            View Cart
          </Link>
          <Link
            href="/catering"
            className="rounded-xl border border-black px-6 py-3 font-medium"
          >
            Catering
          </Link>
        </div>

        <div className="mt-12 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Ordering Rules</h2>
          <p className="mt-2 text-neutral-700">
            Sunday delivery orders are due by Thursday at 5:00 PM. Late orders
            may include a $10 late fee. No same-day orders.
          </p>
        </div>
      </section>
    </main>
  );
}