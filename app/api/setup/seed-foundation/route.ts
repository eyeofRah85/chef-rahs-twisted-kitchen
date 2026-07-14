import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { seedFoundationAllergens } from "@/lib/foundation-seed";
import { prisma } from "@/lib/prisma";
import { rateLimits, rateLimitRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MINIMUM_SEED_TOKEN_LENGTH = 32;

const noCacheHeaders = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

function jsonResponse(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: noCacheHeaders,
  });
}

function seedTokenMatches(providedToken: string, expectedToken: string) {
  const providedDigest = createHash("sha256").update(providedToken).digest();
  const expectedDigest = createHash("sha256").update(expectedToken).digest();

  return timingSafeEqual(providedDigest, expectedDigest);
}

export async function POST(request: NextRequest) {
  const expectedToken = process.env.FOUNDATION_SEED_TOKEN?.trim();

  if (
    !expectedToken ||
    expectedToken.length < MINIMUM_SEED_TOKEN_LENGTH
  ) {
    return jsonResponse({ error: "Not found." }, 404);
  }

  const rateLimitResponse = rateLimitRequest(
    request,
    rateLimits.foundationSeed,
  );

  if (rateLimitResponse) {
    for (const [name, value] of Object.entries(noCacheHeaders)) {
      rateLimitResponse.headers.set(name, value);
    }

    return rateLimitResponse;
  }

  const providedToken = request.headers
    .get("x-foundation-seed-token")
    ?.trim();

  if (!providedToken || !seedTokenMatches(providedToken, expectedToken)) {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  try {
    const result = await seedFoundationAllergens(prisma);

    console.info("Foundation allergen seed completed.", result);

    return jsonResponse(
      {
        success: true,
        ...result,
        nextStep:
          "Remove FOUNDATION_SEED_TOKEN from the environment and restart the app.",
      },
      200,
    );
  } catch (error) {
    console.error("Failed to seed foundation allergens.", error);

    return jsonResponse(
      { error: "Failed to seed foundation allergens." },
      500,
    );
  }
}
