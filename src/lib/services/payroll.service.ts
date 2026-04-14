/**
 * Payroll Batch Engine
 *
 * Orchestrates BPJS and PPh 21 calculation for all active employees
 * and writes snapshots to PayrollRun / PayrollEntry tables.
 *
 * Design notes:
 *   - All Prisma Decimal values are converted to Decimal.js via .toString() before arithmetic.
 *   - Absence is defined as an AttendanceRecord row where clockIn IS NULL
 *     (admin-created absent records or records without a clock-in).
 *   - BPJS basis = baseSalary + fixed allowances only (not overtime, not non-fixed).
 *   - PPh 21 gross = grossPay + JKK + JKM (employer premiums are taxable income per PMK 168/2023).
 *   - PPh 21 Jan-Nov uses monthly TER; last payroll month (December OR resign) uses annualization.
 *   - Biaya jabatan cap = Rp 500,000 × months worked (dynamic for mid-year resign).
 *   - isTaxBorneByCompany: when true, PPh 21 is calculated and stored normally but NOT deducted
 *     from employee netPay — the company bears the tax cost. grossPayForTax is unaffected.
 *   - Serial processing: one employee at a time (required for annualization DB fetch).
 */

import Decimal from "decimal.js";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { PayrollStatus } from "@/types/enums";
import type { PTKPStatus } from "@/types/enums";
import { calculateBPJS } from "@/lib/services/bpjs.service";
import {
  calculateMonthlyPPh21,
  calculateDecemberPPh21,
} from "@/lib/services/pph21.service";

// ─── Internal Types ───────────────────────────────────────────────────────────

type EmployeeForPayroll = {
  id: string;
  nik: string;
  namaLengkap: string;
  baseSalary: Prisma.Decimal;
  npwp: string | null;
  ptkpStatus: import("@/generated/prisma/client").PTKPStatus | null;
  isTaxBorneByCompany: boolean;
  joinDate: Date;
  terminationDate: Date | null;
  allowances: {
    amount: Prisma.Decimal;
    isFixed: boolean;
  }[];
};

type EntryData = {
  payrollRunId: string;
  employeeId: string;
  employeeNik: string;
  employeeName: string;
  baseSalary: number;
  totalAllowances: number;
  overtimePay: number;
  absenceDeduction: number;
  thrAmount: number;
  grossPay: number;
  bpjsKesEmp: number;
  bpjsKesEmpr: number;
  bpjsJhtEmp: number;
  bpjsJhtEmpr: number;
  bpjsJpEmp: number;
  bpjsJpEmpr: number;
  bpjsJkk: number;
  bpjsJkm: number;
  pph21: number;
  totalDeductions: number;
  netPay: number;
};

// ─── Main Batch Function ──────────────────────────────────────────────────────

/**
 * Run payroll for a given month and year.
 *
 * - Fetches all active employees with salary, allowances, and attendance data.
 * - Calculates BPJS and PPh 21 for each employee.
 * - Creates or overwrites a DRAFT PayrollRun (idempotent).
 * - Returns the PayrollRun with entry count.
 *
 * @throws "Payroll sudah difinalisasi" if the run for this month/year is already FINALIZED.
 */
export async function runPayroll(month: number, year: number) {
  // ── 1. Check for existing run ─────────────────────────────────────────────
  const existingRun = await prisma.payrollRun.findUnique({
    where: { month_year: { month, year } },
    select: { id: true, status: true },
  });

  if (existingRun?.status === PayrollStatus.FINALIZED) {
    throw new Error("Payroll sudah difinalisasi");
  }

  // ── 2. Date range for the given month ────────────────────────────────────
  const startOfMonth = new Date(year, month - 1, 1);
  const startOfNextMonth = new Date(year, month, 1);

  // ── 3. Fetch all active employees + employees who resigned this month ─────
  const employees = await prisma.employee.findMany({
    where: {
      OR: [
        { isActive: true },
        {
          isActive: false,
          terminationDate: { gte: startOfMonth, lt: startOfNextMonth },
        },
      ],
    },
    select: {
      id: true,
      nik: true,
      namaLengkap: true,
      baseSalary: true,
      npwp: true,
      ptkpStatus: true,
      isTaxBorneByCompany: true,
      joinDate: true,
      terminationDate: true,
      allowances: {
        select: {
          amount: true,
          isFixed: true,
        },
      },
    },
  });

  // ── 4. Calculate payroll per employee (serial) ───────────────────────────
  const entryDataArray: EntryData[] = [];

  for (const emp of employees as EmployeeForPayroll[]) {
    // ── 4a. Attendance data for this month ───────────────────────────────
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        employeeId: emp.id,
        date: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
      select: {
        clockIn: true,
        overtimeMinutes: true,
      },
    });

    // Overtime: sum overtimeMinutes from all records with a clock-in
    const totalOvertimeMinutes = attendanceRecords.reduce(
      (sum, r) => sum + r.overtimeMinutes,
      0
    );

    // Absent = record exists but employee has no clock-in (admin-marked absent day)
    const absentCount = attendanceRecords.filter((r) => r.clockIn === null).length;

    // ── 4b. Salary components ────────────────────────────────────────────
    const baseSalary = new Decimal(emp.baseSalary.toString());

    const fixedAllowancesTotal = emp.allowances
      .filter((a) => a.isFixed)
      .reduce((sum, a) => sum.plus(new Decimal(a.amount.toString())), new Decimal(0));

    const totalAllowances = emp.allowances.reduce(
      (sum, a) => sum.plus(new Decimal(a.amount.toString())),
      new Decimal(0)
    );

    // BPJS basis = baseSalary + fixed allowances only
    const bpjsBasis = baseSalary.plus(fixedAllowancesTotal);

    // Overtime pay: minutes × (baseSalary / 173 hours / 60 min)
    // 173 = Indonesian monthly norm hours (UU 13/2003 Article 77)
    const overtimePay =
      totalOvertimeMinutes > 0
        ? new Decimal(totalOvertimeMinutes)
            .mul(baseSalary)
            .dividedBy(173)
            .dividedBy(60)
            .toDecimalPlaces(0)
        : new Decimal(0);

    // Absence deduction: absentDays × (baseSalary / 22)
    const absenceDeduction =
      absentCount > 0
        ? new Decimal(absentCount)
            .mul(baseSalary)
            .dividedBy(22)
            .toDecimalPlaces(0)
        : new Decimal(0);

    // Gross pay = all income sources − absence penalty
    // = baseSalary + all allowances (fixed + non-fixed) + overtime − absence deduction
    const nonFixedAllowancesTotal = totalAllowances.minus(fixedAllowancesTotal);
    const grossPay = bpjsBasis
      .plus(nonFixedAllowancesTotal)
      .plus(overtimePay)
      .minus(absenceDeduction);

    // ── 4c. BPJS calculation ─────────────────────────────────────────────
    const bpjs = calculateBPJS(bpjsBasis);

    // ── 4d. PPh 21 gross includes JKK+JKM employer premiums (PMK 168/2023) ──
    // JKK and JKM are employer-paid but count as taxable income (penghasilan bruto).
    // They do NOT affect net pay — only the PPh 21 calculation basis.
    const grossPayForTax = grossPay.plus(bpjs.jkk).plus(bpjs.jkm);

    // ── 4f. PPh 21 calculation ───────────────────────────────────────────
    const ptkpStatus = (emp.ptkpStatus ?? "TK_0") as PTKPStatus;
    const hasNpwp = !!emp.npwp;

    // Detect if this is the employee's last payroll month (December OR resign month)
    const isResigningThisMonth =
      emp.terminationDate != null &&
      emp.terminationDate >= startOfMonth &&
      emp.terminationDate < startOfNextMonth;

    const isLastPayrollMonth = month === 12 || isResigningThisMonth;

    let pph21: Decimal;

    if (isLastPayrollMonth) {
      // Last payroll month: full annualization true-up (PMK 168/2023)
      // Applies to December AND mid-year resign (masa pajak terakhir)
      const priorEntries = await prisma.payrollEntry.findMany({
        where: {
          employeeId: emp.id,
          payrollRun: {
            year,
            month: { lt: month },
          },
        },
        select: {
          grossPay: true,
          bpjsJhtEmp: true,
          bpjsJpEmp: true,
          bpjsJkk: true,
          bpjsJkm: true,
          pph21: true,
        },
      });

      // Annual gross for tax = prior entries' gross (+ JKK/JKM) + current month
      const annualGross = priorEntries
        .reduce(
          (sum, e) =>
            sum
              .plus(new Decimal(e.grossPay.toString()))
              .plus(new Decimal(e.bpjsJkk.toString()))
              .plus(new Decimal(e.bpjsJkm.toString())),
          new Decimal(0)
        )
        .plus(grossPayForTax);

      // JHT + JP only — BPJS Kesehatan is NOT deductible per PMK 168/2023
      const annualBpjsEmp = priorEntries
        .reduce(
          (sum, e) =>
            sum
              .plus(new Decimal(e.bpjsJhtEmp.toString()))
              .plus(new Decimal(e.bpjsJpEmp.toString())),
          new Decimal(0)
        )
        .plus(bpjs.jhtEmp)
        .plus(bpjs.jpEmp);

      const totalPPh21Prior = priorEntries.reduce(
        (sum, e) => sum.plus(new Decimal(e.pph21.toString())),
        new Decimal(0)
      );

      // Biaya jabatan cap: Rp 500,000 × months worked in this tax year
      // Full year (December) → 12 × 500,000 = Rp 6,000,000 (matches original cap)
      // Mid-year resign → monthsWorked × 500,000 (prorated)
      const taxYearStart = new Date(year, 0, 1);
      const effectiveStart = emp.joinDate > taxYearStart ? emp.joinDate : taxYearStart;
      const effectiveStartMonth = effectiveStart.getMonth() + 1; // 1-based
      const monthsWorked = month - effectiveStartMonth + 1;
      const biayaJabatanMax = new Decimal(500_000).mul(Math.max(monthsWorked, 1));

      const decResult = calculateDecemberPPh21({
        annualGrossIncome: annualGross,
        annualBpjsEmployee: annualBpjsEmp,
        ptkpStatus,
        hasNpwp,
        totalPPh21Prior,
        monthsWorked,
        biayaJabatanMax,
      });

      pph21 = decResult.decemberPPh21;
    } else {
      // January through November: TER monthly method (applied to tax-inclusive gross)
      const monthlyResult = calculateMonthlyPPh21(grossPayForTax, ptkpStatus);
      pph21 = monthlyResult.pph21;
    }

    // ── 4g. Totals ───────────────────────────────────────────────────────
    // When isTaxBorneByCompany is true, the employer pays the PPh 21 on behalf
    // of the employee. The tax amount is still calculated and stored for reporting,
    // but it does NOT reduce the employee's take-home pay.
    // grossPayForTax remains unchanged — PMK 168/2023 basis is the same regardless
    // of who bears the tax cost.
    const pph21EmployeeDeduction = emp.isTaxBorneByCompany
      ? new Decimal(0)
      : pph21;
    const totalDeductions = bpjs.totalEmployeeDeduction.plus(pph21EmployeeDeduction);
    const netPay = grossPay.minus(totalDeductions);

    entryDataArray.push({
      payrollRunId: "", // placeholder; filled after upsert
      employeeId: emp.id,
      employeeNik: emp.nik,
      employeeName: emp.namaLengkap,
      baseSalary: baseSalary.toNumber(),
      totalAllowances: totalAllowances.toNumber(),
      overtimePay: overtimePay.toNumber(),
      absenceDeduction: absenceDeduction.toNumber(),
      thrAmount: 0,
      grossPay: grossPay.toNumber(),
      bpjsKesEmp: bpjs.kesEmp.toNumber(),
      bpjsKesEmpr: bpjs.kesEmpr.toNumber(),
      bpjsJhtEmp: bpjs.jhtEmp.toNumber(),
      bpjsJhtEmpr: bpjs.jhtEmpr.toNumber(),
      bpjsJpEmp: bpjs.jpEmp.toNumber(),
      bpjsJpEmpr: bpjs.jpEmpr.toNumber(),
      bpjsJkk: bpjs.jkk.toNumber(),
      bpjsJkm: bpjs.jkm.toNumber(),
      pph21: pph21.toNumber(),
      totalDeductions: totalDeductions.toNumber(),
      netPay: netPay.toNumber(),
    });
  }

  // ── 5. Upsert PayrollRun as DRAFT ─────────────────────────────────────────
  const payrollRun = await prisma.payrollRun.upsert({
    where: { month_year: { month, year } },
    create: {
      month,
      year,
      status: "DRAFT",
      createdBy: "system",
    },
    update: {
      status: "DRAFT",
      updatedAt: new Date(),
    },
  });

  // ── 6. Delete prior entries if re-running a DRAFT ─────────────────────────
  if (existingRun) {
    await prisma.payrollEntry.deleteMany({
      where: { payrollRunId: payrollRun.id },
    });
  }

  // ── 7. Insert all entries ─────────────────────────────────────────────────
  const finalEntries = entryDataArray.map((entry) => ({
    ...entry,
    payrollRunId: payrollRun.id,
  }));

  if (finalEntries.length > 0) {
    await prisma.payrollEntry.createMany({
      data: finalEntries,
    });
  }

  // ── 8. Return run with entry count ────────────────────────────────────────
  return prisma.payrollRun.findUniqueOrThrow({
    where: { id: payrollRun.id },
    include: {
      _count: {
        select: { entries: true },
      },
    },
  });
}

// ─── Finalize Payroll ─────────────────────────────────────────────────────────

/**
 * Lock a DRAFT PayrollRun to FINALIZED status.
 * Once finalized, subsequent runPayroll calls for the same month/year will throw.
 *
 * @throws "PayrollRun tidak ditemukan" if the run ID does not exist.
 * @throws "Payroll sudah difinalisasi" if already finalized.
 */
export async function finalizePayroll(payrollRunId: string) {
  const run = await prisma.payrollRun.findUnique({
    where: { id: payrollRunId },
    select: { id: true, status: true },
  });

  if (!run) {
    throw new Error("PayrollRun tidak ditemukan");
  }

  if (run.status === PayrollStatus.FINALIZED) {
    throw new Error("Payroll sudah difinalisasi");
  }

  return prisma.payrollRun.update({
    where: { id: payrollRunId },
    data: { status: "FINALIZED" },
  });
}

// ─── Query Helpers ────────────────────────────────────────────────────────────

/**
 * List all PayrollRuns ordered by most recent first, with entry count.
 */
export async function getPayrollRuns() {
  return prisma.payrollRun.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: {
      _count: {
        select: { entries: true },
      },
    },
  });
}

/**
 * Get a single PayrollRun with all PayrollEntries ordered by employee name.
 */
export async function getPayrollRunDetail(payrollRunId: string) {
  return prisma.payrollRun.findUnique({
    where: { id: payrollRunId },
    include: {
      entries: {
        orderBy: { employeeName: "asc" },
      },
      _count: {
        select: { entries: true },
      },
    },
  });
}
