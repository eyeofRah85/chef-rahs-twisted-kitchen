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
    const body = await request.json();

    const available = Boolean(body.available);

    const updated = await prisma.menuItem.update({
      where: { id },
      data: { available },
    });

    revalidateMenuPages();

    await writeAdminAuditLog({
      session,
      action: "MENU_ITEM_AVAILABILITY_UPDATED",
      entityType: "MenuItem",
      entityId: updated.id,
      metadata: { available: updated.available },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update availability." },
      { status: 500 },
    );
  }
}
