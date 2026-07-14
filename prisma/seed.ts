import { prisma } from "./script-prisma";

const baselineAllergenNames = [
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

async function main() {
  for (const name of baselineAllergenNames) {
    await prisma.allergen.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`Seeded ${baselineAllergenNames.length} baseline allergens.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
