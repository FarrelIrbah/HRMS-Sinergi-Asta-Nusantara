import { PrismaClient, AuditAction } from "@/generated/prisma/client";
import type { InputJsonValue } from "@/generated/prisma/internal/prismaNamespace";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Creates an audit log entry directly in the AuditLog table.
 * This function must NOT trigger any further audit logging to avoid infinite recursion.
 * Service functions should call this explicitly after every create, update, and delete mutation.
 */
export async function createAuditLog(params: {
  userId: string;
  action: AuditAction;
  module: string;
  targetId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      module: params.module,
      targetId: params.targetId,
      oldValue: (params.oldValue as InputJsonValue) ?? undefined,
      newValue: (params.newValue as InputJsonValue) ?? undefined,
    },
  });
}
