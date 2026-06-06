import Link from "next/link";
export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto flex max-w-6xl flex-col px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
          Meal Prep • Catering • Personal Chef
        </p>

        <h1 className="mt-4 text-5xl font-bold tracking-tight md:text-6xl">
          Chef-prepared meals for busy weeks, special events, and private dining.
        </h1>

        <p className="mt-5 max-w-2xl text-lg text-neutral-700">
          Chef Rah&apos;s Twisted Kitchen offers weekly meal plans, catering requests,
          personal chef inquiries, and custom food service options built around real
          schedules, dietary needs, and event goals.
        </p>    

        <section className="mt-16 grid gap-6 md:grid-cols-3">
          <Link
            href="/menu"
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <img className="h-48 w-full rounded-xl object-cover" src="MEAL-PREP.jpg" alt="Prepared meal prep containers"/>
            <h2 className="text-2xl font-semibold">Meal Plans</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Choose 5-day or 7-day meal plan packages with lunch and dinner options,
              meal components, substitutions, and special requests.
            </p>
          </Link>

          <Link
            href="/catering"
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <img className="h-48 w-full rounded-xl object-cover" src="CATERING.jpg" alt="Prepared catering containers"/>
            <h2 className="text-2xl font-semibold">Catering</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Submit event details for gatherings, private events, office meals, and
              custom catering requests.
            </p>
          </Link>

          <Link
            href="/personal-chef"
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"   
        >
            <img className="h-48 w-full rounded-xl object-cover" src="PERSONAL-CHEF.jpg" alt="Prepared person meal"/>
            <h2 className="text-2xl font-semibold">Personal Chef</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Request private chef services for custom dining experiences, personal
              meal prep, special occasions, or recurring support.
            </p>
          </Link>
        </section>

        <section className="mt-16 rounded-3xl border bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Food Gallery
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            See meal prep, catering, and chef-prepared options.
          </h2>

          <p className="mt-3 max-w-2xl text-neutral-700">
            Browse photos of prepared meals, catering setups, seasonal offerings, and
            menu inspiration.
          </p>

          <Link
            href="/gallery"
            className="mt-6 inline-flex rounded-xl bg-black px-5 py-3 text-sm font-medium text-white"
          >
            View Gallery
          </Link>
        </section>

        <div className="mt-12 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Ordering Notes</h2>
          <p className="mt-2 text-neutral-700">
            Meal plan orders may be subject to scheduling cutoffs, availability, and
            late-order fees. Final pickup, delivery, and request details are confirmed
            during checkout or follow-up.
          </p>
        </div>
      </section>
    </main>
  );
}
