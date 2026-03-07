/**
 * BPJS Calculation Service
 *
 * Pure calculation module — no database calls, no side effects.
 * All monetary values use Decimal.js for exact arithmetic.
 *
 * Rates are sourced from constants.ts which reflects official 2025/2026 regulations:
 *   - BPJS Kesehatan: Perpres 64/2020 (cap effective 2021)
 *   - JHT/JP/JKK/JKM: PP 44/2015 & Permenaker 15/2022
 *   - JP cap Rp 10,547,400: effective March 2025
 *
 * ─── Reference Verification ────────────────────────────────────────────────
 *
 * Test 1 — grossSalary = Rp 10,000,000 (below all caps)
 *   kesEmp  = 10,000,000 × 1%   = 100,000   ✓
 *   jhtEmp  = 10,000,000 × 2%   = 200,000   ✓
 *   jpEmp   = 10,000,000 × 1%   = 100,000   ✓ (below JP cap 10,547,400)
 *   kesEmpr = 10,000,000 × 4%   = 400,000   ✓
 *   jhtEmpr = 10,000,000 × 3.7% = 370,000   ✓
 *   jpEmpr  = 10,000,000 × 2%   = 200,000   ✓
 *   jkk     = 10,000,000 × 0.24% =  24,000   ✓
 *   jkm     = 10,000,000 × 0.3%  =  30,000   ✓
 *   totalEmployeeDeduction = 100,000 + 200,000 + 100,000 = 400,000   ✓
 *   totalEmployerCost = 400,000 + 370,000 + 200,000 + 24,000 + 30,000 = 1,024,000   ✓
 *
 * Test 2 — grossSalary = Rp 15,000,000 (above Kesehatan cap 12,000,000 and JP cap 10,547,400)
 *   BPJS Kesehatan basis = 12,000,000 (capped at KESEHATAN_CAP)
 *   JP basis             = 10,547,400 (capped at JP_CAP)
 *   kesEmp  = 12,000,000 × 1%   = 120,000   ✓
 *   jpEmp   = 10,547,400 × 1%   = 105,474   ✓
 *   jhtEmp  = 15,000,000 × 2%   = 300,000   ✓ (JHT has no cap)
 *   kesEmpr = 12,000,000 × 4%   = 480,000   ✓
 *   jhtEmpr = 15,000,000 × 3.7% = 555,000   ✓
 *   jpEmpr  = 10,547,400 × 2%   = 210,948   ✓
 *   jkk     = 15,000,000 × 0.24% =  36,000   ✓
 *   jkm     = 15,000,000 × 0.3%  =  45,000   ✓
 */

import Decimal from "decimal.js";
import { BPJS_RATES } from "@/lib/constants";

// ─── Result Type ──────────────────────────────────────────────────────────────

export interface BPJSResult {
  // Employee deductions (reduce net pay)
  kesEmp: Decimal; // BPJS Kesehatan employee 1%
  jhtEmp: Decimal; // JHT employee 2%
  jpEmp: Decimal; // JP employee 1% (capped at JP_CAP)
  // Employer contributions (cost to company, shown on payslip for transparency)
  kesEmpr: Decimal; // BPJS Kesehatan employer 4%
  jhtEmpr: Decimal; // JHT employer 3.7%
  jpEmpr: Decimal; // JP employer 2% (capped at JP_CAP)
  jkk: Decimal; // JKK employer 0.24%
  jkm: Decimal; // JKM employer 0.3%
  // Totals
  totalEmployeeDeduction: Decimal; // kesEmp + jhtEmp + jpEmp
  totalEmployerCost: Decimal; // kesEmpr + jhtEmpr + jpEmpr + jkk + jkm
}

// ─── Primary Function ─────────────────────────────────────────────────────────

/**
 * Calculate all BPJS components for a given salary basis.
 *
 * @param grossSalary - BPJS calculation basis: baseSalary + fixed allowances only.
 *                      Per regulation: overtime, THR, and non-fixed allowances are
 *                      excluded from BPJS basis. Do NOT pass total gross pay.
 *
 * @returns BPJSResult with all components rounded to the nearest rupiah (0 decimal places).
 */
export function calculateBPJS(grossSalary: Decimal): BPJSResult {
  // ── BPJS Kesehatan — capped at Rp 12,000,000 ──────────────────────────────
  const kesBasis = Decimal.min(grossSalary, BPJS_RATES.KESEHATAN_CAP);
  const kesEmp = kesBasis.mul(BPJS_RATES.KESEHATAN_EMPLOYEE).toDecimalPlaces(0);
  const kesEmpr = kesBasis.mul(BPJS_RATES.KESEHATAN_EMPLOYER).toDecimalPlaces(0);

  // ── JHT — no cap ──────────────────────────────────────────────────────────
  const jhtEmp = grossSalary.mul(BPJS_RATES.JHT_EMPLOYEE).toDecimalPlaces(0);
  const jhtEmpr = grossSalary.mul(BPJS_RATES.JHT_EMPLOYER).toDecimalPlaces(0);

  // ── JP — capped at Rp 10,547,400 (effective March 2025) ───────────────────
  const jpBasis = Decimal.min(grossSalary, BPJS_RATES.JP_CAP);
  const jpEmp = jpBasis.mul(BPJS_RATES.JP_EMPLOYEE).toDecimalPlaces(0);
  const jpEmpr = jpBasis.mul(BPJS_RATES.JP_EMPLOYER).toDecimalPlaces(0);

  // ── JKK and JKM — employer only, no cap ───────────────────────────────────
  const jkk = grossSalary.mul(BPJS_RATES.JKK_EMPLOYER).toDecimalPlaces(0);
  const jkm = grossSalary.mul(BPJS_RATES.JKM_EMPLOYER).toDecimalPlaces(0);

  // ── Totals ─────────────────────────────────────────────────────────────────
  const totalEmployeeDeduction = kesEmp.plus(jhtEmp).plus(jpEmp);
  const totalEmployerCost = kesEmpr
    .plus(jhtEmpr)
    .plus(jpEmpr)
    .plus(jkk)
    .plus(jkm);

  return {
    kesEmp,
    jhtEmp,
    jpEmp,
    kesEmpr,
    jhtEmpr,
    jpEmpr,
    jkk,
    jkm,
    totalEmployeeDeduction,
    totalEmployerCost,
  };
}
