import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adminRoles = ["ADMIN", "OWNER"] as const;
type AdminRole = (typeof adminRoles)[number];

const ownerMode = process.argv.includes("--owner");

class ExistingOwnerError extends Error {}
class UserNotFoundError extends Error {}

function parseAdminRole(value: string | undefined): AdminRole {
  const role = (value ?? "ADMIN").trim().toUpperCase();

  if (adminRoles.includes(role as AdminRole)) {
    return role as AdminRole;
  }

  throw new Error("ADMIN_ROLE must be ADMIN or OWNER.");
}

function getMariaDbConfig() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
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

function getPromotionConfig() {
  if (ownerMode) {
    const email = process.env.OWNER_EMAIL?.trim().toLowerCase();

    if (!email) {
      throw new Error(
        "OWNER_EMAIL is required. Register that account first, then rerun npm run owner:promote.",
      );
    }

    return {
      email,
      role: "OWNER" as const,
      action: "OWNER_BOOTSTRAPPED",
      actorEmail: "owner:promote-script",
    };
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!email) {
    throw new Error(
      "ADMIN_EMAIL is required for the legacy admin promotion command.",
    );
  }

  return {
    email,
    role: parseAdminRole(process.env.ADMIN_ROLE),
    action: "ADMIN_ROLE_PROMOTED",
    actorEmail: "admin:promote-script",
  };
}

const promotion = getPromotionConfig();
const adapter = new PrismaMariaDb(getMariaDbConfig());
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.$transaction(
    async (transaction) => {
      const user = await transaction.user.findUnique({
        where: { email: promotion.email },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        throw new UserNotFoundError(
          `No registered user was found with email ${promotion.email}. Register the account before promoting it.`,
        );
      }

      if (user.role === promotion.role) {
        return { user, changed: false };
      }

      if (promotion.role === "OWNER") {
        const ownerCount = await transaction.user.count({
          where: { role: "OWNER" },
        });

        if (ownerCount > 0) {
          throw new ExistingOwnerError(
            "An owner already exists. Use the owner-only Role Manager to transfer or assign owner access.",
          );
        }
      }

      const updatedUser = await transaction.user.update({
        where: { id: user.id },
        data: { role: promotion.role },
        select: { id: true, email: true, role: true },
      });

      await transaction.adminAuditLog.create({
        data: {
          action: promotion.action,
          entityType: "User",
          entityId: user.id,
          actorEmail: promotion.actorEmail,
          metadata: {
            targetEmail: user.email,
            previousRole: user.role,
            newRole: updatedUser.role,
          },
        },
      });

      return { user: updatedUser, changed: true };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  if (result.changed) {
    console.log(`Promoted ${result.user.email} to ${result.user.role}.`);
  } else {
    console.log(`${result.user.email} is already ${result.user.role}.`);
  }
}

main()
  .catch((error: unknown) => {
    if (error instanceof UserNotFoundError || error instanceof ExistingOwnerError) {
      console.error(error.message);
    } else if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      console.error("Another role change occurred. Retry the promotion command.");
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
