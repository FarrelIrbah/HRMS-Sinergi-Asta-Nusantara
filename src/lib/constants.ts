import { Role, AuditAction } from "@/types/enums";

export const ROLES: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  HR_ADMIN: "Admin HR",
  MANAGER: "Manajer",
  EMPLOYEE: "Karyawan",
};

export const MODULES = {
  USER: "Manajemen Pengguna",
  DEPARTMENT: "Departemen",
  POSITION: "Jabatan",
  OFFICE_LOCATION: "Lokasi Kantor",
  LEAVE_TYPE: "Jenis Cuti",
  AUTH: "Autentikasi",
} as const;

export const AUDIT_ACTIONS: Record<AuditAction, string> = {
  CREATE: "Buat",
  UPDATE: "Ubah",
  DELETE: "Hapus",
};

export const DEFAULT_PAGE_SIZE = 25;

export const PAGE_SIZE_OPTIONS = [25, 50] as const;
