import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireOwnerApi } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { userRoles, type UserRoleValue } from "@/lib/prisma-enums";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

class LastOwnerError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUserRole(value: unknown): value is UserRoleValue {
  return (
    typeof value === "string" &&
    userRoles.includes(value as UserRoleValue)
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const { session, response } = await requireOwnerApi();
  if (response) return response;

  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  const role = isRecord(body) ? body.role : undefined;

  if (!id) {
    return NextResponse.json({ error: "A target user is required." }, { status: 400 });
  }

  if (!isUserRole(role)) {
    return NextResponse.json({ error: "Select a valid user role." }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(
      async (transaction) => {
        const target = await transaction.user.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (!target) {
          return null;
        }

        if (target.role === role) {
          return { user: target, changed: false };
        }

        if (target.role === "OWNER" && role !== "OWNER") {
          const ownerCount = await transaction.user.count({
            where: { role: "OWNER" },
          });

          if (ownerCount <= 1) {
            throw new LastOwnerError(
              "Promote another owner before changing the last owner account.",
            );
          }
        }

        const updatedUser = await transaction.user.update({
          where: { id: target.id },
          data: { role },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        await transaction.adminAuditLog.create({
          data: {
            action: "USER_ROLE_UPDATED",
            entityType: "User",
            entityId: target.id,
            actorUserId: session?.user?.id ?? null,
            actorEmail: session?.user?.email ?? null,
            metadata: {
              targetEmail: target.email,
              previousRole: target.role,
              newRole: updatedUser.role,
            },
          },
        });

        return { user: updatedUser, changed: true };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    if (!result) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof LastOwnerError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { error: "Another role update occurred. Refresh and try again." },
        { status: 409 },
      );
    }

    console.error("Failed to update user role.", error);

    return NextResponse.json(
      { error: "Failed to update the user role." },
      { status: 500 },
    );
  }
}
