import Link from "next/link";
import { notFound } from "next/navigation";
import { assertEmailPreviewAvailable } from "@/app/dev/email-preview/guard";
import { emailPreviews, getEmailPreview } from "@/lib/dev-email-preview-data";

export function generateStaticParams() {
  return emailPreviews.map((preview) => ({ slug: preview.slug }));
}

export default async function EmailPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  assertEmailPreviewAvailable();

  const { slug } = await params;
  const preview = getEmailPreview(slug);

  if (!preview) {
    notFound();
  }

  return (
    <main className="bg-[#f7efe7] px-4 py-8 min-h-screen">
      <div className="mx-auto mb-6 max-w-3xl rounded-2xl border border-[#ead8c4] bg-white p-5 shadow-sm">
        <Link className="text-sm font-bold text-[#9f6b3d]" href="/dev/email-preview">
          ← All email previews
        </Link>
        <p className="mt-4 text-sm font-bold uppercase tracking-[0.3em] text-[#9f6b3d]">
          Development email preview
        </p>
        <h1 className="mt-2 text-3xl font-black">{preview.label}</h1>
        <p className="mt-2 text-[#6b5a50]">{preview.description}</p>
      </div>
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[#ead8c4] bg-white shadow-sm">
        {preview.render()}
      </div>
    </main>
  );
}
