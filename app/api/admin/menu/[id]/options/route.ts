import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import {
  isMenuOptionValidationError,
  normalizeMenuOptionChoice,
  normalizeMenuOptionGroupName,
  type MenuOptionChoiceInput,
} from "@/lib/menu-option-validation";
import { revalidateMenuPages } from "@/lib/menu-revalidation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type CreateOptionGroupInput = {
  groupName?: unknown;
  required?: boolean;
  multiple?: boolean;
  choices?: unknown;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const body = (await request.json()) as CreateOptionGroupInput;

    const { groupName, required, multiple, choices } = body;

    if (!Array.isArray(choices) || choices.length === 0) {
      return NextResponse.json(
        { error: "Group name and at least one choice required." },
        { status: 400 },
      );
    }

    const normalizedGroupName = normalizeMenuOptionGroupName(groupName);
    const normalizedChoices = choices.map((choice) =>
      normalizeMenuOptionChoice(choice as MenuOptionChoiceInput),
    );

    const optionGroup = await prisma.menuItemOptionGroup.create({
      data: {
        menuItemId: id,
        name: normalizedGroupName,
        required: Boolean(required),
        multiple: Boolean(multiple),
        choices: {
          create: normalizedChoices,
        },
      },
      include: {
        choices: true,
      },
    });

    revalidateMenuPages();

    return NextResponse.json(optionGroup);
  } catch (error) {
    if (isMenuOptionValidationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { error: "Failed to create option group." },
      { status: 500 },
    );
  }
}
