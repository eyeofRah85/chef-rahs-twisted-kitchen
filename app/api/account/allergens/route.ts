import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type PatchBody = {
  selectedAllergenIds?: unknown;
};

function parseSelectedAllergenIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      allergens: {
        select: {
          allergenId: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found." },
      { status: 404 },
    );
  }

  const allergens = await prisma.allergen.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });

  return NextResponse.json({
    allergens,
    selectedAllergenIds: user.allergens.map((entry) => entry.allergenId),
  });
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as PatchBody;
  const selectedAllergenIds = parseSelectedAllergenIds(
    body.selectedAllergenIds,
  );

  const user = await prisma.user.findFirst({
    where: {
      email: session.user.email,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found." },
      { status: 404 },
    );
  }

  const validAllergens = await prisma.allergen.findMany({
    where: {
      id: {
        in: selectedAllergenIds,
      },
    },
    select: {
      id: true,
    },
  });

  const validAllergenIds = validAllergens.map((allergen) => allergen.id);

  await prisma.$transaction([
    prisma.userAllergen.deleteMany({
      where: {
        userId: user.id,
      },
    }),

    ...(validAllergenIds.length > 0
      ? [
          prisma.userAllergen.createMany({
            data: validAllergenIds.map((allergenId) => ({
              userId: user.id,
              allergenId,
            })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);

  revalidatePath("/account");
  revalidatePath("/menu");
  revalidatePath("/checkout");

  return NextResponse.json({
    selectedAllergenIds: validAllergenIds,
  });
}