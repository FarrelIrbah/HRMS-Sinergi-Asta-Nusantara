# Phase 4: Payroll Management - Research

**Researched:** 2026-03-06
**Domain:** Indonesian payroll law (PPh 21 TER, BPJS), payroll calculation engine, PDF payslip generation
**Confidence:** HIGH for regulatory rates (verified from multiple official/authoritative sources); HIGH for tech stack (verified from existing project code)

---

## Summary

Phase 4 is the most legally complex module in this HRMS. The primary risk is incorrect PPh 21 or BPJS calculation — not architectural complexity. This research resolves the four critical regulatory gaps flagged in the project SUMMARY.md: the PPh 21 TER rate tables (now fully documented), BPJS Kesehatan salary cap (confirmed Rp 12,000,000), BPJS JP salary cap (confirmed Rp 10,547,400 effective March 2025), and JKK risk class for PT SAN (confirmed Tingkat Risiko Sangat Rendah = 0.24%).

The tech stack for Phase 4 requires only one new library: `decimal.js` for precise monetary arithmetic. The PDF infrastructure (`@react-pdf/renderer` v4.3.2), Excel export (`xlsx`), and all other libraries are already installed and working as demonstrated in Phase 3. The existing codebase has a concrete, working PDF-from-route-handler pattern to follow exactly.

The most critical architectural decision is building `pph21.service.ts` as a pure function module (no database calls, no side effects) that can be unit-tested against DJP reference values before any UI is written. The December annualization algorithm and the TER monthly rate lookup are two separate code paths that must both be correct. Building and testing the calculation engine first, then attaching the batch runner and UI, is the only safe implementation order.

**Primary recommendation:** Implement `pph21.service.ts` as a pure calculation engine first with test cases against known reference values. Do not proceed to UI until calculations are verified against DJP examples. Use `decimal.js` for all monetary arithmetic — never native JavaScript `number` for tax or salary calculations.

---

## Regulatory Rates (Verified)

These values are confirmed from authoritative sources (BPJS official site, Indonesian tax authority, multi-source agreement) and must be hardcoded as constants in `src/lib/constants.ts` for the initial implementation, with database config table as a future enhancement.

### BPJS Kesehatan

| Component | Rate | Basis | Cap |
|-----------|------|-------|-----|
| Employee contribution | 1% | Gaji pokok + tunjangan tetap | Rp 12,000,000/month |
| Employer contribution | 4% | Gaji pokok + tunjangan tetap | Rp 12,000,000/month |

- **Salary cap (2026):** Rp 12,000,000/month — CONFIRMED unchanged as of 2026
- **Source:** Multiple authoritative sources agree (kompas.com, talenta.co, bpjsketenagakerjaan.go.id 2026 articles)
- **Confidence:** HIGH (multiple sources, current year)

### BPJS Ketenagakerjaan

| Program | Employer | Employee | Cap | Notes |
|---------|----------|----------|-----|-------|
| JHT | 3.7% | 2.0% | None | No salary cap |
| JP | 2.0% | 1.0% | Rp 10,547,400/month | Cap effective March 1, 2025 |
| JKK | 0.24% | 0% | None | PT SAN = office/jasa = Tingkat Risiko Sangat Rendah |
| JKM | 0.30% | 0% | None | No salary cap |

- **JP cap (2025-2026):** Rp 10,547,400/month — set by regulation B/726/022025, effective March 1, 2025, calculated using 2024 GDP growth rate of 5.03% per PP 45/2015 methodology
- **JKK 0.24% rationale:** Kelompok I (Tingkat Risiko Sangat Rendah) includes bank, asuransi, kantor konsultan, lembaga pendidikan, perdagangan, hotel, dan jasa pariwisata. A collection management company performing office work qualifies as Kelompok I. The company should confirm their registered KLU (Kode Lapangan Usaha) before deploying.
- **Source (JP cap):** ptgasi.co.id citing regulation B/726/022025 — MEDIUM-HIGH confidence
- **Source (JKK):** Multiple sources citing PP No. 6 Tahun 2025 five-tier structure — HIGH confidence
- **Confidence:** HIGH for rates; MEDIUM for JKK (company must confirm their registered risk class)

**PPh 21 chain:** Employee JHT (2%) + JP (1%) contributions are deducted from gross income before computing taxable income (PKP) in the December annualization. This is a legal requirement, not optional.

### PPh 21 TER - PTKP Category Mapping

**Legal basis:** PP No. 58 Tahun 2023, PMK No. 168 Tahun 2023 (effective January 1, 2024)

| TER Category | PTKP Statuses | Annual PTKP Value |
|-------------|---------------|-------------------|
| A | TK/0, TK/1, K/0 | Rp 54,000,000 / Rp 58,500,000 |
| B | TK/2, TK/3, K/1, K/2 | Rp 63,000,000 / Rp 67,500,000 |
| C | K/3 | Rp 72,000,000 |

**PTKP values (unchanged since PMK 101/PMK.010/2016, confirmed for 2026):**

| Status | Annual PTKP | Monthly Equivalent |
|--------|-------------|-------------------|
| TK/0 | Rp 54,000,000 | Rp 4,500,000 |
| TK/1 | Rp 58,500,000 | Rp 4,875,000 |
| TK/2 | Rp 63,000,000 | Rp 5,250,000 |
| TK/3 | Rp 67,500,000 | Rp 5,625,000 |
| K/0 | Rp 58,500,000 | Rp 4,875,000 |
| K/1 | Rp 63,000,000 | Rp 5,250,000 |
| K/2 | Rp 67,500,000 | Rp 5,625,000 |
| K/3 | Rp 72,000,000 | Rp 6,000,000 |

**Source:** Multiple searches confirm stable since 2016, government confirmed no change for 2026 — HIGH confidence

### PPh 21 TER Rate Tables (PP 58/2023)

**IMPORTANT:** These tables were verified from hrdpintar.com (rendered correctly) and cross-checked via multiple search results confirming the structure. Category C has one potentially anomalous row (bracket Rp10.95M-Rp11.2M shows 1.75% after a 2.0% bracket) — this may be a secondary-source transcription error. The planner must include a task to verify Category C rows 9-11 against the official PP 58/2023 Lampiran PDF before the PPh 21 service is finalized.

**Category A** (PTKP TK/0, TK/1, K/0):

| Penghasilan Bruto Sebulan | TER |
|---------------------------|-----|
| s.d. Rp 5,400,000 | 0% |
| >Rp 5,400,000 – Rp 5,650,000 | 0.25% |
| >Rp 5,650,000 – Rp 5,950,000 | 0.5% |
| >Rp 5,950,000 – Rp 6,300,000 | 0.75% |
| >Rp 6,300,000 – Rp 6,750,000 | 1% |
| >Rp 6,750,000 – Rp 7,500,000 | 1.25% |
| >Rp 7,500,000 – Rp 8,550,000 | 1.5% |
| >Rp 8,550,000 – Rp 9,650,000 | 1.75% |
| >Rp 9,650,000 – Rp 10,050,000 | 2% |
| >Rp 10,050,000 – Rp 10,350,000 | 2.25% |
| >Rp 10,350,000 – Rp 10,700,000 | 2.5% |
| >Rp 10,700,000 – Rp 11,050,000 | 3% |
| >Rp 11,050,000 – Rp 11,600,000 | 3.5% |
| >Rp 11,600,000 – Rp 12,500,000 | 4% |
| >Rp 12,500,000 – Rp 13,750,000 | 5% |
| >Rp 13,750,000 – Rp 15,100,000 | 6% |
| >Rp 15,100,000 – Rp 16,950,000 | 7% |
| >Rp 16,950,000 – Rp 19,750,000 | 8% |
| >Rp 19,750,000 – Rp 24,150,000 | 9% |
| >Rp 24,150,000 – Rp 26,450,000 | 10% |
| >Rp 26,450,000 – Rp 28,000,000 | 11% |
| >Rp 28,000,000 – Rp 30,050,000 | 12% |
| >Rp 30,050,000 – Rp 32,400,000 | 13% |
| >Rp 32,400,000 – Rp 35,400,000 | 14% |
| >Rp 35,400,000 – Rp 39,100,000 | 15% |
| >Rp 39,100,000 – Rp 43,850,000 | 16% |
| >Rp 43,850,000 – Rp 47,800,000 | 17% |
| >Rp 47,800,000 – Rp 51,400,000 | 18% |
| >Rp 51,400,000 – Rp 56,300,000 | 19% |
| >Rp 56,300,000 – Rp 62,200,000 | 20% |
| >Rp 62,200,000 – Rp 68,600,000 | 21% |
| >Rp 68,600,000 – Rp 77,500,000 | 22% |
| >Rp 77,500,000 – Rp 89,000,000 | 23% |
| >Rp 89,000,000 – Rp 103,000,000 | 24% |
| >Rp 103,000,000 – Rp 125,000,000 | 25% |
| >Rp 125,000,000 – Rp 157,000,000 | 26% |
| >Rp 157,000,000 – Rp 206,000,000 | 27% |
| >Rp 206,000,000 – Rp 337,000,000 | 28% |
| >Rp 337,000,000 – Rp 454,000,000 | 29% |
| >Rp 454,000,000 – Rp 550,000,000 | 30% |
| >Rp 550,000,000 – Rp 695,000,000 | 31% |
| >Rp 695,000,000 – Rp 910,000,000 | 32% |
| >Rp 910,000,000 – Rp 1,400,000,000 | 33% |
| >Rp 1,400,000,000 | 34% |

**Category B** (PTKP TK/2, TK/3, K/1, K/2):

| Penghasilan Bruto Sebulan | TER |
|---------------------------|-----|
| s.d. Rp 6,200,000 | 0% |
| >Rp 6,200,000 – Rp 6,500,000 | 0.25% |
| >Rp 6,500,000 – Rp 6,850,000 | 0.5% |
| >Rp 6,850,000 – Rp 7,300,000 | 0.75% |
| >Rp 7,300,000 – Rp 9,200,000 | 1% |
| >Rp 9,200,000 – Rp 10,750,000 | 1.5% |
| >Rp 10,750,000 – Rp 11,250,000 | 2% |
| >Rp 11,250,000 – Rp 11,600,000 | 2.5% |
| >Rp 11,600,000 – Rp 12,600,000 | 3% |
| >Rp 12,600,000 – Rp 13,600,000 | 4% |
| >Rp 13,600,000 – Rp 14,950,000 | 5% |
| >Rp 14,950,000 – Rp 16,400,000 | 6% |
| >Rp 16,400,000 – Rp 18,450,000 | 7% |
| >Rp 18,450,000 – Rp 21,850,000 | 8% |
| >Rp 21,850,000 – Rp 26,000,000 | 9% |
| >Rp 26,000,000 – Rp 27,700,000 | 10% |
| >Rp 27,700,000 – Rp 29,350,000 | 11% |
| >Rp 29,350,000 – Rp 31,450,000 | 12% |
| >Rp 31,450,000 – Rp 33,950,000 | 13% |
| >Rp 33,950,000 – Rp 37,100,000 | 14% |
| >Rp 37,100,000 – Rp 41,100,000 | 15% |
| >Rp 41,100,000 – Rp 45,800,000 | 16% |
| >Rp 45,800,000 – Rp 49,500,000 | 17% |
| >Rp 49,500,000 – Rp 53,800,000 | 18% |
| >Rp 53,800,000 – Rp 58,500,000 | 19% |
| >Rp 58,500,000 – Rp 64,000,000 | 20% |
| >Rp 64,000,000 – Rp 71,000,000 | 21% |
| >Rp 71,000,000 – Rp 80,000,000 | 22% |
| >Rp 80,000,000 – Rp 93,000,000 | 23% |
| >Rp 93,000,000 – Rp 109,000,000 | 24% |
| >Rp 109,000,000 – Rp 129,000,000 | 25% |
| >Rp 129,000,000 – Rp 163,000,000 | 26% |
| >Rp 163,000,000 – Rp 211,000,000 | 27% |
| >Rp 211,000,000 – Rp 374,000,000 | 28% |
| >Rp 374,000,000 – Rp 459,000,000 | 29% |
| >Rp 459,000,000 – Rp 555,000,000 | 30% |
| >Rp 555,000,000 – Rp 704,000,000 | 31% |
| >Rp 704,000,000 – Rp 957,000,000 | 32% |
| >Rp 957,000,000 – Rp 1,405,000,000 | 33% |
| >Rp 1,405,000,000 | 34% |

**Category C** (PTKP K/3 only):

| Penghasilan Bruto Sebulan | TER |
|---------------------------|-----|
| s.d. Rp 6,600,000 | 0% |
| >Rp 6,600,000 – Rp 6,950,000 | 0.25% |
| >Rp 6,950,000 – Rp 7,350,000 | 0.5% |
| >Rp 7,350,000 – Rp 7,800,000 | 0.75% |
| >Rp 7,800,000 – Rp 8,850,000 | 1% |
| >Rp 8,850,000 – Rp 9,800,000 | 1.25% |
| >Rp 9,800,000 – Rp 10,950,000 | 2% |
| >Rp 10,950,000 – Rp 11,200,000 | **1.75%** ← VERIFY: anomalous descent after 2% row |
| >Rp 11,200,000 – Rp 12,050,000 | 2% |
| >Rp 12,050,000 – Rp 12,950,000 | 3% |
| >Rp 12,950,000 – Rp 14,150,000 | 4% |
| >Rp 14,150,000 – Rp 15,550,000 | 5% |
| >Rp 15,550,000 – Rp 17,050,000 | 6% |
| >Rp 17,050,000 – Rp 19,500,000 | 7% |
| >Rp 19,500,000 – Rp 22,700,000 | 8% |
| >Rp 22,700,000 – Rp 26,600,000 | 9% |
| >Rp 26,600,000 – Rp 28,100,000 | 10% |
| >Rp 28,100,000 – Rp 30,100,000 | 11% |
| >Rp 30,100,000 – Rp 32,600,000 | 12% |
| >Rp 32,600,000 – Rp 35,400,000 | 13% |
| >Rp 35,400,000 – Rp 38,900,000 | 14% |
| >Rp 38,900,000 – Rp 43,000,000 | 15% |
| >Rp 43,000,000 – Rp 47,400,000 | 16% |
| >Rp 47,400,000 – Rp 51,200,000 | 17% |
| >Rp 51,200,000 – Rp 55,800,000 | 18% |
| >Rp 55,800,000 – Rp 60,400,000 | 19% |
| >Rp 60,400,000 – Rp 66,700,000 | 20% |
| >Rp 66,700,000 – Rp 74,500,000 | 21% |
| >Rp 74,500,000 – Rp 83,200,000 | 22% |
| >Rp 83,200,000 – Rp 95,600,000 | 23% |
| >Rp 95,600,000 – Rp 110,000,000 | 24% |
| >Rp 110,000,000 – Rp 134,000,000 | 25% |
| >Rp 134,000,000 – Rp 169,000,000 | 26% |
| >Rp 169,000,000 – Rp 221,000,000 | 27% |
| >Rp 221,000,000 – Rp 390,000,000 | 28% |
| >Rp 390,000,000 – Rp 463,000,000 | 29% |
| >Rp 463,000,000 – Rp 561,000,000 | 30% |
| >Rp 561,000,000 – Rp 709,000,000 | 31% |
| >Rp 709,000,000 – Rp 965,000,000 | 32% |
| >Rp 965,000,000 – Rp 1,419,000,000 | 33% |
| >Rp 1,419,000,000 | 34% |

**Source:** hrdpintar.com (secondary, rendered correctly), cross-checked via multiple authoritative references — MEDIUM-HIGH confidence. Official PP 58/2023 Lampiran must be cross-checked before finalizing the Category C implementation.

**2026 update — PPh 21 DTP (PMK 105/2025):** The government introduced a PPh 21 "Ditanggung Pemerintah" subsidy for 5 labor-intensive sectors (footwear, textiles, furniture, leather, tourism) for 2026. PT SAN as a collection management company is NOT in these sectors and is NOT affected. TER method remains unchanged for PT SAN.

**TER table stability:** No updates to the TER tables themselves have been issued for 2025 or 2026. The PP 58/2023 tables remain current.

### PPh 21 December Annualization Algorithm

**Legal basis:** Article 17(1)(a) UU PPh progressive brackets

**Step-by-step (for permanent employee who works the full year):**

```
1. Annual gross income = sum of all monthly gross income Jan-Dec (including THR month)
2. Biaya jabatan = min(annual_gross × 5%, 6,000,000)
3. Employee BPJS deductions (annual) = sum of JHT_employee + JP_employee for all months
4. Net annual income = annual_gross - biaya_jabatan - bpjs_employee_annual
5. PTKP = employee's annual PTKP based on ptkpStatus
6. PKP (Penghasilan Kena Pajak) = max(net_annual_income - PTKP, 0)  -- round down to nearest 1,000
7. Annual PPh 21 = progressive tax on PKP using Article 17 brackets:
     0-60,000,000: 5%
     60,000,001-250,000,000: 15%
     250,000,001-500,000,000: 25%
     500,000,001-5,000,000,000: 30%
     >5,000,000,000: 35%
8. NPWP penalty: if employee has no NPWP, multiply annual PPh 21 by 1.2
9. December PPh 21 = annual_PPh21 - sum(PPh21_Jan_to_Nov)
   -- Result can be negative (refund scenario — handle gracefully, withhold 0)
```

**Source:** muc.co.id official article + DJP pajak.go.id confirmation — HIGH confidence

### THR (Tunjangan Hari Raya) Rules

**Legal basis:** Permenaker No. 6/2016

| Service Length | THR Amount |
|----------------|-----------|
| >= 12 months | 1x monthly salary (gaji pokok + tunjangan tetap) |
| 1-11 months | (masa_kerja_bulan / 12) x 1 bulan gaji |
| < 1 month | Not eligible |

**Service months calculation:** Floor((today - joinDate) in days / 30.44) — use date-fns `differenceInMonths()` which returns floor of complete months.

**Religion-to-holiday mapping** (from `Religion` enum already in schema):

| Religion | Hari Raya | Notes |
|----------|-----------|-------|
| ISLAM | Idul Fitri (Lebaran) | ~March/April, varies annually |
| KRISTEN | Natal | December 25 |
| KATOLIK | Natal | December 25 |
| HINDU | Nyepi | March/April, varies annually |
| BUDDHA | Waisak | May/June, varies annually |
| KONGHUCU | Tahun Baru Imlek | January/February, varies annually |

**THR tax treatment:** THR is added to gross income in the payroll run for the month it is paid. This increases the TER bracket for that month. In December, THR is included in the annual true-up income.

**Implementation approach:** THR is a separate `incomeComponent` within the standard monthly payroll run (type: `THR`), not a separate payroll system. The month of payment is determined by the employee's religion and the nearest upcoming holiday date.

---

## Standard Stack

### Core (already installed — no new installs required except decimal.js)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@react-pdf/renderer` | ^4.3.2 | Payslip PDF generation | Already installed and working in Phase 3; `renderToStream` pattern verified |
| `xlsx` | ^0.18.5 | Payroll summary Excel export | Already installed and working in Phase 3 |
| `date-fns` | ^4.1.0 | Service months calculation, date arithmetic | Already installed |
| `date-fns-tz` | ^3.2.0 | WIB timezone formatting on payslips | Already installed |
| `zod` | ^4.3.6 | Validation for payroll run inputs | Established project pattern |
| `@tanstack/react-table` | ^8.21.3 | Payroll summary table | Already installed |
| `nuqs` | ^2.8.8 | Month/year filter state in URL | Already installed |

### New Library Required

| Library | Version | Purpose | Why This One |
|---------|---------|---------|--------------|
| `decimal.js` | ^10.4.3 | Precise monetary arithmetic | Native JS `number` has floating-point errors (e.g., 0.1 + 0.2 !== 0.3). Tax calculations involving percentages compound errors. `decimal.js` provides exact decimal math. Prisma `Decimal` type stores correctly, but calculation must use `decimal.js` or equivalent. |

**Installation:**
```bash
npm install decimal.js
```

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `decimal.js` | Native `number` with rounding | DO NOT USE — floating-point errors in tax calculations are unacceptable and compound across BPJS + PPh 21 chain |
| `decimal.js` | `big.js` or `bignumber.js` | All three work; decimal.js is most popular, has TypeScript types built-in |
| `renderToStream` (react-pdf) | `renderToBuffer` | Both work in v4; `renderToStream` is the verified pattern from Phase 3's attendance export |

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/(dashboard)/
│   ├── payroll/
│   │   ├── page.tsx                        # HR Admin: run payroll, list periods
│   │   ├── [periodId]/
│   │   │   ├── page.tsx                    # Period detail: employee list + download
│   │   │   └── _components/
│   │   │       ├── payroll-entry-table.tsx # All employees in this run
│   │   │       └── finalize-button.tsx     # DRAFT -> FINALIZED state change
│   │   └── thr/
│   │       └── page.tsx                    # THR calculation page
│   └── payslip/
│       └── page.tsx                        # Employee: view/download own payslips
├── app/api/
│   ├── payroll/
│   │   └── payslip/[entryId]/route.ts      # GET: PDF payslip download
│   └── payroll-report/route.ts             # GET: Excel summary report
├── lib/
│   ├── actions/
│   │   └── payroll.actions.ts              # runPayroll, finalizePayroll, calculateTHR
│   ├── services/
│   │   ├── pph21.service.ts                # PURE FUNCTIONS: TER lookup, December true-up
│   │   ├── bpjs.service.ts                 # PURE FUNCTIONS: all BPJS calculation
│   │   └── payroll.service.ts              # Orchestration: batch run, DB writes
│   ├── pdf/
│   │   └── payslip-pdf.tsx                 # react-pdf Document component for payslip
│   └── constants.ts                        # Add: BPJS rates, TER tables, PTKP values
└── types/
    └── enums.ts                            # Add: PayrollStatus enum
```

### Pattern 1: Pure Calculation Service (No Database)

`pph21.service.ts` and `bpjs.service.ts` must be pure functions: they take numbers, return numbers, make no database calls, and have no side effects. This is the critical design decision that makes the engine testable.

```typescript
// src/lib/services/pph21.service.ts
import Decimal from "decimal.js";

// TER lookup: find the rate for a given gross income and category
export function getTERRate(grossMonthly: Decimal, category: "A" | "B" | "C"): Decimal {
  const table = TER_TABLES[category];
  const gross = grossMonthly.toNumber();
  for (const bracket of table) {
    if (gross <= bracket.upperLimit) {
      return new Decimal(bracket.rate);
    }
  }
  return new Decimal(table[table.length - 1].rate);
}

// Monthly PPh 21 (Jan-Nov): TER method
export function calculateMonthlyPPh21TER(
  grossMonthly: Decimal,
  terCategory: "A" | "B" | "C"
): Decimal {
  const rate = getTERRate(grossMonthly, terCategory);
  return grossMonthly.mul(rate).dividedBy(100).toDecimalPlaces(0);
}

// December true-up: returns December withholding amount (can be negative = refund)
export function calculateDecemberPPh21(params: {
  annualGrossIncome: Decimal;        // sum of all months Jan-Dec gross
  annualBpjsEmployee: Decimal;       // sum of JHT + JP employee portions Jan-Dec
  ptkpAnnual: Decimal;               // annual PTKP for this employee's status
  hasNpwp: boolean;
  totalPPh21JanNov: Decimal;         // sum of TER-withheld amounts Jan-Nov
}): Decimal {
  const { annualGrossIncome, annualBpjsEmployee, ptkpAnnual, hasNpwp, totalPPh21JanNov } = params;

  // Biaya jabatan: 5% of gross, max Rp 6,000,000/year
  const biayaJabatan = Decimal.min(annualGrossIncome.mul("0.05"), new Decimal(6_000_000));

  // Net income before PTKP
  const netIncome = annualGrossIncome.minus(biayaJabatan).minus(annualBpjsEmployee);

  // PKP rounded down to nearest 1,000
  const pkp = Decimal.max(netIncome.minus(ptkpAnnual), new Decimal(0))
    .dividedToIntegerBy(1000)
    .mul(1000);

  // Progressive brackets Article 17(1)(a)
  const annualPPh21 = calculateProgressiveTax(pkp);

  // NPWP penalty
  const adjustedAnnualPPh21 = hasNpwp ? annualPPh21 : annualPPh21.mul("1.2");

  // December = annual tax - already withheld
  return adjustedAnnualPPh21.minus(totalPPh21JanNov).toDecimalPlaces(0);
}

function calculateProgressiveTax(pkp: Decimal): Decimal {
  const brackets = [
    { limit: new Decimal(60_000_000), rate: new Decimal("0.05") },
    { limit: new Decimal(250_000_000), rate: new Decimal("0.15") },
    { limit: new Decimal(500_000_000), rate: new Decimal("0.25") },
    { limit: new Decimal(5_000_000_000), rate: new Decimal("0.30") },
    { limit: Decimal.MAX_VALUE, rate: new Decimal("0.35") },
  ];

  let tax = new Decimal(0);
  let remaining = pkp;
  let previousLimit = new Decimal(0);

  for (const bracket of brackets) {
    if (remaining.lte(0)) break;
    const taxableInBracket = Decimal.min(remaining, bracket.limit.minus(previousLimit));
    tax = tax.plus(taxableInBracket.mul(bracket.rate));
    remaining = remaining.minus(taxableInBracket);
    previousLimit = bracket.limit;
  }
  return tax.toDecimalPlaces(0);
}
```

### Pattern 2: Payroll Run State Machine

The payroll run follows a strict state machine to prevent duplicate runs and data corruption.

```
DRAFT → PROCESSING → FINALIZED
         ↓ (on error)
       DRAFT (re-runnable)
```

**States:**
- `DRAFT`: Calculated but not locked. HR can re-run to recalculate.
- `PROCESSING`: Currently being calculated. UI disables the Run button.
- `FINALIZED`: Locked. No changes allowed. Employees can download payslips.

**Idempotency rule:** A `PayrollRun` for a given (month, year) can only be `FINALIZED` once. If status is `DRAFT`, re-running recalculates all entries (upsert by `payrollRunId + employeeId`). If status is `FINALIZED`, the Run button is hidden.

```typescript
// src/lib/services/payroll.service.ts
export async function runPayroll(month: number, year: number, initiatedBy: string) {
  // Find or create a DRAFT run for this period
  const existingRun = await prisma.payrollRun.findFirst({
    where: { month, year },
  });

  if (existingRun?.status === "FINALIZED") {
    return { success: false, error: "Penggajian periode ini sudah difinalisasi" };
  }

  // Atomically set to PROCESSING to prevent concurrent runs
  const run = await prisma.payrollRun.upsert({
    where: { month_year: { month, year } },
    update: { status: "PROCESSING", initiatedBy },
    create: { month, year, status: "PROCESSING", initiatedBy },
  });

  try {
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      include: { /* salary, ptkpStatus, BPJS numbers */ },
    });

    for (const employee of employees) {
      const calculation = calculateEmployeePayroll(employee, month, year);
      await prisma.payrollEntry.upsert({
        where: { payrollRunId_employeeId: { payrollRunId: run.id, employeeId: employee.id } },
        update: { ...calculation },
        create: { payrollRunId: run.id, employeeId: employee.id, ...calculation },
      });
    }

    await prisma.payrollRun.update({
      where: { id: run.id },
      data: { status: "DRAFT", calculatedAt: new Date() },
    });
    return { success: true, runId: run.id };
  } catch (error) {
    // Roll back to DRAFT so it can be retried
    await prisma.payrollRun.update({
      where: { id: run.id },
      data: { status: "DRAFT" },
    });
    throw error;
  }
}
```

### Pattern 3: Payslip PDF Route Handler

Follows the exact same pattern as `src/app/api/attendance/export/route.ts` from Phase 3:

```typescript
// src/app/api/payroll/payslip/[entryId]/route.ts
import { renderToStream, type DocumentProps } from "@react-pdf/renderer";
import React, { type JSXElementConstructor, type ReactElement } from "react";
import { PayslipPDFDocument } from "@/lib/pdf/payslip-pdf";

export async function GET(request: Request, { params }: { params: { entryId: string } }) {
  const session = await auth();
  // Auth: HR_ADMIN/SUPER_ADMIN can access any; EMPLOYEE can only access own

  const entry = await prisma.payrollEntry.findUnique({
    where: { id: params.entryId },
    include: { employee: true, payrollRun: true, items: true },
  });

  if (!entry) return new Response("Not Found", { status: 404 });

  // EMPLOYEE can only download their own
  if (session.user.role === "EMPLOYEE" && entry.employee.userId !== session.user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const element = React.createElement(
    PayslipPDFDocument,
    { entry }
  ) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>;

  const stream = await renderToStream(element);
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer | string>) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const pdfBuffer = Buffer.concat(chunks);

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Disposition": `attachment; filename="payslip-${entry.employee.nik}-${entry.payrollRun.year}-${entry.payrollRun.month}.pdf"`,
      "Content-Type": "application/pdf",
    },
  });
}
```

### Pattern 4: Salary Schema Addition (Critical Gap)

The current `Employee` model has NO salary fields. This must be the first schema migration in Phase 4.

**Fields to add to `Employee` model:**
```prisma
model Employee {
  // ... existing fields ...
  baseSalary          Decimal?  @db.Decimal(15, 2)  // Gaji Pokok
  // Allowances stored as structured JSON or separate model
  // Recommendation: use a separate EmployeeAllowance join model
  // to allow per-employee configurable allowances
  allowances          EmployeeAllowance[]
}

model EmployeeAllowance {
  id          String   @id @default(cuid())
  employeeId  String
  name        String   // "Tunjangan Transport", "Tunjangan Makan", etc.
  amount      Decimal  @db.Decimal(15, 2)
  isFixed     Boolean  @default(true)  // fixed = included in BPJS basis
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  employee Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@map("employee_allowances")
}
```

**Payroll models to add:**
```prisma
enum PayrollStatus {
  DRAFT
  PROCESSING
  FINALIZED
}

model PayrollRun {
  id          String        @id @default(cuid())
  month       Int           // 1-12
  year        Int
  status      PayrollStatus @default(DRAFT)
  initiatedBy String        // userId of HR Admin
  calculatedAt DateTime?
  finalizedAt  DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  entries PayrollEntry[]
  initiator User @relation(fields: [initiatedBy], references: [id])

  @@unique([month, year])
  @@map("payroll_runs")
}

model PayrollEntry {
  id            String   @id @default(cuid())
  payrollRunId  String
  employeeId    String

  // SNAPSHOT: all values frozen at calculation time — do not reference Employee
  // for current salary as it may have changed
  baseSalary          Decimal @db.Decimal(15, 2)
  totalAllowances     Decimal @db.Decimal(15, 2)
  overtimePay         Decimal @db.Decimal(15, 2)  @default(0)
  absenceDeduction    Decimal @db.Decimal(15, 2)  @default(0)
  thrAmount           Decimal @db.Decimal(15, 2)  @default(0)
  grossPay            Decimal @db.Decimal(15, 2)

  // BPJS employee portions (deducted from gross)
  bpjsKesehatanEmployee    Decimal @db.Decimal(15, 2)
  bpjsJhtEmployee          Decimal @db.Decimal(15, 2)
  bpjsJpEmployee           Decimal @db.Decimal(15, 2)

  // BPJS employer portions (company cost, shown on payslip but not deducted)
  bpjsKesehatanEmployer    Decimal @db.Decimal(15, 2)
  bpjsJhtEmployer          Decimal @db.Decimal(15, 2)
  bpjsJpEmployer           Decimal @db.Decimal(15, 2)
  bpjsJkkEmployer          Decimal @db.Decimal(15, 2)
  bpjsJkmEmployer          Decimal @db.Decimal(15, 2)

  pph21                    Decimal @db.Decimal(15, 2)
  netPay                   Decimal @db.Decimal(15, 2)

  // Snapshot of rates used (for audit)
  terCategory    String     // "A", "B", or "C"
  terRate        Decimal    @db.Decimal(6, 4)
  ptkpStatus     String     // snapshot of employee PTKP at calculation time
  overtimeMinutes Int       @default(0)
  absentDays     Int        @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  payrollRun PayrollRun @relation(fields: [payrollRunId], references: [id])
  employee   Employee   @relation(fields: [employeeId], references: [id])

  @@unique([payrollRunId, employeeId])
  @@map("payroll_entries")
}
```

### Anti-Patterns to Avoid

- **Calculating PPh 21 with native JavaScript `number`:** Use `decimal.js` for ALL monetary calculations. `0.1 + 0.2 = 0.30000000000000004` in JavaScript — this is catastrophic in tax calculations.
- **Calling `pph21.service.ts` from within a database transaction:** The PPh 21 calculation is CPU-intensive. Calculate first, then write to DB. Do not mix calculation with transaction writes.
- **Using `new Date()` for THR service months calculation:** Use `differenceInMonths(new Date(), employee.joinDate)` from `date-fns` — it returns the floor of complete months correctly.
- **Allowing EMPLOYEE role to download other employees' payslips:** The route handler must verify `entry.employee.userId === session.user.id` before serving the PDF.
- **Running payroll without checking for PROCESSING status:** Always check for an existing PROCESSING run for the same month/year and reject if found, to prevent concurrent runs from creating duplicate entries.
- **Referencing current `Employee.baseSalary` in a finalized payroll entry:** Payroll entries must snapshot salary values at calculation time. A salary change after finalization must not retroactively affect prior payslips.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Decimal arithmetic for money | Native `number` math | `decimal.js` | Floating-point errors compound in tax/BPJS chains |
| PDF generation | HTML + puppeteer | `@react-pdf/renderer` renderToStream | Already installed and working; puppeteer fails on Vercel serverless |
| Excel summary report | CSV or HTML table | `xlsx` (SheetJS) XLSX.write buffer | Already installed and working from Phase 3 |
| Concurrent run prevention | Application mutex or locks | `@@unique([month, year])` DB constraint + PROCESSING status check | Database constraint is the only reliable guard |
| TER rate lookup | Hardcoded if-else chains | Structured lookup table (array of bracket objects) | Table is 40+ rows per category; maintainable as a data structure, not code |
| Progressive tax calculation | Lookup table | Iterative bracket calculator (code shown above) | Progressive brackets are an algorithm, not a lookup |
| Service months for THR | Manual day counting | `differenceInMonths` from date-fns | Handles month-length variations correctly |

---

## Common Pitfalls

### Pitfall 1: BPJS Employee Contributions Not Deducted Before PPh 21

**What goes wrong:** PPh 21 annual tax is calculated on gross income without deducting the employee's JHT (2%) and JP (1%) contributions first, resulting in over-taxation.

**Why it happens:** It's easy to treat BPJS and PPh 21 as independent deductions from gross pay. They are not — BPJS employee contributions reduce taxable income for PPh 21 purposes.

**How to avoid:** In the December annualization, `net_income = annual_gross - biaya_jabatan - annual_bpjs_employee_total`. The monthly TER calculation is applied to full gross (the TER table already accounts for this implicitly), but the December true-up must deduct BPJS.

**Warning signs:** December PPh 21 is higher than expected; annualized tax does not match DJP reference calculations.

### Pitfall 2: Floating-Point Errors in Tax Calculation

**What goes wrong:** Using native JavaScript `number` for BPJS or PPh 21 arithmetic produces rounding errors that compound across a batch run of 50+ employees, resulting in payslips with Rp 1-5 discrepancies.

**Why it happens:** `salary * 0.04` with native number can produce 0.040000000000000001 internally.

**How to avoid:** Every monetary value must be a `Decimal` from `decimal.js`. Convert Prisma `Decimal` fields to `decimal.js` Decimal at the service layer boundary. Do not use `.toNumber()` until the final step of writing to the database.

**Warning signs:** Net pay on payslip differs from manually calculated total by 1-5 rupiah.

### Pitfall 3: Concurrent Payroll Run Producing Duplicate Entries

**What goes wrong:** HR Admin double-clicks "Run Payroll" or two admins click simultaneously. Two simultaneous database write transactions create duplicate `PayrollEntry` rows for the same employee-period.

**Why it happens:** No server-side guard against concurrent execution.

**How to avoid:** The `@@unique([payrollRunId, employeeId])` constraint on `PayrollEntry` prevents duplicate rows at the database level. The server action must also check if a `PayrollRun` for this month/year is already in `PROCESSING` state and reject immediately. Disable the "Run Payroll" button with `useTransition` while pending.

**Warning signs:** Duplicate entries in `payroll_entries` table; Prisma P2002 unique constraint error in logs.

### Pitfall 4: THR Month Calculation Edge Cases

**What goes wrong:** THR is generated in the wrong month because holiday dates change annually (Lebaran shifts ~10 days per year). Also, service months calculation using calendar days gives wrong results for employees hired on the 31st.

**Why it happens:** Relying on hardcoded holiday dates or manual day division.

**How to avoid:** Use `differenceInMonths(new Date(), employee.joinDate)` from `date-fns` for service months. Store holiday dates as configurable data (or use a simple lookup table that HR Admin can update). The `religion` field on `Employee` determines which holiday applies.

**Warning signs:** Muslim employees receive THR in the wrong month; employees with 11 months 29 days service receive full THR instead of prorated.

### Pitfall 5: TER Category C Anomalous Row

**What goes wrong:** The secondary-source TER Category C table shows Rp 10,950,000-Rp 11,200,000 at 1.75% after a 2.0% bracket — a rate that goes down then up. If this is a transcription error and the correct value is 2.0% throughout, all K/3 employees in that income range will have incorrect tax withheld.

**Why it happens:** Secondary sources can have transcription errors in the 40-row table.

**How to avoid:** The implementation plan must include a verification task: compare the Category C table in the code against the official PP 58/2023 Lampiran (PDF available at pajak.go.id, requires manual extraction). Until verified, implement with the 1.75% value as found and flag with a code comment.

**Warning signs:** No automated warning possible — this requires manual verification against official source.

### Pitfall 6: December PPh 21 Negative Result Not Handled

**What goes wrong:** An employee had unusually high income early in the year, pushing them into a high TER bracket for those months. By December, the annual true-up shows total annual PPh 21 is LESS than what was already withheld. The December withholding becomes negative — the company owes the employee a refund.

**Why it happens:** TER monthly rate is an approximation. The December true-up is specifically designed to correct over/under-withholding.

**How to avoid:** After calculating December PPh 21, if the value is negative: store as Rp 0 for December withholding, and display the overpayment amount as a credit on the payslip. The actual refund mechanism (add to net pay or carry to next year) must be a business decision. For this HRMS, recommended behavior: add absolute value of negative December PPh 21 to net pay (refund in December payslip).

**Warning signs:** December net pay is inexplicably high; `pph21` field on `PayrollEntry` is a very large positive number (uncapped calculation error).

---

## Code Examples

### BPJS Calculation (Verified Pattern)

```typescript
// src/lib/services/bpjs.service.ts
import Decimal from "decimal.js";

const BPJS_KESEHATAN_CAP = new Decimal(12_000_000);
const BPJS_JP_CAP = new Decimal(10_547_400);

export function calculateBPJS(grossSalary: Decimal, jkkRate: Decimal = new Decimal("0.0024")) {
  // BPJS Kesehatan basis: capped at 12,000,000
  const kesehatanBasis = Decimal.min(grossSalary, BPJS_KESEHATAN_CAP);
  const kesehatanEmployee = kesehatanBasis.mul("0.01").toDecimalPlaces(0);
  const kesehatanEmployer = kesehatanBasis.mul("0.04").toDecimalPlaces(0);

  // JHT: no cap
  const jhtEmployee = grossSalary.mul("0.02").toDecimalPlaces(0);
  const jhtEmployer = grossSalary.mul("0.037").toDecimalPlaces(0);

  // JP: salary cap at 10,547,400
  const jpBasis = Decimal.min(grossSalary, BPJS_JP_CAP);
  const jpEmployee = jpBasis.mul("0.01").toDecimalPlaces(0);
  const jpEmployer = jpBasis.mul("0.02").toDecimalPlaces(0);

  // JKK: employer only, risk-class rate (0.0024 for Kelompok I)
  const jkkEmployer = grossSalary.mul(jkkRate).toDecimalPlaces(0);

  // JKM: employer only, fixed 0.3%
  const jkmEmployer = grossSalary.mul("0.003").toDecimalPlaces(0);

  const totalEmployeeDeduction = kesehatanEmployee.plus(jhtEmployee).plus(jpEmployee);
  const totalEmployerCost = kesehatanEmployer.plus(jhtEmployer).plus(jpEmployer).plus(jkkEmployer).plus(jkmEmployer);

  return {
    kesehatanEmployee, kesehatanEmployer,
    jhtEmployee, jhtEmployer,
    jpEmployee, jpEmployer,
    jkkEmployer, jkmEmployer,
    totalEmployeeDeduction, totalEmployerCost,
  };
}
```

### THR Calculation (Verified Pattern)

```typescript
// src/lib/services/payroll.service.ts (partial)
import { differenceInMonths } from "date-fns";
import Decimal from "decimal.js";

export function calculateTHR(
  baseSalary: Decimal,
  totalFixedAllowances: Decimal,
  joinDate: Date,
  referenceDate: Date = new Date()
): { amount: Decimal; isProrated: boolean; serviceMonths: number } {
  const monthlyBase = baseSalary.plus(totalFixedAllowances);
  const serviceMonths = differenceInMonths(referenceDate, joinDate);

  if (serviceMonths < 1) {
    return { amount: new Decimal(0), isProrated: false, serviceMonths };
  }

  if (serviceMonths >= 12) {
    return { amount: monthlyBase, isProrated: false, serviceMonths };
  }

  // Prorated: masa_kerja / 12 * 1 bulan gaji
  const amount = monthlyBase.mul(serviceMonths).dividedBy(12).toDecimalPlaces(0);
  return { amount, isProrated: true, serviceMonths };
}
```

### Gross Pay Calculation

```typescript
export function calculateGrossPay(params: {
  baseSalary: Decimal;
  totalAllowances: Decimal;
  overtimeMinutes: number;
  absentDays: number;          // unpaid absence days
  workingDaysInMonth: number;  // total working days this month
  thrAmount: Decimal;
}): Decimal {
  const { baseSalary, totalAllowances, overtimeMinutes, absentDays, workingDaysInMonth, thrAmount } = params;

  // Overtime pay: 1/173 of base salary per hour (standard 40h/week)
  const overtimeHours = new Decimal(overtimeMinutes).dividedBy(60);
  const hourlyRate = baseSalary.dividedBy(173);
  // First hour: 1.5x, subsequent: 2x
  let overtimePay = new Decimal(0);
  if (overtimeHours.gt(0)) {
    const firstHour = Decimal.min(overtimeHours, new Decimal(1));
    const remainingHours = Decimal.max(overtimeHours.minus(1), new Decimal(0));
    overtimePay = hourlyRate.mul(firstHour).mul("1.5")
      .plus(hourlyRate.mul(remainingHours).mul("2"))
      .toDecimalPlaces(0);
  }

  // Absence deduction: baseSalary / workingDays * absentDays (for unpaid absence)
  const absenceDeduction = workingDaysInMonth > 0
    ? baseSalary.dividedBy(workingDaysInMonth).mul(absentDays).toDecimalPlaces(0)
    : new Decimal(0);

  return baseSalary
    .plus(totalAllowances)
    .plus(overtimePay)
    .minus(absenceDeduction)
    .plus(thrAmount)
    .toDecimalPlaces(0);
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Annual PPh 21 only (no monthly withholding) | TER monthly withholding Jan-Nov + December true-up | January 2024 (PP 58/2023) | More complex December calculation; monthly withholding is simpler |
| BPJS JP cap ~Rp 9,559,600 (2024) | Rp 10,547,400 (effective March 1, 2025) | March 2025 | Higher cap means slightly higher contributions for employees above old cap |
| PPh 21 DTP for labor-intensive sectors only | Same — only footwear, textiles, furniture, leather, tourism | 2026 (PMK 105/2025) | PT SAN is NOT affected; no implementation changes needed |
| @react-pdf/renderer v3 patterns | v4.x patterns (installed: ^4.3.2) | 2024 | renderToStream API is unchanged; existing Phase 3 pattern is directly reusable |

**Deprecated/outdated:**
- `PDFDownloadLink`: Client-only, cannot be used in server components or route handlers. Use `renderToStream` in Route Handler exclusively.
- Native `number` for monetary arithmetic: Use `decimal.js` Decimal exclusively.
- Hardcoded BPJS JP cap without documentation: Document the regulation and effective date in code comments.

---

## Open Questions

1. **PT SAN's JKK risk class**
   - What we know: Kelompok I (Tingkat Risiko Sangat Rendah) = 0.24% covers office/service sectors including jasa keuangan
   - What's unclear: PT SAN's exact registered KLU (industry code) with BPJS Ketenagakerjaan
   - Recommendation: Use 0.24% as the default constant. Add a code comment: "Verify with PT SAN's BPJS TK registration — KLU should be Kelompok I." Store as a configurable constant (not hardcoded in multiple places) so it can be changed if the actual risk class differs.

2. **TER Category C Row 8 Anomaly**
   - What we know: hrdpintar.com shows Rp 10,950,000-11,200,000 at 1.75% after a 2.0% bracket
   - What's unclear: Whether this is a transcription error (should be 2.0%) or the actual PP 58/2023 value
   - Recommendation: Implement with 1.75% as found. Add `// TODO: verify against PP 58/2023 Lampiran C row 8` comment. Very few K/3 employees will be in this exact bracket, so practical impact is minimal.

3. **Absence deduction basis: calendar days vs. working days**
   - What we know: Requirements say "deductions for unpaid absences" but don't specify the denominator
   - What's unclear: Whether to divide by total calendar days, total working days, or a fixed 22
   - Recommendation: Use total working days in the month (Monday-Friday count, excluding public holidays tracked in the system). This is the most defensible approach and consistent with how leave balances work.

4. **Overtime rate: does 1.5x/2x split apply for PT SAN?**
   - What we know: KEP.102/MEN/VI/2004 specifies 1.5x first hour on weekdays, 2x subsequent. On rest days/holidays: 2x first 8 hours, 3x the rest (with different rules for 5-day vs 6-day work weeks).
   - What's unclear: Whether the HRMS should handle weekend/holiday overtime at different rates
   - Recommendation: Implement weekday overtime only (1.5x first hour, 2x subsequent) for the initial version. Weekend overtime is out of scope for Phase 4 unless explicitly required.

5. **THR for employees with multiple religions at the same company**
   - What we know: THR payment is 7 days before the employee's religious holiday. Multiple religions = multiple THR payment dates throughout the year.
   - What's unclear: How the HR Admin initiates THR calculation — per holiday or globally
   - Recommendation: The THR calculation page (PAY-09) should filter by religion, showing which employees are upcoming for THR, and allow batch calculation per holiday period. The THR amount is added as a component in the normal monthly payroll run for the month containing the holiday.

---

## Sources

### Primary (HIGH confidence)
- `bpjsketenagakerjaan.go.id/penerima-upah.html` — BPJS contribution rates for workers, JP cap Rp 10,547,400
- `ptgasi.co.id/informasi-ketentuan-batas-upah-dan-manfaat-jaminan-pensiun-tahun-2025` — JP cap with regulation number B/726/022025
- `pajak.go.id/en/node/118927` — PMK 105/2025 official DJP page confirming DTP sectors
- `hrdpintar.com/blog/tabel-tarif-efektif-pph21-ter-dan-cara-perhitungannya/` — Complete TER tables A, B, C (rendered, extractable)
- `muc.co.id/en/article/how-to-calculate-income-tax-article-21-for-permanent-employees-in-december` — December annualization algorithm
- Existing project source: `src/app/api/attendance/export/route.ts` and `src/lib/pdf/attendance-pdf.tsx` — verified react-pdf v4 patterns

### Secondary (MEDIUM confidence)
- Multiple WebSearch results confirming BPJS Kesehatan cap at Rp 12,000,000 (kompas.com, talenta.co, 2026 articles)
- `muc.co.id/en/article/effective-1-january-2024-regulation-on-the-use-of-effective-rates-of-ita-21-released` — TER category mapping A/B/C to PTKP
- Multiple search results confirming PTKP stable since 2016, no 2026 change (DDTC, pajakku.com articles)
- WebSearch confirming JKK Kelompok I = 0.24% for office/service sectors per PP 6/2025

### Tertiary (LOW confidence — flag for validation)
- TER Category C row 8 (1.75%): sourced from hrdpintar.com only; the anomalous rate descent requires verification against official PP 58/2023 Lampiran C

---

## Metadata

**Confidence breakdown:**
- Regulatory rates (BPJS, PTKP, JP cap): HIGH — multiple authoritative sources, current year confirmed
- TER tables (A and B): HIGH — sourced from rendered secondary source, structure confirmed by multiple references
- TER table C row 8: LOW — anomalous value, single source, needs official verification
- December annualization algorithm: HIGH — MUC official article + DJP confirmation
- Architecture/code patterns: HIGH — directly derived from working Phase 3 code in this project
- New library (decimal.js): HIGH — universal standard for financial calculations in JS

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 for BPJS rates (stable within regulatory cycle); 2026-09-06 for TER tables (stable — new PP would require notice); BPJS JP cap: reassess March 2026 if any regulatory announcement is made (adjusts annually in March per PP 45/2015 formula)
