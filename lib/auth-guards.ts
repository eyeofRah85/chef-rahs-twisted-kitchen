import { auth } from "@/auth";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return session;
}

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const role = session.user.role;

  if (role !== "ADMIN" && role !== "OWNER") {
    throw new Error("Forbidden");
  }

  return session;
}
