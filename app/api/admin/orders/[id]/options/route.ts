import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

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
    await requireAdmin();

    const { id } = await context.params;

    const body = await request.json();

    const {
      groupName,
      required,
      multiple,
      choices,
    } = body;

    if (!groupName || !choices?.length) {
      return NextResponse.json(
        {
          error:
            "Group name and at least one choice required.",
        },
        { status: 400 },
      );
    }

    const optionGroup =
      await prisma.menuItemOptionGroup.create({
        data: {
          menuItemId: id,
          name: groupName,
          required: Boolean(required),
          multiple: Boolean(multiple),

          choices: {
            create: choices.map((choice: any) => ({
              name: choice.name,
              priceDelta: choice.priceDelta ?? 0,
            })),
          },
        },

        include: {
          choices: true,
        },
      });

    return NextResponse.json(optionGroup);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to create option group.",
      },
      { status: 500 },
    );
  }
}