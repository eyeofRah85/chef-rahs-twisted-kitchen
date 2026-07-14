import "server-only";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { NextResponse } from "next/server";

const ADMIN_ROLES = ["ADMIN", "OWNER"] as const;

type AdminRole = (typeof ADMIN_ROLES)[number];

export class AuthGuardError extends Error {
  status: 401 | 403;

  constructor(message: "Unauthorized" | "Forbidden", status: 401 | 403) {
    super(message);
    this.name = "AuthGuardError";
    this.status = status;
  }
}

function isAdminRole(role: unknown): role is AdminRole {
  return typeof role === "string" && ADMIN_ROLES.includes(role as AdminRole);
}

async function getPersistedUserAccess(session: Session) {
  const userId = session.user.id;
  const email = session.user.email;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    return user;
  }

  if (!email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  return user;
}

export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.email) {
    throw new AuthGuardError("Unauthorized", 401);
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  const user = await getPersistedUserAccess(session);

  if (!user || !isAdminRole(user.role)) {
    throw new AuthGuardError("Forbidden", 403);
  }

  session.user.id = user.id;
  session.user.role = user.role;

  return session;
}

export async function requireOwner() {
  const session = await requireAuth();
  const user = await getPersistedUserAccess(session);

  if (!user || user.role !== "OWNER") {
    throw new AuthGuardError("Forbidden", 403);
  }

  session.user.id = user.id;
  session.user.role = user.role;

  return session;
}

export async function requireAuthPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  return session;
}

export async function requireAdminPage() {
  const session = await requireAuthPage();
  const user = await getPersistedUserAccess(session);

  if (!user || !isAdminRole(user.role)) {
    notFound();
  }

  session.user.id = user.id;
  session.user.role = user.role;

  return session;
}

export async function requireOwnerPage() {
  const session = await requireAuthPage();
  const user = await getPersistedUserAccess(session);

  if (!user || user.role !== "OWNER") {
    notFound();
  }

  session.user.id = user.id;
  session.user.role = user.role;

  return session;
}

export async function requireAuthApi() {
  try {
    const session = await requireAuth();

    return {
      session,
      response: null,
    };
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return {
        session: null,
        response: NextResponse.json(
          { error: error.message },
          { status: error.status },
        ),
      };
    }

    throw error;
  }
}

export async function requireAdminApi() {
  try {
    const session = await requireAdmin();

    return {
      session,
      response: null,
    };
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return {
        session: null,
        response: NextResponse.json(
          { error: error.message },
          { status: error.status },
        ),
      };
    }

    throw error;
  }
}

export async function requireOwnerApi() {
  try {
    const session = await requireOwner();

    return {
      session,
      response: null,
    };
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return {
        session: null,
        response: NextResponse.json(
          { error: error.message },
          { status: error.status },
        ),
      };
    }

    throw error;
  }
}
