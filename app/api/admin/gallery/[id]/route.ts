import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
<<<<<<< HEAD
import { writeAdminAuditLog } from "@/lib/admin-audit-log";
=======
>>>>>>> security/baseline-hardening
import { requireAdminApi } from "@/lib/auth-guards";
import {
  isGalleryImageCategory,
  type GalleryImageCategory,
} from "@/lib/gallery-images";
import { parsePublicImageUrl } from "@/lib/image-urls";
import { prisma } from "@/lib/prisma";
import {
  removePublicUpload,
  savePublicImageUpload,
} from "@/lib/public-upload";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function PATCH(request: Request, context: RouteContext) {
  try {
<<<<<<< HEAD
    const { session, response } = await requireAdminApi();
=======
    const { response } = await requireAdminApi();
>>>>>>> security/baseline-hardening
    if (response) return response;

    const { id } = await context.params;
    const existing = await prisma.galleryImage.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Gallery image not found." },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const fields = parseGalleryFields(formData);
    const image = formData.get("image") as File | null;
    const imageUrl = parsePublicImageUrl(formData.get("imageUrl"));
    const src =
      image && image.size > 0
        ? await savePublicImageUpload(image, "gallery")
        : imageUrl ?? existing.src;

    const updated = await prisma.galleryImage.update({
      where: { id },
      data: {
        ...fields,
        src,
      },
    });

    if (src !== existing.src) {
      await removePublicUpload(existing.src, "gallery");
    }

    revalidatePath("/gallery");
    revalidatePath("/admin/gallery");

    await writeAdminAuditLog({
      session,
      action: "GALLERY_IMAGE_UPDATED",
      entityType: "GalleryImage",
      entityId: updated.id,
      metadata: { category: updated.category },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update gallery image.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
<<<<<<< HEAD
    const { session, response } = await requireAdminApi();
=======
    const { response } = await requireAdminApi();
>>>>>>> security/baseline-hardening
    if (response) return response;

    const { id } = await context.params;
    const existing = await prisma.galleryImage.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Gallery image not found." },
        { status: 404 },
      );
    }

    await prisma.galleryImage.delete({
      where: { id },
    });
    await removePublicUpload(existing.src, "gallery");

    revalidatePath("/gallery");
    revalidatePath("/admin/gallery");

    await writeAdminAuditLog({
      session,
      action: "GALLERY_IMAGE_DELETED",
      entityType: "GalleryImage",
      entityId: existing.id,
      metadata: { category: existing.category },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete gallery image." },
      { status: 500 },
    );
  }
}
