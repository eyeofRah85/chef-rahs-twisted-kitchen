import Link from "next/link";

export default function PersonalChefThankYouPage() {
  return (
    <main className="brand-page px-6 py-12">
      <div className="brand-card mx-auto max-w-2xl p-8 text-center">
        <p className="brand-eyebrow">Request Received</p>

        <h1 className="mt-3 text-4xl font-black">
          Thank you for your personal chef request.
        </h1>

        <p className="mt-4 leading-7 text-[#6b5a50]">
          Chef Rah&apos;s Twisted Kitchen will review your request and follow up
          with availability, pricing, and next steps.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/account/catering"
            className="brand-button-primary px-5 py-3"
          >
            View Requests
          </Link>

          <Link href="/" className="brand-button-secondary px-5 py-3">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
