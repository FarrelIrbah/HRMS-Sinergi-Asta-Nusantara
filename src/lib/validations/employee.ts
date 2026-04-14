import { z } from "zod";
import {
  Gender,
  Religion,
  MaritalStatus,
  ContractType,
  PTKPStatus,
} from "@/types/enums";

// ─── Create Employee Schema ───────────────────────────────────────────

export const createEmployeeSchema = z.object({
  namaLengkap: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  email: z.string().email("Email tidak valid"),
  initialPassword: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[A-Z]/, "Harus mengandung huruf besar")
    .regex(/[a-z]/, "Harus mengandung huruf kecil")
    .regex(/[0-9]/, "Harus mengandung angka"),
  departmentId: z.string().min(1, "Departemen wajib dipilih"),
  positionId: z.string().min(1, "Jabatan wajib dipilih"),
  contractType: z.nativeEnum(ContractType, {
    error: "Tipe kontrak tidak valid",
  }),
  joinDate: z.coerce.date(),
  // Optional fields
  nikKtp: z
    .string()
    .length(16, "NIK KTP harus 16 digit")
    .optional()
    .or(z.literal("")),
  tempatLahir: z.string().optional().or(z.literal("")),
  tanggalLahir: z.coerce.date().optional().or(z.literal("")),
  jenisKelamin: z.nativeEnum(Gender).optional(),
  statusPernikahan: z.nativeEnum(MaritalStatus).optional(),
  agama: z.nativeEnum(Religion).optional(),
  alamat: z.string().optional().or(z.literal("")),
  nomorHp: z.string().optional().or(z.literal("")),
  npwp: z.string().optional().or(z.literal("")),
  ptkpStatus: z.nativeEnum(PTKPStatus).optional(),
  bpjsKesehatanNo: z.string().optional().or(z.literal("")),
  bpjsKetenagakerjaanNo: z.string().optional().or(z.literal("")),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

// ─── Update Personal Info Schema ──────────────────────────────────────

export const updatePersonalInfoSchema = z.object({
  namaLengkap: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  nikKtp: z
    .string()
    .length(16, "NIK KTP harus 16 digit")
    .optional()
    .or(z.literal("")),
  tempatLahir: z.string().optional().or(z.literal("")),
  tanggalLahir: z.coerce.date().optional().or(z.literal("")),
  jenisKelamin: z.nativeEnum(Gender).optional(),
  statusPernikahan: z.nativeEnum(MaritalStatus).optional(),
  agama: z.nativeEnum(Religion).optional(),
  alamat: z.string().optional().or(z.literal("")),
  nomorHp: z.string().optional().or(z.literal("")),
});

export type UpdatePersonalInfoInput = z.infer<
  typeof updatePersonalInfoSchema
>;

// ─── Update Employment Schema ─────────────────────────────────────────

export const updateEmploymentSchema = z.object({
  departmentId: z.string().min(1, "Departemen wajib dipilih"),
  positionId: z.string().min(1, "Jabatan wajib dipilih"),
  contractType: z.nativeEnum(ContractType, {
    error: "Tipe kontrak tidak valid",
  }),
  joinDate: z.coerce.date(),
  officeLocationId: z.string().optional().or(z.literal("")),
});

export type UpdateEmploymentInput = z.infer<typeof updateEmploymentSchema>;

// ─── Update Tax & BPJS Schema ─────────────────────────────────────────

export const updateTaxBpjsSchema = z.object({
  npwp: z.string().optional().or(z.literal("")),
  ptkpStatus: z.nativeEnum(PTKPStatus).optional(),
  bpjsKesehatanNo: z.string().optional().or(z.literal("")),
  bpjsKetenagakerjaanNo: z.string().optional().or(z.literal("")),
  isTaxBorneByCompany: z.boolean().optional(),
});

export type UpdateTaxBpjsInput = z.infer<typeof updateTaxBpjsSchema>;

// ─── Emergency Contact Schema ─────────────────────────────────────────

export const emergencyContactSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  relationship: z.string().min(1, "Hubungan wajib diisi"),
  phone: z.string().min(1, "Nomor telepon wajib diisi"),
  address: z.string().optional().or(z.literal("")),
});

export type EmergencyContactInput = z.infer<typeof emergencyContactSchema>;

// ─── Deactivate Employee Schema ───────────────────────────────────────

export const deactivateEmployeeSchema = z.object({
  terminationDate: z.coerce.date(),
  terminationReason: z.string().min(1, "Alasan wajib diisi"),
});

export type DeactivateEmployeeInput = z.infer<
  typeof deactivateEmployeeSchema
>;
