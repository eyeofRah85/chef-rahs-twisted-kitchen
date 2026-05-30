import Image from "next/image";
import Link from "next/link";
import { galleryImages } from "@/data/gallery";

export default function GalleryPage() {
  const categories = Array.from(
    new Set(galleryImages.map((image) => image.category)),
  );

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Gallery
          </p>

          <h1 className="mt-3 text-5xl font-bold">
            Meal Prep, Catering, and Personal Chef Services
          </h1>

          <p className="mt-4 max-w-2xl text-neutral-700">
            Explore meal prep, meal plan options, catering setups, personal chef services,
            and seasonal creations from Chef Rah&apos;s Twisted Kitchen.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/menu"
              className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white"
            >
              View Meal Plans
            </Link>

            <Link
              href="/catering"
              className="rounded-xl border px-5 py-3 text-sm font-medium"
            >
              Request Catering
            </Link>
          </div>
        </div>

        <div className="space-y-12">
          {categories.map((category) => {
            const images = galleryImages.filter(
              (image) => image.category === category,
            );

            return (
              <section key={category}>
                <h2 className="mb-5 text-3xl font-bold">{category}</h2>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {images.map((image) => (
                    <div
                      key={image.src}
                      className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                    >
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          className="object-cover"
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        />
                      </div>

                      <div className="p-4">
                        <h3 className="font-semibold">{image.title}</h3>
                        <p className="mt-1 text-sm text-neutral-500">
                          {image.category}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}