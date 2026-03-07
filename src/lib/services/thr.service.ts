/**
 * THR (Tunjangan Hari Raya) Calculation Service
 *
 * Pure function module — no database calls.
 * Implements Permenaker No. 6/2016 THR rules.
 *
 * Rules:
 *   - Basis: gaji pokok + tunjangan tetap (isFixed=true allowances only)
 *   - >= 12 months service: 1× (baseSalary + fixedAllowancesTotal)
 *   - 1–11 months service: (serviceMonths / 12) × 1 bulan gaji
 *   - < 1 month service: tidak berhak (amount = 0)
 *
 * Reference values (for manual verification):
 *   - joinDate 2 years ago, baseSalary 5,000,000, no allowances → THR = 5,000,000
 *   - 6 months service, baseSalary 4,000,000 → THR = (6/12) × 4,000,000 = 2,000,000
 *   - 0 months service → isEligible = false, thrAmount = 0
 */

import Decimal from "decimal.js";
import { differenceInMonths } from "date-fns";
import type { Religion } from "@/types/enums";

// ─── Holiday Mapping ──────────────────────────────────────────────────────────

/**
 * Maps each Religion to the corresponding Indonesian national holiday
 * for THR payment timing per Permenaker 6/2016.
 */
export const RELIGION_HOLIDAY_MAP: Record<Religion, string> = {
  ISLAM: "Idul Fitri",
  KRISTEN: "Natal",
  KATOLIK: "Natal",
  HINDU: "Nyepi",
  BUDDHA: "Waisak",
  KONGHUCU: "Tahun Baru Imlek",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface THRInput {
  joinDate: Date;
  /** The payroll run reference date (used for service length calculation). */
  referenceDate: Date;
  baseSalary: Decimal;
  /** Sum of isFixed=true allowances only (Permenaker 6/2016 basis). */
  fixedAllowancesTotal: Decimal;
  religion: Religion;
}

export interface THRResult {
  serviceMonths: number;
  isEligible: boolean;
  thrAmount: Decimal;
  holidayName: string;
  calculationNote: string;
}

// ─── Calculation Function ─────────────────────────────────────────────────────

/**
 * Calculate THR for a single employee per Permenaker No. 6/2016.
 *
 * Service months uses differenceInMonths(referenceDate, joinDate) which returns
 * the floor of complete calendar months elapsed.
 */
export function calculateEmployeeTHR(input: THRInput): THRResult {
  const { joinDate, referenceDate, baseSalary, fixedAllowancesTotal, religion } = input;

  const monthlySalary = baseSalary.plus(fixedAllowancesTotal);
  const serviceMonths = differenceInMonths(referenceDate, joinDate);
  const holidayName = RELIGION_HOLIDAY_MAP[religion];

  // < 1 month: tidak berhak
  if (serviceMonths < 1) {
    return {
      serviceMonths,
      isEligible: false,
      thrAmount: new Decimal(0),
      holidayName,
      calculationNote: "Masa kerja < 1 bulan — tidak berhak THR",
    };
  }

  // >= 12 months: 1× bulan gaji
  if (serviceMonths >= 12) {
    const thrAmount = monthlySalary.toDecimalPlaces(0);
    return {
      serviceMonths,
      isEligible: true,
      thrAmount,
      holidayName,
      calculationNote: `Masa kerja ${serviceMonths} bulan (≥ 12) — 1× gaji: ${thrAmount.toFixed(0)}`,
    };
  }

  // 1–11 months: prorated (serviceMonths / 12) × monthlySalary
  const thrAmount = monthlySalary
    .mul(serviceMonths)
    .dividedBy(12)
    .toDecimalPlaces(0);

  return {
    serviceMonths,
    isEligible: true,
    thrAmount,
    holidayName,
    calculationNote: `Masa kerja ${serviceMonths} bulan — ${serviceMonths}/12 × gaji: ${thrAmount.toFixed(0)}`,
  };
}
