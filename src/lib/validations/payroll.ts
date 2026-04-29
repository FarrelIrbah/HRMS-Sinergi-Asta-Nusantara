import { z } from "zod";

export const importPayrollSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2024).max(2099),
});
export type ImportPayrollInput = z.infer<typeof importPayrollSchema>;

export const finalizePayrollSchema = z.object({
  payrollRunId: z.string().min(1),
});
export type FinalizePayrollInput = z.infer<typeof finalizePayrollSchema>;
