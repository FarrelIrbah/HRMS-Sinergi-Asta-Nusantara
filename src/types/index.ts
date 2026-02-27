import { Role, AuditAction } from "@/generated/prisma/client";

export { Role, AuditAction };

export type UserSession = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ServiceResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
