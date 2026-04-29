"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  importPayrollSchema,
  finalizePayrollSchema,
} from "@/lib/validations/payroll";
import {
  matchRowsToEmployees,
  persistImportedPayroll,
  finalizePayroll,
} from "@/lib/services/payroll.service";
import {
  parsePayrollWorkbook,
  type PayrollImportError,
} from "@/lib/services/payroll-import.service";
import type { ServiceResult } from "@/types";

async function requireHRAdmin(): Promise<ServiceResult<{ userId: string }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Sesi tidak valid" };
  if (session.user.role !== "HR_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return { success: false, error: "Akses ditolak" };
  }
  return { success: true, data: { userId: session.user.id } };
}

export interface ImportPayrollResult {
  payrollRunId: string;
  entryCount: number;
  warnings: PayrollImportError[];
}

export async function importPayrollAction(
  formData: FormData
): Promise<ServiceResult<ImportPayrollResult>> {
  const authResult = await requireHRAdmin();
  if (!authResult.success) {
    return { success: false, error: authResult.error };
  }

  const monthRaw = formData.get("month");
  const yearRaw = formData.get("year");
  const file = formData.get("file");

  const parsed = importPayrollSchema.safeParse({
    month: monthRaw,
    year: yearRaw,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Periode tidak valid",
    };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "File belum dipilih" };
  }

  const allowedExtensions = [".xlsx", ".xls", ".csv"];
  const lowerName = file.name.toLowerCase();
  if (!allowedExtensions.some((ext) => lowerName.endsWith(ext))) {
    return {
      success: false,
      error: "Format file harus .xlsx, .xls, atau .csv",
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // 1. Structural parse
  const { rows, errors } = parsePayrollWorkbook(buffer);
  if (errors.length > 0) {
    const summary = errors
      .slice(0, 5)
      .map((e) => {
        const loc = e.rowNumber === null ? "File" : `Baris ${e.rowNumber}`;
        return `${loc}${e.column ? ` (${e.column})` : ""}: ${e.message}`;
      })
      .join(" | ");
    const more = errors.length > 5 ? ` (+${errors.length - 5} lagi)` : "";
    return { success: false, error: `Validasi gagal: ${summary}${more}` };
  }

  // 2. Match NIK → Employee
  const { matched, errors: matchErrors } = await matchRowsToEmployees(rows);
  if (matchErrors.length > 0) {
    const summary = matchErrors
      .slice(0, 5)
      .map((e) => `Baris ${e.rowNumber}: ${e.message}`)
      .join(" | ");
    const more = matchErrors.length > 5 ? ` (+${matchErrors.length - 5} lagi)` : "";
    return { success: false, error: `NIK tidak valid: ${summary}${more}` };
  }

  // 3. Persist as DRAFT
  try {
    const result = await persistImportedPayroll({
      month: parsed.data.month,
      year: parsed.data.year,
      rows: matched,
      createdBy: authResult.data?.userId ?? "system",
    });

    revalidatePath("/payroll");
    revalidatePath(`/payroll/${result.id}`);

    return {
      success: true,
      data: {
        payrollRunId: result.id,
        entryCount: result._count?.entries ?? matched.length,
        warnings: [],
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Terjadi kesalahan",
    };
  }
}

export async function finalizePayrollAction(
  input: unknown
): Promise<ServiceResult<null>> {
  const authResult = await requireHRAdmin();
  if (!authResult.success) {
    return { success: false, error: authResult.error };
  }

  const parsed = finalizePayrollSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data tidak valid",
    };
  }

  try {
    await finalizePayroll(parsed.data.payrollRunId);
    revalidatePath("/payroll");
    revalidatePath(`/payroll/${parsed.data.payrollRunId}`);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Terjadi kesalahan",
    };
  }
}
