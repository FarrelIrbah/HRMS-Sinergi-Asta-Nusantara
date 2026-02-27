import { z } from "zod";

// ===== DEPARTMENT SCHEMA =====

export const departmentSchema = z.object({
  name: z
    .string()
    .min(2, "Nama departemen minimal 2 karakter")
    .max(100, "Nama departemen maksimal 100 karakter"),
  description: z
    .string()
    .max(500, "Deskripsi maksimal 500 karakter")
    .optional()
    .or(z.literal("")),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;

// ===== POSITION SCHEMA =====

export const positionSchema = z.object({
  name: z
    .string()
    .min(2, "Nama jabatan minimal 2 karakter")
    .max(100, "Nama jabatan maksimal 100 karakter"),
  departmentId: z.string().min(1, "Departemen wajib dipilih"),
});

export type PositionInput = z.infer<typeof positionSchema>;

// ===== OFFICE LOCATION SCHEMA =====

export const officeLocationSchema = z.object({
  name: z.string().min(2, "Nama lokasi minimal 2 karakter"),
  address: z.string().optional().or(z.literal("")),
  allowedIPs: z.array(z.string()).optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  radiusMeters: z
    .number()
    .min(50, "Radius minimal 50 meter")
    .max(10000, "Radius maksimal 10000 meter")
    .optional()
    .nullable(),
});

export type OfficeLocationInput = z.infer<typeof officeLocationSchema>;

// ===== LEAVE TYPE SCHEMA =====

export const leaveTypeSchema = z.object({
  name: z.string().min(2, "Nama jenis cuti minimal 2 karakter"),
  annualQuota: z
    .number()
    .min(0, "Kuota minimal 0")
    .max(365, "Kuota maksimal 365 hari"),
  isPaid: z.boolean(),
  genderRestriction: z
    .enum(["MALE", "FEMALE"])
    .optional()
    .nullable(),
});

export type LeaveTypeInput = z.infer<typeof leaveTypeSchema>;
