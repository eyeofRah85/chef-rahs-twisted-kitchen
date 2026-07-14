import type { PrismaClient } from "@prisma/client";

export const foundationAllergenNames = [
  "Dairy",
  "Egg",
  "Fish",
  "Shellfish",
  "Peanut",
  "Tree Nut",
  "Soy",
  "Wheat",
  "Gluten",
  "Sesame",
] as const;

export async function seedFoundationAllergens(
  client: Pick<PrismaClient, "allergen">,
) {
  for (const name of foundationAllergenNames) {
    await client.allergen.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  return {
    seededAllergenCount: foundationAllergenNames.length,
    allergenNames: [...foundationAllergenNames],
  };
}
