import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const allergens = [
    "Dairy",
    "Egg",
    "Fish",
    "Shellfish",
    "Tree Nuts",
    "Peanuts",
    "Wheat",
    "Soy",
    "Sesame",
  ];

  for (const allergen of allergens) {
    await prisma.allergen.upsert({
      where: {
        name: allergen,
      },

      update: {},

      create: {
        name: allergen,
      },
    });
  }

  console.log("Allergens seeded.");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });