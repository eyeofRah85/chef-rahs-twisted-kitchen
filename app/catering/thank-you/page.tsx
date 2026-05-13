import Link from "next/link";

export default function CateringThankYouPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-2xl rounded-2xl border bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
          Request Received
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          Thank you for your catering request.
        </h1>

        <p className="mt-4 text-neutral-700">
          Chef Rah&apos;s Twisted Kitchen will review the details and follow up
          with next steps, quote information, and deposit requirements if needed.
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/account"
            className="rounded-xl bg-black px-5 py-3 font-medium text-white"
          >
            Go to Account
          </Link>

          <Link
            href="/"
            className="rounded-xl border px-5 py-3 font-medium"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}