/**
 * PPh 21 Calculation Service
 *
 * Pure calculation module — no database calls, no side effects.
 * All monetary values use Decimal.js for exact arithmetic.
 *
 * Implements:
 *   1. Monthly TER (Tarif Efektif Rata-Rata) withholding — January to November.
 *   2. December annualization true-up using Article 17(1)(a) progressive brackets.
 *
 * Regulatory basis:
 *   - PP 58/2023 (TER rate tables — Lampiran A, B, C)
 *   - PMK 168/2023 (TER implementation rules, December annualization method)
 *   - UU HPP No.7/2021 Article 17 (progressive brackets)
 *   - PMK 101/2016 (PTKP annual values)
 *
 * ─── Reference Verification ────────────────────────────────────────────────
 *
 * Test 1 — TER lookup: Category A, grossMonthly = Rp 8,000,000
 *   Bracket: TER_TABLE_A row [8550000, 1.5] — range (7,500,000 – 8,550,000]
 *   terRate = 1.5%
 *   pph21   = 8,000,000 × 1.5% = 120,000   ✓
 *
 * Test 2 — December annualization: TK/0, NPWP holder
 *   annualGross        = Rp 120,000,000
 *   biayaJabatan       = min(120,000,000 × 5%, 6,000,000) = 6,000,000   ✓
 *   annualBpjsEmployee = 12 × (200,000 + 100,000) = 3,600,000
 *     (jhtEmp 2% + jpEmp 1% on baseSalary Rp 10,000,000)
 *   netIncome          = 120,000,000 - 6,000,000 - 3,600,000 = 110,400,000   ✓
 *   PTKP TK/0          = 54,000,000
 *   PKP raw            = 110,400,000 - 54,000,000 = 56,400,000
 *   PKP rounded        = 56,400,000 (already multiple of 1,000)   ✓
 *   Annual tax         = 56,400,000 × 5% = 2,820,000 (all within 1st bracket ≤ 60M)   ✓
 *   NPWP → no 20% penalty
 *   totalPPh21JanNov   = 11 × 100,000 = 1,100,000
 *   decemberPPh21      = 2,820,000 - 1,100,000 = 1,720,000   ✓
 */

import Decimal from "decimal.js";
import {
  TER_TABLE_A,
  TER_TABLE_B,
  TER_TABLE_C,
  PTKP_ANNUAL,
  TER_CATEGORY,
  PPH21_PROGRESSIVE_BRACKETS,
  BIAYA_JABATAN_RATE,
  BIAYA_JABATAN_MAX,
} from "@/lib/constants";
import { PTKPStatus } from "@/types/enums";

// ─── TER Monthly Lookup ───────────────────────────────────────────────────────

/**
 * Return the TER category (A, B, or C) for a given PTKP status.
 * Mapping per PP 58/2023 Lampiran: TK/0, TK/1, K/0 → A; TK/2, TK/3, K/1, K/2 → B; K/3 → C.
 */
export function getTERCategory(ptkpStatus: PTKPStatus): "A" | "B" | "C" {
  return TER_CATEGORY[ptkpStatus];
}

/**
 * Find the TER rate for a gross monthly income and TER category.
 *
 * The tables are sorted ascending by upperLimit. For each row [upperLimit, rate],
 * the rate applies when grossMonthly <= upperLimit. The last row has upperLimit
 * Infinity, so all values are covered.
 *
 * @returns Rate as a percentage (e.g., 1.5 means 1.5%).
 */
function getTERRate(grossMonthly: Decimal, category: "A" | "B" | "C"): Decimal {
  const table =
    category === "A" ? TER_TABLE_A : category === "B" ? TER_TABLE_B : TER_TABLE_C;
  const gross = grossMonthly.toNumber();
  for (const [upperLimit, rate] of table) {
    if (gross <= upperLimit) return new Decimal(rate);
  }
  // Safety fallback — should never reach here because last row is Infinity
  return new Decimal(table[table.length - 1][1]);
}

// ─── Monthly PPh 21 (TER Method) ─────────────────────────────────────────────

export interface PPh21MonthlyResult {
  terCategory: "A" | "B" | "C";
  terRate: Decimal; // percentage, e.g. 1.5 means 1.5%
  pph21: Decimal; // amount withheld (rounded to nearest rupiah)
}

/**
 * Calculate monthly PPh 21 using the TER method (January through November).
 *
 * Formula: pph21 = grossMonthly × terRate / 100
 *
 * @param grossMonthly - Full gross pay for the month: baseSalary + all allowances
 *                       + overtime + THR/bonus if paid that month. TER applies to
 *                       total income received in the period per PMK 168/2023 §3.
 * @param ptkpStatus   - Employee's PTKP status (determines TER category A/B/C).
 *
 * @returns PPh21MonthlyResult with category, rate, and withheld amount.
 */
export function calculateMonthlyPPh21(
  grossMonthly: Decimal,
  ptkpStatus: PTKPStatus
): PPh21MonthlyResult {
  const terCategory = getTERCategory(ptkpStatus);
  const terRate = getTERRate(grossMonthly, terCategory);
  const pph21 = grossMonthly.mul(terRate).dividedBy(100).toDecimalPlaces(0);
  return { terCategory, terRate, pph21 };
}

// ─── December Annualization True-Up ──────────────────────────────────────────

/**
 * Calculate annual progressive tax using Article 17(1)(a) brackets.
 *
 * Brackets (from PPH21_PROGRESSIVE_BRACKETS):
 *   0 – 60,000,000         → 5%
 *   60,000,001 – 250,000,000    → 15%
 *   250,000,001 – 500,000,000   → 25%
 *   500,000,001 – 5,000,000,000 → 30%
 *   > 5,000,000,000             → 35%
 *
 * @param pkp - Penghasilan Kena Pajak (taxable income after PTKP, rounded to 1,000)
 * @returns Total annual tax, rounded to nearest rupiah.
 */
function calculateProgressiveTax(pkp: Decimal): Decimal {
  let tax = new Decimal(0);
  let remaining = pkp;
  let prevUpper = new Decimal(0);

  for (const [upperLimit, rate] of PPH21_PROGRESSIVE_BRACKETS) {
    if (remaining.lte(0)) break;
    const bracketTop = new Decimal(
      upperLimit === Infinity ? 999_999_999_999 : upperLimit
    );
    const bracketSize = bracketTop.minus(prevUpper);
    const taxable = Decimal.min(remaining, bracketSize);
    tax = tax.plus(taxable.mul(rate).dividedBy(100));
    remaining = remaining.minus(taxable);
    prevUpper = bracketTop;
    if (upperLimit === Infinity) break;
  }

  return tax.toDecimalPlaces(0);
}

export interface DecemberPPh21Result {
  annualGross: Decimal; // Sum of all 12 months' gross income
  biayaJabatan: Decimal; // min(5% × annualGross, 6,000,000)
  netIncome: Decimal; // annualGross - biayaJabatan - annualBpjsEmployee
  pkp: Decimal; // Penghasilan Kena Pajak (rounded down to nearest 1,000)
  annualPPh21: Decimal; // Total annual tax (after NPWP adjustment if applicable)
  decemberPPh21: Decimal; // Amount to withhold in December (min 0)
}

/**
 * Calculate final-month PPh 21 using the annualization method (PMK 168/2023).
 *
 * This produces the "true-up" withholding for the last payroll month — either
 * December for full-year employees, or the resign month for mid-year leavers.
 *
 * For mid-year joiners (monthsWorked < 12), an annualize-then-deannualize step
 * is applied so the progressive brackets reflect the employee's earning rate,
 * not their partial-year total.
 *
 * Steps per PMK 168/2023:
 *   1. biayaJabatan    = min(5% × actualGross, Rp 500,000 × monthsWorked)
 *   2. netIncome       = actualGross − biayaJabatan − bpjsEmployee
 *   3. annualizedNet   = (netIncome / monthsWorked) × 12          ← annualize
 *   4. PKP             = max(annualizedNet − PTKP, 0), floor to 1,000
 *   5. annualTax       = progressive tax on PKP (Article 17)
 *   6. If no NPWP      → annualTax × 1.2
 *   7. proportionalTax = (annualTax / 12) × monthsWorked           ← de-annualize
 *   8. finalMonth      = proportionalTax − totalPPh21Prior (floor at 0)
 *
 * When monthsWorked === 12, steps 3 and 7 are identity operations,
 * so full-year employees get the same result as before.
 *
 * @param params.annualGrossIncome  - Sum of actual gross incomes for all months worked
 * @param params.annualBpjsEmployee - Sum of (jhtEmp + jpEmp) for all months worked
 *                                    Note: kesEmp is excluded per PMK 168/2023
 * @param params.ptkpStatus         - Employee's PTKP status
 * @param params.hasNpwp            - false → 20% surcharge on annual tax
 * @param params.totalPPh21Prior    - Sum of TER-withheld amounts for prior months
 * @param params.monthsWorked       - Number of months employed in this tax year (1–12)
 * @param params.biayaJabatanMax    - Override cap (default Rp 500,000 × monthsWorked)
 */
export function calculateDecemberPPh21(params: {
  annualGrossIncome: Decimal;
  annualBpjsEmployee: Decimal;
  ptkpStatus: PTKPStatus;
  hasNpwp: boolean;
  totalPPh21Prior: Decimal;
  monthsWorked: number;
  biayaJabatanMax?: Decimal;
}): DecemberPPh21Result {
  const {
    annualGrossIncome,
    annualBpjsEmployee,
    ptkpStatus,
    hasNpwp,
    totalPPh21Prior,
    monthsWorked,
    biayaJabatanMax: customBiayaJabatanMax,
  } = params;

  // Step 1: Biaya jabatan = min(5% × actual gross, cap)
  // Default cap = Rp 500,000 × monthsWorked (= Rp 6,000,000 for 12 months)
  const effectiveBiayaJabatanMax =
    customBiayaJabatanMax ?? new Decimal(500_000).mul(monthsWorked);
  const biayaJabatan = Decimal.min(
    annualGrossIncome.mul(BIAYA_JABATAN_RATE),
    effectiveBiayaJabatanMax
  );

  // Step 2: Net income (actual period)
  // Note: Only JHT and JP employee contributions are deductible (not BPJS Kesehatan)
  const netIncome = annualGrossIncome.minus(biayaJabatan).minus(annualBpjsEmployee);

  // Step 3: Annualize net income for mid-year joiners
  // For 12 months this is an identity: (net / 12) × 12 = net
  const annualizedNetIncome = netIncome
    .dividedBy(monthsWorked)
    .mul(12)
    .toDecimalPlaces(0);

  // Step 4: PKP = max(annualizedNet - PTKP, 0), rounded DOWN to nearest 1,000
  const ptkpValue = PTKP_ANNUAL[ptkpStatus];
  const pkpRaw = Decimal.max(annualizedNetIncome.minus(ptkpValue), new Decimal(0));
  const pkp = pkpRaw.dividedToIntegerBy(1000).mul(1000);

  // Step 5: Progressive tax on annualized PKP (Article 17)
  let annualPPh21 = calculateProgressiveTax(pkp);

  // Step 6: NPWP surcharge — multiply by 1.2 if employee has no NPWP
  if (!hasNpwp) {
    annualPPh21 = annualPPh21.mul("1.2").toDecimalPlaces(0);
  }

  // Step 7: De-annualize — proportional tax for actual months worked
  // For 12 months this is identity: (tax / 12) × 12 = tax
  const proportionalPPh21 = annualPPh21
    .dividedBy(12)
    .mul(monthsWorked)
    .toDecimalPlaces(0);

  // Step 8: Final-month withholding = proportional tax − already withheld
  const decemberRaw = proportionalPPh21.minus(totalPPh21Prior);
  const decemberPPh21 = Decimal.max(decemberRaw, new Decimal(0));

  return {
    annualGross: annualGrossIncome,
    biayaJabatan,
    netIncome,
    pkp,
    annualPPh21: proportionalPPh21,
    decemberPPh21,
  };
}
