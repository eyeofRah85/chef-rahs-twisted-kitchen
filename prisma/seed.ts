import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

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

  await prisma.businessSettings.upsert({
    where: {
      id: "business-settings",
    },
    update: {},
    create: {
      id: "business-settings",
      deliveryFee: 10,
      lateFee: 10,
      cateringDepositPercent: 50,
      orderCutoffDay: 4,
      orderCutoffHour: 17,
      orderCutoffMinute: 0,
      noWeekendOrdering: true,
      deliveryArea: "Greater Atlanta area",
    },
  });

  console.log("Business settings seeded");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });