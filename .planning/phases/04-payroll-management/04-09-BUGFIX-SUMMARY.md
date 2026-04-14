---
plan: "04-09-bugfix"
phase: "04-payroll-management"
status: complete
completed: "2026-04-12"
type: bugfix
regulation: "PMK 168/2023"
files_changed:
  - src/lib/services/payroll.service.ts
  - src/lib/services/pph21.service.ts
---

# Bugfix 04-09: PPh 21 Compliance Fixes (PMK 168/2023)

## Bug 1 — Gross Pay for TER Missing JKK + JKM Employer Premiums

**Problem:** `grossPay` passed to `calculateMonthlyPPh21()` only included baseSalary + allowances + overtime − absence. Per PMK 168/2023 Pasal 14, premi JKK and JKM paid by the employer are taxable income (penghasilan bruto) and must be included in the TER calculation basis.

**Fix (payroll.service.ts:198-201):**
- Added `grossPayForTax = grossPay + bpjs.jkk + bpjs.jkm` after BPJS calculation.
- `grossPayForTax` is used for PPh 21 calculation (both TER monthly and annualization).
- `grossPay` (without JKK/JKM) is still used for net pay and payslip display — JKK/JKM are employer-paid phantom income that don't affect take-home pay.
- Annualization now reconstructs prior months' tax gross by summing `grossPay + bpjsJkk + bpjsJkm` from stored `PayrollEntry` records.

**Impact:** PPh 21 amounts will be slightly higher (correct) for all employees, as the TER now applies to a larger gross base that includes JKK + JKM.

## Bug 2 — Annualization Hardcoded to December Only

**Problem:** The annualization block (`if (month === 12)`) only ran in December. Employees who resign mid-year require annualization in their last payroll month (masa pajak terakhir) per PMK 168/2023. Without this, resigned employees would be TER-withheld in their final month, potentially causing over/under-payment of PPh 21.

**Fix (payroll.service.ts:207-290):**
- Detect resign: `isResigningThisMonth` checks if `emp.terminationDate` falls within the current payroll month.
- Trigger: `isLastPayrollMonth = month === 12 || isResigningThisMonth`.
- Employee query (line 96-122) now includes `OR: [{ isActive: true }, { isActive: false, terminationDate in current month }]` so resigned employees are not skipped.
- Added `joinDate` and `terminationDate` to `EmployeeForPayroll` type and Prisma select.
- Prior entries query uses `month: { lt: month }` (was hardcoded `lt: 12`), generalizing for both December and mid-year resign.

**Biaya Jabatan Dynamic Cap (payroll.service.ts:267-276):**
- Cap = `Rp 500,000 × monthsWorked` (not fixed Rp 6,000,000).
- `monthsWorked = currentMonth - effectiveStartMonth + 1`, where `effectiveStart = max(joinDate, Jan 1 of tax year)`.
- For full-year employees in December: 12 × 500,000 = Rp 6,000,000 (backward compatible).
- For mid-year resign: correctly prorated (e.g., 8 months → Rp 4,000,000 cap).

**Fix (pph21.service.ts:182-204):**
- Added optional `biayaJabatanMax` parameter to `calculateDecemberPPh21()`.
- Defaults to `Rp 500,000 × monthsWorked` when not provided.
- Renamed `totalPPh21JanNov` → `totalPPh21Prior` to reflect it's not always Jan-Nov.

## Bug 3 — No Annualization/De-annualization for Mid-Year Joiners

**Problem:** `calculateDecemberPPh21()` used actual net income directly to compute PKP without annualizing first. For employees who joined mid-year (e.g., September), this meant only 4 months of income (Rp 62M) was compared against the full-year PTKP (Rp 54M), resulting in a near-zero PKP and massively understated tax — the system would compute Rp 0 instead of the correct Rp 985,000.

**Root cause (pph21.service.ts:211-218 before fix):**
```
netIncome = 59,600,000   ← actual 4 months (correct)
PKP = 59,600,000 − 54,000,000 = 5,600,000  ← WRONG: not annualized
annualTax = 280,000                          ← WRONG: way too low
december = max(280,000 − 3,255,000, 0) = 0  ← WRONG
```

**Fix (pph21.service.ts:157-253):**
- Added required `monthsWorked` parameter to `calculateDecemberPPh21()`.
- Step 3 (annualize): `annualizedNet = (netIncome / monthsWorked) × 12`.
- Step 4: PKP now uses `annualizedNet − PTKP` (not raw `netIncome`).
- Step 7 (de-annualize): `proportionalTax = (annualTax / 12) × monthsWorked`.
- Step 8: `decemberPPh21 = proportionalTax − totalPPh21Prior`.
- Return `annualPPh21` field now holds `proportionalTax` (the tax for actual period).
- For `monthsWorked === 12`, both steps are identity operations — fully backward compatible.

**Fix (payroll.service.ts:280):**
- Passes `monthsWorked` (already computed at line 275) to `calculateDecemberPPh21()`.

### Verification — Budi (TK/0, join Sep, 4 months)

| Step | Before Fix | After Fix | Expected |
|------|-----------|-----------|----------|
| Neto (aktual) | 59,600,000 | 59,600,000 | 59,600,000 |
| Neto setahun | — (skip) | 178,800,000 | 178,800,000 ✓ |
| PKP | 5,600,000 | 124,800,000 | 124,800,000 ✓ |
| PPh 21 setahun | 280,000 | 12,720,000 | 12,720,000 ✓ |
| Proporsional | — (skip) | 4,240,000 | 4,240,000 ✓ |
| Desember | **0** | **985,000** | **985,000** ✓ |

### Verification — Bima (TK/0, full year, 12 months) — Backward Compat

| Step | Before Fix | After Fix | Expected |
|------|-----------|-----------|----------|
| Neto | 233,520,000 | 233,520,000 | 233,520,000 |
| Annualized | — | (233.5M / 12) × 12 = 233,520,000 | identity ✓ |
| PKP | 179,520,000 | 179,520,000 | 179,520,000 ✓ |
| PPh 21 | 20,928,000 | 20,928,000 | 20,928,000 ✓ |
| Proporsional | — | (20.928M / 12) × 12 = 20,928,000 | identity ✓ |
| Desember | 1,128,000 | 1,128,000 | 1,128,000 ✓ |

## Full Type-Check

`npx tsc --noEmit` passes — 0 errors in payroll/pph21 files (1 pre-existing error in unrelated recruitment file).
