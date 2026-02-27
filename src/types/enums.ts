/**
 * Client-safe enum definitions.
 * These mirror the Prisma-generated enums but do NOT import from Prisma
 * so they can safely be used in "use client" components and validation schemas.
 */

export const Role = {
  SUPER_ADMIN: "SUPER_ADMIN",
  HR_ADMIN: "HR_ADMIN",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const AuditAction = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
