import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import {
  isGalleryImageCategory,
  type GalleryImageCategory,
} from "@/lib/gallery-images";
import { prisma } from "@/lib/prisma";
import { savePublicImageUpload } from "@/lib/public-upload";

function parseGalleryFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const alt = String(formData.get("alt") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const sortOrderValue = Number(formData.get("sortOrder") ?? 0);

  if (!title || !alt || !isGalleryImageCategory(category)) {
    throw new Error("Title, alt text, and a valid category are required.");
  }

  if (!Number.isInteger(sortOrderValue) || sortOrderValue < 0) {
    throw new Error("Sort order must be a whole number.");
  }

  return {
    title,
    alt,
    category: category as GalleryImageCategory,
    sortOrder: sortOrderValue,
  };
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const image = formData.get("image") as File | null;

    if (!image || image.size === 0) {
      return NextResponse.json(
        { error: "Upload an image for the gallery item." },
        { status: 400 },
      );
    }

    const fields = parseGalleryFields(formData);
    const src = await savePublicImageUpload(image, "gallery");

    const created = await prisma.galleryImage.create({
      data: {
        ...fields,
        src,
      },
    });

    revalidatePath("/gallery");
    revalidatePath("/admin/gallery");

    return NextResponse.json(created);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create gallery image.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
