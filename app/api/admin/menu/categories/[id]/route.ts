import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAdminAuditLog } from "@/lib/admin-audit-log";
import { requireAdminApi } from "@/lib/auth-guards";
import { revalidateMenuPages } from "@/lib/menu-revalidation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { session, response } = await requireAdminApi();
    if (response) return response;

    const { id } = await context.params;
    const formData = await request.formData();

    const name = String(formData.get("name") ?? "").trim();
    const sortOrder = Number(formData.get("sortOrder") ?? 0);

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required." },
        { status: 400 },
      );
    }

    const updated = await prisma.menuCategory.update({
      where: { id },
      data: {
        name,
        sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
      },
    });

    revalidateMenuPages({
      includeArchived: true,
      includeCategories: true,
    });

    await writeAdminAuditLog({
      session,
      action: "MENU_CATEGORY_UPDATED",
      entityType: "MenuCategory",
      entityId: updated.id,
      metadata: { sortOrder: updated.sortOrder },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update category." },
      { status: 500 },
    );
  }
}
