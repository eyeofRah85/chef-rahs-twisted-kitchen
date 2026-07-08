import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

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

const adapter = new PrismaMariaDb(getMariaDbConfig());

export const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});