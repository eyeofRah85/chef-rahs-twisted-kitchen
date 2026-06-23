import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth-guards";
import { parseEnumValue } from "@/lib/enum-values";
import { parsePublicImageUrl } from "@/lib/image-urls";
import { revalidateMenuPages } from "@/lib/menu-revalidation";
import { menuItemTypes } from "@/lib/prisma-enums";
import { savePublicImageUpload } from "@/lib/public-upload";

export async function POST(request: Request) {
  try {
    const { response } = await requireAdminApi();
    if (response) return response;

    const formData = await request.formData();

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const price = Number(formData.get("price") ?? 0);
    const categoryName = String(formData.get("categoryName") ?? "").trim();
    const available = formData.get("available") === "on";
    const seasonal = formData.get("seasonal") === "on";
    const type = String(formData.get("type") ?? "PLATE");
    const requiresApproval = formData.get("requiresApproval") === "on";
    const customerInstructionsEnabled =
      formData.get("customerInstructionsEnabled") === "on";
    const imageEntry = formData.get("imageUpload") ?? formData.get("imageUrl");
    const image = imageEntry instanceof File ? imageEntry : null;
    const menuItemType = parseEnumValue(menuItemTypes, type);
    const submittedImageUrl = parsePublicImageUrl(formData.get("imageUrl"));

    if (!name || !description || !categoryName || price <= 0 || !menuItemType) {
      return NextResponse.json(
        { error: "Name, description, category, valid price, and valid type are required." },
        { status: 400 },
      );
    }

    let imageUrl: string | null = submittedImageUrl;

    if (image && image.size > 0) {
      try {
        imageUrl = await savePublicImageUpload(image, "menu");
      } catch (uploadError) {
        return NextResponse.json(
          {
            error:
              uploadError instanceof Error
                ? uploadError.message
                : "Invalid image upload.",
          },
          { status: 400 },
        );
      }
    }

    const category = await prisma.menuCategory.upsert({
      where: { name: categoryName },
      update: {},
      create: {
        name: categoryName,
      },
    });

    const item = await prisma.menuItem.create({
      data: {
        name,
        description,
        price,
        available,
        seasonal,
        type: menuItemType,
        requiresApproval,
        customerInstructionsEnabled,
        categoryId: category.id,
        imageUrl,
      },
    });

    revalidateMenuPages({ includeCategories: true });

    return NextResponse.json(item);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Enter a valid public image URL."
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    console.error(error);

    return NextResponse.json(
      { error: "Failed to create menu item." },
      { status: 500 },
    );
  }
}
