import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth-guards";
import { revalidateMenuPages } from "@/lib/menu-revalidation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { response } = await requireAdminApi();
    if (response) return response;

    const { id } = await context.params;

    await prisma.menuItemOptionGroup.delete({
      where: { id },
    });

    revalidateMenuPages();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to delete option group." },
      { status: 500 },
    );
  }
}
