import {
  galleryImages as fallbackGalleryImages,
  galleryCategoryOptions,
  type GalleryImage,
  type GalleryImageCategory,
} from "@/data/gallery";
import { prisma } from "@/lib/prisma";

export { galleryCategoryOptions };
export type { GalleryImage, GalleryImageCategory };

export type AdminGalleryImage = GalleryImage & {
  id: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export function isGalleryImageCategory(
  category: string,
): category is GalleryImageCategory {
  return galleryCategoryOptions.includes(category as GalleryImageCategory);
}

export async function getPublicGalleryImages(): Promise<GalleryImage[]> {
  try {
    const images = await prisma.galleryImage.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    if (images.length === 0) {
      return fallbackGalleryImages;
    }

    return images.map((image) => ({
      src: image.src,
      alt: image.alt,
      title: image.title,
      category: image.category as GalleryImageCategory,
    }));
  } catch {
    return fallbackGalleryImages;
  }
}

export async function getAdminGalleryImages(): Promise<AdminGalleryImage[]> {
  const images = await prisma.galleryImage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return images.map((image) => ({
    id: image.id,
    src: image.src,
    alt: image.alt,
    title: image.title,
    category: image.category as GalleryImageCategory,
    sortOrder: image.sortOrder,
    createdAt: image.createdAt,
    updatedAt: image.updatedAt,
  }));
}
