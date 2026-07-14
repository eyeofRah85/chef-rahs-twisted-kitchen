import { prisma } from "./script-prisma";
import { seedFoundationAllergens } from "../lib/foundation-seed";

async function main() {
  const result = await seedFoundationAllergens(prisma);

  console.log(`Seeded ${result.seededAllergenCount} baseline allergens.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
