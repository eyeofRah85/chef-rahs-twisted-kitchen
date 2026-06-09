import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { parseEnumValue } from "@/lib/enum-values";
import { removePublicUpload } from "@/lib/public-upload";
import { menuItemTypes } from "@/lib/prisma-enums";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const formData = await request.formData();
    const categoryName = String(formData.get("categoryName") ?? "").trim() || "Other";
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const price = Number(formData.get("price") ?? 0);
    const type = String(formData.get("type") ?? "PLATE");
    const seasonal = formData.get("seasonal") === "on";
    const requiresApproval = formData.get("requiresApproval") === "on";
    const customerInstructionsEnabled =
      formData.get("customerInstructionsEnabled") === "on";
    const menuItemType = parseEnumValue(menuItemTypes, type);

    if (!name || !description || price < 0 || !menuItemType) {
      return NextResponse.json(
        { error: "Name, description, valid price, and valid type are required." },
        { status: 400 },
      );
    }

    const category = await prisma.menuCategory.upsert({
      where: {
        name: categoryName,
      },
      update: {},
      create: {
        name: categoryName,
      },
    });

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        name,
        description,
        price,
        type: menuItemType,
        categoryId: category.id,
        seasonal,
        requiresApproval,
        customerInstructionsEnabled,
      },
    });

    revalidatePath("/menu");
    revalidatePath("/admin/menu");

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update menu item." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const existing = await prisma.menuItem.findUnique({
      where: { id },
      select: {
        id: true,
        imageUrl: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Menu item not found." },
        { status: 404 },
      );
    }

    await prisma.menuItem.delete({
      where: { id },
    });
    await removePublicUpload(existing.imageUrl, "menu");

    revalidatePath("/menu");
    revalidatePath("/admin/menu");
    revalidatePath("/admin/menu/archived");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to delete menu item." },
      { status: 500 },
    );
  }
}
