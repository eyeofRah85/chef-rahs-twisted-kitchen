import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adminRoles = ["ADMIN", "OWNER"] as const;
type AdminRole = (typeof adminRoles)[number];

function parseAdminRole(value: string | undefined): AdminRole {
  const role = (value ?? "ADMIN").trim().toUpperCase();

  if (adminRoles.includes(role as AdminRole)) {
    return role as AdminRole;
  }

  throw new Error("ADMIN_ROLE must be ADMIN or OWNER.");
}

function isPrismaNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2025"
  );
}

const databaseUrl = process.env.DATABASE_URL;
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const adminRole = parseAdminRole(process.env.ADMIN_ROLE);

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

if (!adminEmail) {
  throw new Error("ADMIN_EMAIL is required.");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  try {
    const user = await prisma.user.update({
      where: {
        email: adminEmail,
      },
      data: {
        role: adminRole,
      },
      select: {
        email: true,
        role: true,
      },
    });

    console.log(`Promoted ${user.email} to ${user.role}.`);
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      throw new Error(`No user found with email ${adminEmail}.`);
    }

    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
