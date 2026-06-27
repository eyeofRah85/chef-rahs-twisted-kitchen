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

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const { session, response } = await requireAdminApi();
    if (response) return response;

    const { id } = await context.params;

    const body = (await request.json()) as {
      allergenIds?: unknown;
    };

    const submittedAllergenIds = body.allergenIds ?? [];

    if (
      !Array.isArray(submittedAllergenIds) ||
      submittedAllergenIds.some((allergenId) => typeof allergenId !== "string")
    ) {
      return NextResponse.json(
        { error: "Allergen IDs must be provided as strings." },
        { status: 400 },
      );
    }

    const trimmedAllergenIds = submittedAllergenIds.map((allergenId) =>
      allergenId.trim(),
    );

    if (trimmedAllergenIds.some((allergenId) => !allergenId)) {
      return NextResponse.json(
        { error: "Allergen IDs must be non-empty strings." },
        { status: 400 },
      );
    }

    const allergenIds = Array.from(new Set(trimmedAllergenIds));

    const [menuItem, validAllergens] = await Promise.all([
      prisma.menuItem.findUnique({
        where: { id },
        select: { id: true },
      }),
      prisma.allergen.findMany({
        where: {
          id: {
            in: allergenIds,
          },
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (!menuItem) {
      return NextResponse.json(
        { error: "Menu item not found." },
        { status: 404 },
      );
    }

    if (validAllergens.length !== allergenIds.length) {
      return NextResponse.json(
        { error: "One or more allergens were not found." },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.menuItemAllergen.deleteMany({
        where: {
          menuItemId: id,
        },
      });

      if (allergenIds.length > 0) {
        await tx.menuItemAllergen.createMany({
          data: allergenIds.map((allergenId) => ({
            menuItemId: id,
            allergenId,
          })),
        });
      }
    });

    revalidateMenuPages();

    await writeAdminAuditLog({
      session,
      action: "MENU_ITEM_ALLERGENS_UPDATED",
      entityType: "MenuItem",
      entityId: id,
      metadata: { allergenCount: allergenIds.length },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to assign allergens.",
      },
      { status: 500 },
    );
  }
}
