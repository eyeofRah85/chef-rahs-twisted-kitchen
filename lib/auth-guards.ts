import "server-only";

import { auth } from "@/auth";
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

export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.email) {
    throw new AuthGuardError("Unauthorized", 401);
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();

  const role = session.user.role;

  if (!isAdminRole(role)) {
    throw new AuthGuardError("Forbidden", 403);
  }

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

  const role = session.user.role;

  if (!isAdminRole(role)) {
    notFound();
  }

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