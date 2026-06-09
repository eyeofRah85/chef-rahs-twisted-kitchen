import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteGalleryImageButton } from "@/components/admin/DeleteGalleryImageButton";
import { GalleryImageEditForm } from "@/components/admin/GalleryImageEditForm";
import { GalleryImageForm } from "@/components/admin/GalleryImageForm";
import { requireAdmin } from "@/lib/auth-guards";
import { getAdminGalleryImages } from "@/lib/gallery-images";

export default async function AdminGalleryPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const images = await getAdminGalleryImages();

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link className="text-sm font-medium underline" href="/admin">
            &larr; Back to Dashboard
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Admin
          </p>

          <h1 className="mt-3 text-4xl font-bold">Gallery Manager</h1>

          <p className="mt-3 max-w-3xl text-neutral-700">
            Upload, categorize, reorder, edit, and remove public gallery images.
            WebP images are preferred for faster public page loads.
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-[380px_1fr]">
          <aside className="xl:sticky xl:top-24 xl:self-start">
            <GalleryImageForm />
          </aside>

          <section className="space-y-5">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold">Current Images</h2>

                  <p className="mt-1 text-sm text-neutral-500">
                    {images.length} image{images.length === 1 ? "" : "s"} in
                    the public gallery.
                  </p>
                </div>

                <Link
                  href="/gallery"
                  className="rounded-xl border px-4 py-2 text-sm font-medium"
                >
                  View Public Gallery
                </Link>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {images.map((image) => (
                <article
                  key={image.id}
                  className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          {image.title}
                        </h3>

                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                          {image.category}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-neutral-600">
                        {image.alt}
                      </p>

                      <p className="mt-2 text-xs text-neutral-500">
                        Sort order: {image.sortOrder}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <GalleryImageEditForm
                        image={{
                          id: image.id,
                          src: image.src,
                          alt: image.alt,
                          title: image.title,
                          category: image.category,
                          sortOrder: image.sortOrder,
                        }}
                      />

                      <DeleteGalleryImageButton
                        imageId={image.id}
                        title={image.title}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {images.length === 0 && (
              <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
                <p className="font-medium">No gallery images yet.</p>

                <p className="mt-2 text-sm text-neutral-500">
                  Add an image to publish it to the public gallery.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
