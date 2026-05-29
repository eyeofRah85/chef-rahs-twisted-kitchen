import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

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

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const dietaryInfo = String(formData.get("dietaryInfo") ?? "").trim();
    const imageUrl = String(formData.get("imageUrl") ?? "").trim();
    const requestOnly = formData.get("requestOnly") === "on";
    const priceDelta = Number(formData.get("priceDelta") ?? 0);

    if (!name || Number.isNaN(priceDelta)) {
      return NextResponse.json(
        { error: "Name and valid price delta are required." },
        { status: 400 },
      );
    }

    const updated = await prisma.menuItemOptionChoice.update({
      where: { id },
      data: {
        name,
        description: description || null,
        dietaryInfo: dietaryInfo || null,
        imageUrl: imageUrl || null,
        requestOnly,
        priceDelta,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update option choice." },
      { status: 500 },
    );
  }
}