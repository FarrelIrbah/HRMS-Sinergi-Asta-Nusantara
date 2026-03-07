"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  runPayrollSchema,
  finalizePayrollSchema,
  updateEmployeeSalarySchema,
} from "@/lib/validations/payroll";
import {
  runPayroll,
  finalizePayroll,
} from "@/lib/services/payroll.service";
import { prisma } from "@/lib/prisma";
import type { ServiceResult } from "@/types";

// ===== AUTH HELPER =====

async function requireHRAdmin(): Promise<ServiceResult<{ userId: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Sesi tidak valid" };
  }
  if (session.user.role !== "HR_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return { success: false, error: "Akses ditolak" };
  }
  return { success: true, data: { userId: session.user.id } };
}

// ===== PAYROLL ACTIONS =====

export async function runPayrollAction(
  input: unknown
): Promise<ServiceResult<{ payrollRunId: string; entryCount: number }>> {
  const authResult = await requireHRAdmin();
  if (!authResult.success) {
    return { success: false, error: authResult.error };
  }

  const parsed = runPayrollSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Data tidak valid";
    return { success: false, error: firstError };
  }

  try {
    const result = await runPayroll(parsed.data.month, parsed.data.year);
    revalidatePath("/payroll");
    return {
      success: true,
      data: {
        payrollRunId: result.id,
        entryCount: result._count?.entries ?? 0,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return { success: false, error: message };
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
    const firstError = parsed.error.issues[0]?.message ?? "Data tidak valid";
    return { success: false, error: firstError };
  }

  try {
    await finalizePayroll(parsed.data.payrollRunId);
    revalidatePath("/payroll");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return { success: false, error: message };
  }
}

export async function updateEmployeeSalaryAction(
  input: unknown
): Promise<ServiceResult<null>> {
  const authResult = await requireHRAdmin();
  if (!authResult.success) {
    return { success: false, error: authResult.error };
  }

  const parsed = updateEmployeeSalarySchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Data tidak valid";
    return { success: false, error: firstError };
  }

  const { employeeId, baseSalary, allowances } = parsed.data;

  try {
    await prisma.employee.update({
      where: { id: employeeId },
      data: { baseSalary },
    });

    if (allowances !== undefined) {
      await prisma.employeeAllowance.deleteMany({ where: { employeeId } });

      if (allowances.length > 0) {
        await prisma.employeeAllowance.createMany({
          data: allowances.map((a) => ({
            employeeId,
            name: a.name,
            amount: a.amount,
            isFixed: a.isFixed,
          })),
        });
      }
    }

    revalidatePath(`/employees/${employeeId}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return { success: false, error: message };
  }
}
