import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function getMariaDbConfig() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }

  const url = new URL(process.env.DATABASE_URL);

  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace("/", ""),
  };
}

const adapter = new PrismaMariaDb(getMariaDbConfig());

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
      checkoutCustomerSchedulingEnabled: false,
      checkoutFixedFulfillmentDay: 0,
      checkoutFixedFulfillmentHour: 12,
      checkoutFixedFulfillmentMinute: 0,
      checkoutFixedFulfillmentMessage: "Orders are fulfilled on Sunday.",
      weeklyCustomerSchedulingEnabled: false,
      weeklyOrderingOpenDay: 3,
      weeklyOrderingOpenHour: 0,
      weeklyOrderingOpenMinute: 0,
      weeklyLateFeeStartDay: 5,
      weeklyLateFeeStartHour: 17,
      weeklyLateFeeStartMinute: 0,
      weeklyOrderingCloseDay: 5,
      weeklyOrderingCloseHour: 22,
      weeklyOrderingCloseMinute: 0,
      weeklyFixedFulfillmentDay: 0,
      weeklyFixedFulfillmentHour: 12,
      weeklyFixedFulfillmentMinute: 0,
      weeklyFixedFulfillmentMessage:
        "Weekly meal plan orders are delivered on Sunday.",
    },
  });

  console.log("Business settings seeded");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
