import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi  } from "@/lib/auth-guards";
import { revalidateMenuPages } from "@/lib/menu-revalidation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminApi ();

    const { id } = await context.params;
    const body = await request.json();

    const available = Boolean(body.available);

    const updated = await prisma.menuItem.update({
      where: { id },
      data: { available },
    });

    revalidateMenuPages();

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update availability." },
      { status: 500 },
    );
  }
}
