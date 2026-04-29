/**
 * Payroll Service
 *
 * - Persists imported PayrollEntry rows from an Excel/CSV upload.
 * - Provides query helpers for /payroll list and detail pages.
 * - Finalize transitions a DRAFT run to FINALIZED (immutable).
 *
 * NOTE: All numeric calculation is done EXTERNALLY by HR in their spreadsheet.
 * This service only persists what was uploaded.
 */
import { prisma } from "@/lib/prisma";
import { PayrollStatus } from "@/types/enums";
import type { ParsedPayrollRow } from "@/lib/services/payroll-import.service";

// ─── Import / Persist ─────────────────────────────────────────────────────────

export interface MatchedRow extends ParsedPayrollRow {
  employeeId: string;
}

export interface UnmatchedNikError {
  rowNumber: number;
  nik: string;
  message: string;
}

/**
 * Match each parsed row's NIK to an active Employee. Rows whose NIK does not
 * resolve (or whose employee is inactive) become errors.
 */
export async function matchRowsToEmployees(rows: ParsedPayrollRow[]): Promise<{
  matched: MatchedRow[];
  errors: UnmatchedNikError[];
}> {
  const niks = Array.from(new Set(rows.map((r) => r.nik)));
  if (niks.length === 0) return { matched: [], errors: [] };

  const employees = await prisma.employee.findMany({
    where: { nik: { in: niks } },
    select: { id: true, nik: true, isActive: true, namaLengkap: true },
  });

  const byNik = new Map(employees.map((e) => [e.nik, e]));
  const matched: MatchedRow[] = [];
  const errors: UnmatchedNikError[] = [];

  for (const row of rows) {
    const emp = byNik.get(row.nik);
    if (!emp) {
      errors.push({
        rowNumber: row.rowNumber,
        nik: row.nik,
        message: `NIK "${row.nik}" tidak ditemukan di sistem.`,
      });
      continue;
    }
    if (!emp.isActive) {
      errors.push({
        rowNumber: row.rowNumber,
        nik: row.nik,
        message: `NIK "${row.nik}" (${emp.namaLengkap}) sudah tidak aktif.`,
      });
      continue;
    }
    matched.push({ ...row, employeeId: emp.id });
  }

  return { matched, errors };
}

/**
 * Upsert a DRAFT PayrollRun for the given month/year and persist matched entries.
 * If the run is already FINALIZED, throw — finalized runs are immutable.
 * If a DRAFT run exists, its entries are replaced (re-import overrides previous draft).
 */
export async function persistImportedPayroll(params: {
  month: number;
  year: number;
  rows: MatchedRow[];
  createdBy: string;
}) {
  const { month, year, rows, createdBy } = params;

  const existingRun = await prisma.payrollRun.findUnique({
    where: { month_year: { month, year } },
    select: { id: true, status: true },
  });

  if (existingRun?.status === PayrollStatus.FINALIZED) {
    throw new Error("Payroll periode ini sudah difinalisasi dan tidak dapat diubah");
  }

  const run = await prisma.payrollRun.upsert({
    where: { month_year: { month, year } },
    create: { month, year, status: "DRAFT", createdBy },
    update: { status: "DRAFT", updatedAt: new Date() },
  });

  if (existingRun) {
    await prisma.payrollEntry.deleteMany({
      where: { payrollRunId: run.id },
    });
  }

  if (rows.length > 0) {
    await prisma.payrollEntry.createMany({
      data: rows.map((r) => ({
        payrollRunId: run.id,
        employeeId: r.employeeId,
        employeeNik: r.nik,
        employeeName: r.employeeName,
        jobPosition: r.jobPosition,
        organization: r.organization,
        gradeLevel: r.gradeLevel,
        ptkpStatus: r.ptkpStatus,
        npwp: r.npwp,
        basicSalary: r.basicSalary,
        tunjanganKomunikasi: r.tunjanganKomunikasi,
        tunjanganKehadiran: r.tunjanganKehadiran,
        tunjanganJabatan: r.tunjanganJabatan,
        tunjanganLainnya: r.tunjanganLainnya,
        taxAllowance: r.taxAllowance,
        thr: r.thr,
        totalEarnings: r.totalEarnings,
        bpjsKesehatanEmployee: r.bpjsKesehatanEmployee,
        jhtEmployee: r.jhtEmployee,
        jaminanPensiunEmployee: r.jaminanPensiunEmployee,
        pph21: r.pph21,
        potonganKeterlambatan: r.potonganKeterlambatan,
        potonganKoperasi: r.potonganKoperasi,
        potonganLainnya: r.potonganLainnya,
        totalDeductions: r.totalDeductions,
        takeHomePay: r.takeHomePay,
        jkk: r.jkk,
        jkm: r.jkm,
        jhtCompany: r.jhtCompany,
        jaminanPensiunCompany: r.jaminanPensiunCompany,
        bpjsKesehatanCompany: r.bpjsKesehatanCompany,
        totalBenefits: r.totalBenefits,
        actualWorkingDay: r.actualWorkingDay,
        scheduleWorkingDay: r.scheduleWorkingDay,
        dayoff: r.dayoff,
        nationalHoliday: r.nationalHoliday,
        companyHoliday: r.companyHoliday,
        specialHoliday: r.specialHoliday,
        attendanceCodes: r.attendanceCodes,
      })),
    });
  }

  return prisma.payrollRun.findUniqueOrThrow({
    where: { id: run.id },
    include: { _count: { select: { entries: true } } },
  });
}

// ─── Finalize ─────────────────────────────────────────────────────────────────

export async function finalizePayroll(payrollRunId: string) {
  const run = await prisma.payrollRun.findUnique({
    where: { id: payrollRunId },
    select: { id: true, status: true },
  });

  if (!run) throw new Error("PayrollRun tidak ditemukan");
  if (run.status === PayrollStatus.FINALIZED) {
    throw new Error("Payroll sudah difinalisasi");
  }

  return prisma.payrollRun.update({
    where: { id: payrollRunId },
    data: { status: "FINALIZED" },
  });
}

// ─── Query Helpers ────────────────────────────────────────────────────────────

export async function getPayrollRuns() {
  return prisma.payrollRun.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: { _count: { select: { entries: true } } },
  });
}

export async function getPayrollRunDetail(payrollRunId: string) {
  return prisma.payrollRun.findUnique({
    where: { id: payrollRunId },
    include: {
      entries: { orderBy: { employeeName: "asc" } },
      _count: { select: { entries: true } },
    },
  });
}
