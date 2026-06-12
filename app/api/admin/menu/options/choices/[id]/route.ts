import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import {
  isMenuOptionValidationError,
  normalizeMenuOptionChoice,
} from "@/lib/menu-option-validation";
import { revalidateMenuPages } from "@/lib/menu-revalidation";

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

    const choice = normalizeMenuOptionChoice({
      name: formData.get("name"),
      description: formData.get("description"),
      dietaryInfo: formData.get("dietaryInfo"),
      imageUrl: formData.get("imageUrl"),
      requestOnly: formData.get("requestOnly"),
      priceDelta: formData.get("priceDelta"),
    });

    const updated = await prisma.menuItemOptionChoice.update({
      where: { id },
      data: choice,
    });

    revalidateMenuPages();

    return NextResponse.json(updated);
  } catch (error) {
    if (isMenuOptionValidationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { error: "Failed to update option choice." },
      { status: 500 },
    );
  }
}
