import { prisma } from "@/lib/prisma";
import { AuditAction } from "@/generated/prisma/client";

interface AuditLogFilters {
  userId?: string;
  module?: string;
  action?: AuditAction;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

export async function getAuditLogs(filters: AuditLogFilters = {}) {
  const {
    userId,
    module,
    action,
    dateFrom,
    dateTo,
    page = 1,
    pageSize = 25,
  } = filters;

  const where = {
    ...(userId && { userId }),
    ...(module && { module }),
    ...(action && { action }),
    ...((dateFrom || dateTo) && {
      createdAt: {
        ...(dateFrom && { gte: dateFrom }),
        ...(dateTo && { lte: dateTo }),
      },
    }),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data: logs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getAuditLogById(id: string) {
  return prisma.auditLog.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function getAuditLogUsers() {
  const logs = await prisma.auditLog.findMany({
    select: { user: { select: { id: true, name: true, email: true } } },
    distinct: ["userId"],
    orderBy: { user: { name: "asc" } },
  });
  return logs.map((log) => log.user);
}

export async function getAuditLogModules() {
  const logs = await prisma.auditLog.findMany({
    select: { module: true },
    distinct: ["module"],
    orderBy: { module: "asc" },
  });
  return logs.map((log) => log.module);
}
