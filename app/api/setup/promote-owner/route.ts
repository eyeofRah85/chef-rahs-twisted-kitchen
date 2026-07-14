import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimits, rateLimitRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MINIMUM_BOOTSTRAP_TOKEN_LENGTH = 32;

class ExistingOwnerError extends Error {}
class OwnerAccountNotFoundError extends Error {}

function jsonResponse(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function bootstrapTokenMatches(providedToken: string, expectedToken: string) {
  const providedDigest = createHash("sha256").update(providedToken).digest();
  const expectedDigest = createHash("sha256").update(expectedToken).digest();

  return timingSafeEqual(providedDigest, expectedDigest);
}

function hasPrismaErrorCode(error: unknown, code: string) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

export async function POST(request: NextRequest) {
  const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const expectedToken = process.env.OWNER_BOOTSTRAP_TOKEN?.trim();

  if (
    !ownerEmail ||
    !expectedToken ||
    expectedToken.length < MINIMUM_BOOTSTRAP_TOKEN_LENGTH
  ) {
    return jsonResponse({ error: "Not found." }, 404);
  }

  const rateLimitResponse = rateLimitRequest(
    request,
    rateLimits.ownerBootstrap,
  );

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const providedToken = request.headers.get("x-owner-bootstrap-token")?.trim();

  if (!providedToken || !bootstrapTokenMatches(providedToken, expectedToken)) {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  try {
    const promotedOwner = await prisma.$transaction(
      async (transaction) => {
        const existingOwner = await transaction.user.findFirst({
          where: { role: "OWNER" },
          select: { id: true },
        });

        if (existingOwner) {
          throw new ExistingOwnerError();
        }

        const targetUser = await transaction.user.findUnique({
          where: { email: ownerEmail },
          select: {
            id: true,
            email: true,
            role: true,
          },
        });

        if (!targetUser) {
          throw new OwnerAccountNotFoundError();
        }

        const updatedUser = await transaction.user.update({
          where: { id: targetUser.id },
          data: { role: "OWNER" },
          select: {
            id: true,
            email: true,
            role: true,
          },
        });

        await transaction.adminAuditLog.create({
          data: {
            action: "OWNER_BOOTSTRAPPED",
            entityType: "User",
            entityId: updatedUser.id,
            actorEmail: "owner-bootstrap-endpoint",
            metadata: {
              targetEmail: updatedUser.email,
              previousRole: targetUser.role,
              newRole: updatedUser.role,
              source: "POST /api/setup/promote-owner",
            },
          },
        });

        return updatedUser;
      },
      { isolationLevel: "Serializable" },
    );

    return jsonResponse(
      {
        success: true,
        promoted: {
          email: promotedOwner.email,
          role: promotedOwner.role,
        },
        nextStep:
          "Remove OWNER_BOOTSTRAP_TOKEN from the environment and restart the app.",
      },
      200,
    );
  } catch (error) {
    if (error instanceof ExistingOwnerError) {
      return jsonResponse(
        { error: "Owner bootstrap is already complete." },
        409,
      );
    }

    if (error instanceof OwnerAccountNotFoundError) {
      return jsonResponse(
        {
          error:
            "The configured owner account must register before owner bootstrap.",
        },
        409,
      );
    }

    if (hasPrismaErrorCode(error, "P2034")) {
      return jsonResponse(
        { error: "Another owner bootstrap attempt is in progress. Retry once." },
        409,
      );
    }

    console.error("Failed to bootstrap the owner account.", error);

    return jsonResponse(
      { error: "Failed to bootstrap the owner account." },
      500,
    );
  }
}
