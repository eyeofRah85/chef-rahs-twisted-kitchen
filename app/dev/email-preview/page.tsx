import Link from "next/link";
import { assertEmailPreviewAvailable } from "@/app/dev/email-preview/guard";
import { emailPreviews } from "@/lib/dev-email-preview-data";

export default function EmailPreviewIndexPage() {
  assertEmailPreviewAvailable();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#9f6b3d]">
        Development only
      </p>
      <h1 className="mt-3 text-4xl font-black">Email previews</h1>
      <p className="mt-4 text-lg text-[#6b5a50]">
        Preview transactional email templates with fake data. These pages do not
        send email and are unavailable in production.
      </p>
      <div className="mt-8 grid gap-4">
        {emailPreviews.map((preview) => (
          <Link
            className="rounded-2xl border border-[#ead8c4] bg-white p-5 shadow-sm transition hover:border-[#9f6b3d]"
            href={`/dev/email-preview/${preview.slug}`}
            key={preview.slug}
          >
            <h2 className="text-xl font-black">{preview.label}</h2>
            <p className="mt-2 text-[#6b5a50]">{preview.description}</p>
            <p className="mt-3 text-sm font-bold text-[#9f6b3d]">/{preview.slug}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
