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

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { session, response } = await requireAdminApi();
    if (response) return response;

    const { id } = await context.params;

    const deleted = await prisma.menuItemOptionGroup.delete({
      where: { id },
      select: {
        id: true,
        menuItemId: true,
      },
    });

    revalidateMenuPages();

    await writeAdminAuditLog({
      session,
      action: "MENU_ITEM_OPTION_GROUP_DELETED",
      entityType: "MenuItemOptionGroup",
      entityId: deleted.id,
      metadata: { menuItemId: deleted.menuItemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to delete option group." },
      { status: 500 },
    );
  }
}
