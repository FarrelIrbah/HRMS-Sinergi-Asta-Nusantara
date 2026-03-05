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

export const Gender = {
  MALE: "MALE",
  FEMALE: "FEMALE",
} as const;

export type Gender = (typeof Gender)[keyof typeof Gender];

export const Religion = {
  ISLAM: "ISLAM",
  KRISTEN: "KRISTEN",
  KATOLIK: "KATOLIK",
  HINDU: "HINDU",
  BUDDHA: "BUDDHA",
  KONGHUCU: "KONGHUCU",
} as const;

export type Religion = (typeof Religion)[keyof typeof Religion];

export const MaritalStatus = {
  TK: "TK",
  K: "K",
} as const;

export type MaritalStatus =
  (typeof MaritalStatus)[keyof typeof MaritalStatus];

export const ContractType = {
  PKWT: "PKWT",
  PKWTT: "PKWTT",
} as const;

export type ContractType =
  (typeof ContractType)[keyof typeof ContractType];

export const PTKPStatus = {
  TK_0: "TK_0",
  TK_1: "TK_1",
  TK_2: "TK_2",
  TK_3: "TK_3",
  K_0: "K_0",
  K_1: "K_1",
  K_2: "K_2",
  K_3: "K_3",
} as const;

export type PTKPStatus = (typeof PTKPStatus)[keyof typeof PTKPStatus];

export const DocumentType = {
  KTP: "KTP",
  NPWP: "NPWP",
  BPJS_KESEHATAN: "BPJS_KESEHATAN",
  BPJS_KETENAGAKERJAAN: "BPJS_KETENAGAKERJAAN",
  KONTRAK: "KONTRAK",
  FOTO: "FOTO",
  LAINNYA: "LAINNYA",
} as const;

export type DocumentType =
  (typeof DocumentType)[keyof typeof DocumentType];

export const AttendanceStatus = {
  ON_TIME: "ON_TIME",
  LATE: "LATE",
  EARLY_OUT: "EARLY_OUT",
  OVERTIME: "OVERTIME",
  LATE_AND_EARLY_OUT: "LATE_AND_EARLY_OUT",
  LATE_AND_OVERTIME: "LATE_AND_OVERTIME",
} as const;
export type AttendanceStatus =
  (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const LeaveStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;
export type LeaveStatus = (typeof LeaveStatus)[keyof typeof LeaveStatus];
