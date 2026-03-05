import {
  Role,
  AuditAction,
  Gender,
  Religion,
  MaritalStatus,
  ContractType,
  PTKPStatus,
  DocumentType,
  AttendanceStatus,
  LeaveStatus,
} from "@/types/enums";

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
  EMPLOYEE: "Karyawan",
  EMPLOYEE_DOCUMENT: "Dokumen Karyawan",
  EMERGENCY_CONTACT: "Kontak Darurat",
} as const;

export const AUDIT_ACTIONS: Record<AuditAction, string> = {
  CREATE: "Buat",
  UPDATE: "Ubah",
  DELETE: "Hapus",
};

// ─── Employee Enum Labels ─────────────────────────────────────────────

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: "Laki-laki",
  FEMALE: "Perempuan",
};

export const RELIGION_LABELS: Record<Religion, string> = {
  ISLAM: "Islam",
  KRISTEN: "Kristen",
  KATOLIK: "Katolik",
  HINDU: "Hindu",
  BUDDHA: "Buddha",
  KONGHUCU: "Konghucu",
};

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
  TK: "Tidak Kawin",
  K: "Kawin",
};

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  PKWT: "PKWT",
  PKWTT: "PKWTT",
};

export const PTKP_STATUS_LABELS: Record<PTKPStatus, string> = {
  TK_0: "TK/0",
  TK_1: "TK/1",
  TK_2: "TK/2",
  TK_3: "TK/3",
  K_0: "K/0",
  K_1: "K/1",
  K_2: "K/2",
  K_3: "K/3",
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  KTP: "KTP",
  NPWP: "NPWP",
  BPJS_KESEHATAN: "BPJS Kesehatan",
  BPJS_KETENAGAKERJAAN: "BPJS Ketenagakerjaan",
  KONTRAK: "Kontrak",
  FOTO: "Foto",
  LAINNYA: "Lainnya",
};

export const DEFAULT_PAGE_SIZE = 25;

export const PAGE_SIZE_OPTIONS = [25, 50] as const;

// ─── Attendance and Leave Constants ──────────────────────────────────

export const OVERTIME_THRESHOLD_MINUTES = 30;

export const MODULES_ATTENDANCE = {
  ATTENDANCE: "Absensi",
  LEAVE_REQUEST: "Permintaan Cuti",
  LEAVE_BALANCE: "Saldo Cuti",
} as const;

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  ON_TIME: "Tepat Waktu",
  LATE: "Terlambat",
  EARLY_OUT: "Pulang Lebih Awal",
  OVERTIME: "Lembur",
  LATE_AND_EARLY_OUT: "Terlambat & Pulang Awal",
  LATE_AND_OVERTIME: "Terlambat & Lembur",
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
};
