import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
<<<<<<< HEAD
import { writeAdminAuditLog } from "@/lib/admin-audit-log";
=======
>>>>>>> security/baseline-hardening
import { requireAdminApi } from "@/lib/auth-guards";
import { revalidateMenuPages } from "@/lib/menu-revalidation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
<<<<<<< HEAD
    const { session, response } = await requireAdminApi();
=======
    const { response } = await requireAdminApi();
>>>>>>> security/baseline-hardening
    if (response) return response;

    const { id } = await context.params;

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        archived: true,
        available: false,
      },
    });

    revalidateMenuPages({ includeArchived: true });

    await writeAdminAuditLog({
      session,
      action: "MENU_ITEM_ARCHIVED",
      entityType: "MenuItem",
      entityId: updated.id,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to archive menu item." },
      { status: 500 },
    );
  }
}
