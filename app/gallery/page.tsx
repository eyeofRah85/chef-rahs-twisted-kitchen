import Image from "next/image";
import Link from "next/link";
import { getPublicGalleryImages } from "@/lib/gallery-images";
import { isRemoteImageUrl } from "@/lib/image-urls";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const galleryImages = await getPublicGalleryImages();
  const categories = Array.from(
    new Set(galleryImages.map((image) => image.category)),
  );

  return (
    <main className="brand-page px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="brand-eyebrow">Gallery</p>

          <h1 className="mt-3 max-w-4xl text-5xl font-script font-black leading-tight">
            Meal Prep, Catering, and Personal Chef Services
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-[#6b5a50]">
            Explore meal prep, meal plan options, catering setups, personal chef
            services, and seasonal creations from Chef Rah&apos;s Twisted
            Kitchen.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/menu"
              className="brand-button-primary px-5 py-3 text-sm"
            >
              View Meal Plans
            </Link>

            <Link
              href="/catering"
              className="brand-button-secondary px-5 py-3 text-sm"
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
                <h2 className="mb-5 text-3xl font-black">{category}</h2>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {images.map((image) => (
                    <div
                      key={image.src}
                      className="brand-card group overflow-hidden transition hover:-translate-y-1 hover:shadow-2xl"
                    >
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-105"
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          unoptimized={isRemoteImageUrl(image.src)}
                        />
                      </div>

                      <div className="p-4">
                        <h3 className="font-black">{image.title}</h3>
                        <p className="mt-1 text-sm font-medium text-[#9f2f18]">
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
