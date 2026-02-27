export { Role, AuditAction } from "@/types/enums";

export type UserSession = {
  id: string;
  name: string;
  email: string;
  role: import("@/types/enums").Role;
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
