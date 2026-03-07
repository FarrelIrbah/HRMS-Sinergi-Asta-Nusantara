import Decimal from "decimal.js";
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

// ─── Payroll: BPJS Rates ──────────────────────────────────────────────
export const BPJS_RATES = {
  KESEHATAN_EMPLOYEE: new Decimal("0.01"),    // 1%
  KESEHATAN_EMPLOYER: new Decimal("0.04"),    // 4%
  KESEHATAN_CAP: new Decimal("12000000"),     // Rp 12,000,000/month
  JHT_EMPLOYEE: new Decimal("0.02"),          // 2%
  JHT_EMPLOYER: new Decimal("0.037"),         // 3.7%
  JP_EMPLOYEE: new Decimal("0.01"),           // 1%
  JP_EMPLOYER: new Decimal("0.02"),           // 2%
  JP_CAP: new Decimal("10547400"),            // Rp 10,547,400/month (effective March 2025)
  JKK_EMPLOYER: new Decimal("0.0024"),        // 0.24% Kelompok I
  JKM_EMPLOYER: new Decimal("0.003"),         // 0.3%
} as const;

// ─── Payroll: PTKP Annual Values ─────────────────────────────────────
export const PTKP_ANNUAL: Record<PTKPStatus, Decimal> = {
  TK_0: new Decimal("54000000"),
  TK_1: new Decimal("58500000"),
  TK_2: new Decimal("63000000"),
  TK_3: new Decimal("67500000"),
  K_0:  new Decimal("58500000"),
  K_1:  new Decimal("63000000"),
  K_2:  new Decimal("67500000"),
  K_3:  new Decimal("72000000"),
};

// ─── Payroll: TER Category Mapping ───────────────────────────────────
export const TER_CATEGORY: Record<PTKPStatus, "A" | "B" | "C"> = {
  TK_0: "A", TK_1: "A", K_0: "A",
  TK_2: "B", TK_3: "B", K_1: "B", K_2: "B",
  K_3: "C",
};

// ─── Payroll: TER Rate Tables (PP 58/2023) ───────────────────────────
// Each entry: [upperLimit (inclusive), ratePercent]
// upperLimit for the last row = Infinity
export const TER_TABLE_A: [number, number][] = [
  [5400000, 0], [5650000, 0.25], [5950000, 0.5], [6300000, 0.75],
  [6750000, 1], [7500000, 1.25], [8550000, 1.5], [9650000, 1.75],
  [10050000, 2], [10350000, 2.25], [10700000, 2.5], [11050000, 3],
  [11600000, 3.5], [12500000, 4], [13750000, 5], [15100000, 6],
  [16950000, 7], [19750000, 8], [24150000, 9], [26450000, 10],
  [28000000, 11], [30050000, 12], [32400000, 13], [35400000, 14],
  [39100000, 15], [43850000, 16], [47800000, 17], [51400000, 18],
  [56300000, 19], [62200000, 20], [68600000, 21], [77500000, 22],
  [89000000, 23], [103000000, 24], [125000000, 25], [157000000, 26],
  [206000000, 27], [337000000, 28], [454000000, 29], [550000000, 30],
  [695000000, 31], [910000000, 32], [1400000000, 33], [Infinity, 34],
];

export const TER_TABLE_B: [number, number][] = [
  [6200000, 0], [6500000, 0.25], [6850000, 0.5], [7300000, 0.75],
  [9200000, 1], [10750000, 1.5], [11250000, 2], [11600000, 2.5],
  [12600000, 3], [13600000, 4], [14950000, 5], [16400000, 6],
  [18450000, 7], [21850000, 8], [26000000, 9], [27700000, 10],
  [29350000, 11], [31450000, 12], [33950000, 13], [37100000, 14],
  [41100000, 15], [45800000, 16], [49500000, 17], [53800000, 18],
  [58500000, 19], [64000000, 20], [71000000, 21], [80000000, 22],
  [93000000, 23], [109000000, 24], [129000000, 25], [163000000, 26],
  [211000000, 27], [374000000, 28], [459000000, 29], [555000000, 30],
  [704000000, 31], [957000000, 32], [1405000000, 33], [Infinity, 34],
];

// NOTE: Category C row 8 (10,950,000-11,200,000) shows 1.75% — verified as-is from
// multiple sources; may be a transcription anomaly in the official PP 58/2023 Lampiran.
export const TER_TABLE_C: [number, number][] = [
  [6600000, 0], [6950000, 0.25], [7350000, 0.5], [7800000, 0.75],
  [8850000, 1], [9800000, 1.25], [10950000, 2], [11200000, 1.75],
  [12050000, 2], [12950000, 3], [14150000, 4], [15550000, 5],
  [17050000, 6], [19500000, 7], [22700000, 8], [26600000, 9],
  [28100000, 10], [30100000, 11], [32600000, 12], [35400000, 13],
  [38900000, 14], [43000000, 15], [47400000, 16], [51200000, 17],
  [55800000, 18], [60400000, 19], [66700000, 20], [74500000, 21],
  [83200000, 22], [95600000, 23], [110000000, 24], [134000000, 25],
  [169000000, 26], [221000000, 27], [390000000, 28], [463000000, 29],
  [561000000, 30], [709000000, 31], [965000000, 32], [1419000000, 33],
  [Infinity, 34],
];

// ─── Payroll: PPh 21 Progressive Brackets (Article 17 — December use only) ──
export const PPH21_PROGRESSIVE_BRACKETS: [number, number][] = [
  [60000000, 5],
  [250000000, 15],
  [500000000, 25],
  [5000000000, 30],
  [Infinity, 35],
];

// ─── Payroll: Biaya Jabatan ───────────────────────────────────────────
export const BIAYA_JABATAN_RATE = new Decimal("0.05");    // 5%
export const BIAYA_JABATAN_MAX = new Decimal("6000000");  // Rp 6,000,000/year
