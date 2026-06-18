import Link from "next/link";

export default function CateringThankYouPage() {
  return (
    <main className="brand-page px-6 py-12">
      <div className="brand-card mx-auto max-w-2xl p-8 text-center">
        <p className="brand-eyebrow">Request Received</p>

        <h1 className="mt-3 text-4xl font-black">
          Thank you for your catering request.
        </h1>

        <p className="mt-4 leading-7 text-[#6b5a50]">
          Chef Rah&apos;s Twisted Kitchen will review the details and follow up
          with next steps, quote information, and deposit requirements if
          needed.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/account" className="brand-button-primary px-5 py-3">
            Go to Account
          </Link>

          <Link href="/" className="brand-button-secondary px-5 py-3">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
