import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const formData = await request.formData();

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const price = Number(formData.get("price") ?? 0);
    const categoryName = String(formData.get("categoryName") ?? "").trim();
    const available = formData.get("available") === "on";
    const seasonal = formData.get("seasonal") === "on";
    const type = String(formData.get("type") ?? "PLATE");
    const requiresApproval = formData.get("requiresApproval") === "on";
    const customerInstructionsEnabled = formData.get("customerInstructionsEnabled") === "on";
    const image = formData.get("imageUrl") as File | null;

// const rawCategoryName = String(formData.get("categoryName") ?? "").trim();

// const categoryName =
//   rawCategoryName === "MEAL_PLAN"
//     ? "Meal Plans"
//     : rawCategoryName === "A_LA_CARTE"
//       ? "A La Carte"
//       : rawCategoryName || "Other";

     let imageUrl: string | null = null;

    if (image && image.size > 0) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(process.cwd(), "public", "uploads", "menu");
      await mkdir(uploadDir, { recursive: true });

      const safeFileName = `${Date.now()}-${image.name
        .replaceAll(" ", "-")
        .replace(/[^a-zA-Z0-9.-]/g, "")}`;

      const filePath = path.join(uploadDir, safeFileName);

      await writeFile(filePath, buffer);

      imageUrl = `/uploads/menu/${safeFileName}`;
    }


    if (!name || !description || !categoryName || price <= 0) {
      return NextResponse.json(
        { error: "Name, description, category, and valid price are required." },
        { status: 400 },
      );
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
        type: type as any,
        requiresApproval,
        customerInstructionsEnabled,
        categoryId: category.id,
        imageUrl,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create menu item." },
      { status: 500 },
    );
  }
}