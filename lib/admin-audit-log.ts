import "server-only";

import type { Session } from "next-auth";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AdminAuditLogInput = {
  session: Session | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function writeAdminAuditLog({
  session,
  action,
  entityType,
  entityId,
  metadata,
}: AdminAuditLogInput) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        action,
        entityType,
        entityId: entityId ?? null,
        actorUserId: session?.user?.id ?? null,
        actorEmail: session?.user?.email ?? null,
        metadata: metadata ?? undefined,
      },
    });
  } catch (error) {
    console.error("Failed to write admin audit log.", error);
  }
}
