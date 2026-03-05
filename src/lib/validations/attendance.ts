import { z } from "zod";

export const clockActionSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type ClockActionInput = z.infer<typeof clockActionSchema>;

export const manualAttendanceSchema = z.object({
  employeeId: z.string().min(1, "Karyawan wajib dipilih"),
  date: z.coerce.date(),
  clockIn: z.string().regex(/^\d{2}:\d{2}$/, "Format jam tidak valid"),
  clockOut: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Format jam tidak valid")
    .optional()
    .or(z.literal("")),
  overrideReason: z.string().min(1, "Alasan wajib diisi"),
});

export type ManualAttendanceInput = z.infer<typeof manualAttendanceSchema>;
