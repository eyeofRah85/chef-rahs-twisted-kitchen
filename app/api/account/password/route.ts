import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { rateLimits, rateLimitRequest } from "@/lib/rate-limit";

const MINIMUM_PASSWORD_LENGTH = 8;
const BCRYPT_COST = 12;

const responseHeaders = {
  "Cache-Control": "no-store",
};

function jsonResponse(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: responseHeaders,
  });
}

function readPasswordField(
  payload: Record<string, unknown>,
  field: string,
) {
  const value = payload[field];

  return typeof value === "string" ? value : "";
}

export async function PATCH(request: NextRequest) {
  const { session, response } = await requireAuthApi();

  if (response || !session?.user?.id) {
    return response ?? jsonResponse({ error: "Unauthorized." }, 401);
  }

  const rateLimitResponse = rateLimitRequest(
    request,
    rateLimits.accountPasswordChange,
  );

  if (rateLimitResponse) {
    rateLimitResponse.headers.set("Cache-Control", "no-store");
    return rateLimitResponse;
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid password change request." }, 400);
  }

  if (typeof payload !== "object" || payload === null) {
    return jsonResponse({ error: "Invalid password change request." }, 400);
  }

  const passwordFields = payload as Record<string, unknown>;
  const currentPassword = readPasswordField(passwordFields, "currentPassword");
  const newPassword = readPasswordField(passwordFields, "newPassword");
  const confirmPassword = readPasswordField(
    passwordFields,
    "confirmPassword",
  );

  if (!currentPassword || !newPassword || !confirmPassword) {
    return jsonResponse({ error: "All password fields are required." }, 400);
  }

  if (newPassword !== confirmPassword) {
    return jsonResponse({ error: "New passwords do not match." }, 400);
  }

  if (newPassword.length < MINIMUM_PASSWORD_LENGTH) {
    return jsonResponse(
      {
        error: `New password must be at least ${MINIMUM_PASSWORD_LENGTH} characters.`,
      },
      400,
    );
  }

  if (bcrypt.truncates(newPassword)) {
    return jsonResponse(
      { error: "New password is too long for secure storage." },
      400,
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true },
  });

  if (!user?.passwordHash) {
    return jsonResponse(
      { error: "Password change is unavailable for this account." },
      400,
    );
  }

  const currentPasswordIsValid = await bcrypt.compare(
    currentPassword,
    user.passwordHash,
  );

  if (!currentPasswordIsValid) {
    return jsonResponse({ error: "Current password is incorrect." }, 400);
  }

  if (currentPassword === newPassword) {
    return jsonResponse(
      { error: "New password must be different from the current password." },
      400,
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return jsonResponse(
    {
      success: true,
      message: "Password changed successfully. Sign in again to continue.",
    },
    200,
  );
}
