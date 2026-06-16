import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { optionGroupTemplates } from "@/data/option-templates";
import { revalidateMenuPages } from "@/lib/menu-revalidation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type MenuItemWithOptionGroups = {
  optionGroups: {
    name: string;
  }[];
};

const mealPlanTemplateNames = [
  "Spice Level",
  "Protein Substitution",
];

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    const menuItem = (await prisma.menuItem.findUnique({
      where: { id },
      include: {
        optionGroups: true,
      },
    })) as MenuItemWithOptionGroups | null;

    if (!menuItem) {
      return NextResponse.json(
        { error: "Menu item not found." },
        { status: 404 },
      );
    }

    const existingGroupNames = new Set(
      menuItem.optionGroups.map((group) => group.name),
    );

    const mealPlanTemplates = optionGroupTemplates.filter((template) =>
      mealPlanTemplateNames.includes(template.name),
    );

    for (const template of mealPlanTemplates) {
      if (existingGroupNames.has(template.name)) {
        continue;
      }

      await prisma.menuItemOptionGroup.create({
        data: {
          menuItemId: id,
          name: template.name,
          required: template.required,
          multiple: template.multiple,
          choices: {
            create: template.choices.map((choice) => ({
              name: choice.name,
              description: choice.description || null,
              dietaryInfo: choice.dietaryInfo || null,
              imageUrl: choice.imageUrl || null,
              requestOnly: Boolean(choice.requestOnly),
              priceDelta: Number(choice.priceDelta || 0),
            })),
          },
        },
      });
    }

    await prisma.menuItem.update({
      where: { id },
      data: {
        type: "MEAL_PLAN",
        requiresApproval: true,
        customerInstructionsEnabled: false,
      },
    });

    revalidateMenuPages();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to apply meal plan template." },
      { status: 500 },
    );
  }
}
