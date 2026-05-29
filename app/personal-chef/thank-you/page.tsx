import Link from "next/link";

export default function PersonalChefThankYouPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-2xl rounded-2xl border bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
          Request Received
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          Thank you for your personal chef request.
        </h1>

        <p className="mt-4 text-neutral-700">
          Chef Rah&apos;s Twisted Kitchen will review your request and follow up
          with availability, pricing, and next steps.
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/account/catering"
            className="rounded-xl bg-black px-5 py-3 font-medium text-white"
          >
            View Requests
          </Link>

          <Link href="/" className="rounded-xl border px-5 py-3 font-medium">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}