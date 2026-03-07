import { z } from "zod";

export const runPayrollSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024).max(2099),
});
export type RunPayrollInput = z.infer<typeof runPayrollSchema>;

export const finalizePayrollSchema = z.object({
  payrollRunId: z.string().min(1),
});
export type FinalizePayrollInput = z.infer<typeof finalizePayrollSchema>;

export const calculateTHRSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024).max(2099),
});
export type CalculateTHRInput = z.infer<typeof calculateTHRSchema>;

export const updateEmployeeSalarySchema = z.object({
  employeeId: z.string().min(1),
  baseSalary: z.number().min(0),
  allowances: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1, "Nama tunjangan wajib diisi"),
        amount: z.number().min(0),
        isFixed: z.boolean().default(true),
      })
    )
    .optional(),
});
export type UpdateEmployeeSalaryInput = z.infer<typeof updateEmployeeSalarySchema>;
