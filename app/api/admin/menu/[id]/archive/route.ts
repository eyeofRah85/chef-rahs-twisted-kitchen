import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth-guards";
import { revalidateMenuPages } from "@/lib/menu-revalidation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { response } = await requireAdminApi();
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to archive menu item." },
      { status: 500 },
    );
  }
}
