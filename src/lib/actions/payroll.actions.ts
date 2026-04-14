"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  runPayrollSchema,
  finalizePayrollSchema,
  updateEmployeeSalarySchema,
  calculateTHRSchema,
} from "@/lib/validations/payroll";
import {
  runPayroll,
  finalizePayroll,
} from "@/lib/services/payroll.service";
import { calculateMonthlyPPh21 } from "@/lib/services/pph21.service";
import { calculateEmployeeTHR } from "@/lib/services/thr.service";
import { prisma } from "@/lib/prisma";
import Decimal from "decimal.js";
import type { ServiceResult } from "@/types";
import type { PTKPStatus, Religion } from "@/types/enums";

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

// ===== THR ACTION =====

/**
 * Add THR (Tunjangan Hari Raya) amounts to an existing DRAFT PayrollRun.
 *
 * - Finds the DRAFT PayrollRun for the specified month/year.
 * - For each active employee with an entry in that run, calculates THR per
 *   Permenaker 6/2016 using the employee's agama, joinDate, and fixed allowances.
 * - Re-calculates PPh 21 with TER Bulanan on the new grossPayForTax (gaji + THR + JKK + JKM).
 *   This is critical because THR shifts the employee into a higher TER bracket.
 * - Updates thrAmount, grossPay, pph21, totalDeductions, and netPay on each eligible PayrollEntry.
 *
 * @throws if no PayrollRun exists for the month/year, or the run is FINALIZED.
 */
export async function addTHRToPayrollAction(
  input: unknown
): Promise<ServiceResult<null>> {
  const authResult = await requireHRAdmin();
  if (!authResult.success) {
    return { success: false, error: authResult.error };
  }

  const parsed = calculateTHRSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Data tidak valid";
    return { success: false, error: firstError };
  }

  const { month, year } = parsed.data;

  try {
    // Find the DRAFT payroll run for this month/year
    const run = await prisma.payrollRun.findUnique({
      where: { month_year: { month, year } },
      include: {
        entries: { select: { id: true, employeeId: true } },
      },
    });

    if (!run) {
      return {
        success: false,
        error: "Jalankan penggajian untuk bulan ini terlebih dahulu",
      };
    }
    if (run.status === "FINALIZED") {
      return {
        success: false,
        error: "Payroll sudah difinalisasi — THR tidak dapat ditambahkan",
      };
    }

    // Fetch all active employees with fixed allowances, joinDate, agama,
    // and tax-related fields needed for PPh 21 recalculation
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      select: {
        id: true,
        baseSalary: true,
        joinDate: true,
        agama: true,
        ptkpStatus: true,
        npwp: true,
        isTaxBorneByCompany: true,
        allowances: {
          where: { isFixed: true },
          select: { amount: true },
        },
      },
    });

    // Reference date: first day of the payroll run month
    const referenceDate = new Date(year, month - 1, 1);

    for (const emp of employees) {
      // Only process employees who have an entry in this payroll run
      const entry = run.entries.find((e) => e.employeeId === emp.id);
      if (!entry) continue;

      // Skip employees without religion recorded
      if (!emp.agama) continue;

      const baseSalary = new Decimal(emp.baseSalary.toString());
      const fixedAllowancesTotal = emp.allowances.reduce(
        (sum, a) => sum.plus(new Decimal(a.amount.toString())),
        new Decimal(0)
      );

      const thrResult = calculateEmployeeTHR({
        joinDate: emp.joinDate,
        referenceDate,
        baseSalary,
        fixedAllowancesTotal,
        religion: emp.agama as Religion,
      });

      if (!thrResult.isEligible || thrResult.thrAmount.lte(0)) continue;

      // Fetch the full PayrollEntry to recalculate PPh 21 with THR included
      const currentEntry = await prisma.payrollEntry.findUnique({
        where: { id: entry.id },
        select: {
          grossPay: true,
          bpjsKesEmp: true,
          bpjsJhtEmp: true,
          bpjsJpEmp: true,
          bpjsJkk: true,
          bpjsJkm: true,
        },
      });
      if (!currentEntry) continue;

      // ── Recalculate grossPay with THR ──────────────────────────────────
      const prevGrossPay = new Decimal(currentEntry.grossPay.toString());
      const newGrossPay = prevGrossPay.plus(thrResult.thrAmount);

      // ── Recalculate PPh 21 on new grossPayForTax ───────────────────────
      // Per PMK 168/2023: grossPayForTax = grossPay + JKK + JKM (employer premiums)
      // BPJS amounts are unchanged — basis is baseSalary + fixed allowances, not THR
      const jkk = new Decimal(currentEntry.bpjsJkk.toString());
      const jkm = new Decimal(currentEntry.bpjsJkm.toString());
      const newGrossPayForTax = newGrossPay.plus(jkk).plus(jkm);

      const ptkpStatus = (emp.ptkpStatus ?? "TK_0") as PTKPStatus;
      const { pph21: newPph21 } = calculateMonthlyPPh21(newGrossPayForTax, ptkpStatus);

      // ── Recalculate totalDeductions and netPay ─────────────────────────
      // BPJS employee deductions are unchanged (basis doesn't include THR)
      const bpjsEmployeeTotal = new Decimal(currentEntry.bpjsKesEmp.toString())
        .plus(new Decimal(currentEntry.bpjsJhtEmp.toString()))
        .plus(new Decimal(currentEntry.bpjsJpEmp.toString()));

      // When isTaxBorneByCompany is true, PPh 21 is not deducted from employee
      const pph21EmployeeDeduction = emp.isTaxBorneByCompany
        ? new Decimal(0)
        : newPph21;

      const newTotalDeductions = bpjsEmployeeTotal.plus(pph21EmployeeDeduction);
      const newNetPay = newGrossPay.minus(newTotalDeductions);

      await prisma.payrollEntry.update({
        where: { id: entry.id },
        data: {
          thrAmount: thrResult.thrAmount.toNumber(),
          grossPay: newGrossPay.toNumber(),
          pph21: newPph21.toNumber(),
          totalDeductions: newTotalDeductions.toNumber(),
          netPay: newNetPay.toNumber(),
        },
      });
    }

    revalidatePath("/payroll");
    revalidatePath("/payroll/thr");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return { success: false, error: message };
  }
}
