---
plan: "04-11-bugfix"
phase: "04-payroll-management"
status: complete
completed: "2026-04-13"
type: bugfix
regulation: "PMK 168/2023"
severity: critical
files_changed:
  - src/lib/actions/payroll.actions.ts
---

# Bugfix 04-11: THR PPh 21 Recalculation (Critical)

## Bug Description

When THR was added to a DRAFT PayrollRun via `addTHRToPayrollAction`, the function
only performed simple arithmetic addition on `grossPay` and `netPay` without
recalculating PPh 21. This meant:

1. **grossPay** was updated correctly (old grossPay + THR)
2. **PPh 21 was NOT recalculated** — it still reflected the TER bracket for the
   pre-THR salary, not the combined (salary + THR) amount
3. **totalDeductions** was NOT updated — it still had the old PPh 21 amount
4. **netPay** was inflated — THR was added raw without the higher tax deduction

### Root Cause (payroll.actions.ts:227-248 before fix)

```typescript
// OLD CODE — simple addition, no tax recalculation
const newGross = currentEntry.grossPay + thrAmount;
const newNet   = currentEntry.netPay + thrAmount;  // ← BUG: PPh 21 not recalculated!

await prisma.payrollEntry.update({
  data: { thrAmount, grossPay: newGross, netPay: newNet },
  // pph21 and totalDeductions NOT updated!
});
```

### Impact — Test Case 4 (Raka, K/1, Gaji Rp 15.000.000 + THR Rp 15.000.000)

| Field | Before Fix (WRONG) | After Fix (CORRECT) |
|-------|-------------------|---------------------|
| grossPay | 30,000,000 | 30,000,000 |
| grossPayForTax | 15,081,000 (no recalc) | 30,081,000 |
| TER bracket (K/1 → B) | 6% (15M bracket) | 12% (30M bracket) |
| PPh 21 | 904,860 | 3,609,720 |
| Tax underpayment | **Rp 2,704,860** | **Rp 0** |

## Fix (payroll.actions.ts)

### 1. Additional imports

```typescript
import { calculateMonthlyPPh21 } from "@/lib/services/pph21.service";
import type { PTKPStatus } from "@/types/enums";
```

### 2. Extended employee select (line 190-204)

Added fields required for PPh 21 recalculation:
- `ptkpStatus` — determines TER category (A/B/C)
- `npwp` — reserved for December annualization (not used in monthly TER)
- `isTaxBorneByCompany` — controls whether PPh 21 is deducted from employee

### 3. Extended PayrollEntry select (line 235-245)

Now fetches BPJS fields from the stored entry:
- `bpjsKesEmp`, `bpjsJhtEmp`, `bpjsJpEmp` — employee BPJS deductions (unchanged by THR)
- `bpjsJkk`, `bpjsJkm` — employer premiums (needed for grossPayForTax per PMK 168/2023)

### 4. Full recalculation block (line 248-274)

```
Step 1: newGrossPay = prevGrossPay + thrAmount
Step 2: newGrossPayForTax = newGrossPay + JKK + JKM (PMK 168/2023 basis)
Step 3: newPph21 = calculateMonthlyPPh21(newGrossPayForTax, ptkpStatus)
Step 4: pph21EmployeeDeduction = isTaxBorneByCompany ? 0 : newPph21
Step 5: newTotalDeductions = bpjsEmployeeTotal + pph21EmployeeDeduction
Step 6: newNetPay = newGrossPay - newTotalDeductions
```

### 5. PayrollEntry update now writes all 5 fields (line 276-284)

```typescript
data: {
  thrAmount,          // NEW: THR amount
  grossPay,           // UPDATED: includes THR
  pph21,              // UPDATED: recalculated with higher TER bracket
  totalDeductions,    // UPDATED: reflects new PPh 21
  netPay,             // UPDATED: correctly reduced by new PPh 21
}
```

## Key Design Decisions

### Why BPJS is NOT recalculated
BPJS basis = baseSalary + fixed allowances (per government regulation). THR is NOT
part of BPJS basis. Therefore, all BPJS amounts stored in the PayrollEntry remain
valid after THR addition. We reuse the stored values directly.

### Why we call calculateMonthlyPPh21 (not December annualization)
THR is typically paid in months other than December (often Ramadan month). The TER
monthly method applies — the key insight is that TER is a function of TOTAL monthly
bruto, so adding THR shifts the employee into a higher TER bracket. This is correct
per PMK 168/2023 §3: TER applies to total income received in the period.

### Integration with isTaxBorneByCompany (Feature 04-10)
The fix correctly respects the company-borne tax flag added in 04-10. If the
employee's tax is borne by the company:
- `pph21` is still recalculated and stored at the correct higher amount
- `pph21EmployeeDeduction = 0` — not deducted from employee
- `netPay` = grossPay - BPJS only (employee keeps full salary + THR)

## Verification — Raka (K/1, Gaji 15M + THR 15M, April)

### Before fix
```
grossPay        = 30,000,000  (correct — THR added)
grossPayForTax  = NOT recalculated (still 15M-based)
TER bracket     = 6% (for ~15M range)
pph21           = 904,860
totalDeductions = BPJS + 904,860
netPay          = 30,000,000 - totalDeductions  ← UNDERSTATED TAX
```

### After fix
```
grossPay        = 30,000,000
JKK             = 15,000,000 × 0.24% = 36,000
JKM             = 15,000,000 × 0.30% = 45,000
grossPayForTax  = 30,000,000 + 36,000 + 45,000 = 30,081,000
TER category    = B (K/1)
TER bracket     = (29,350,000 – 31,450,000] → 12%
pph21           = 30,081,000 × 12% = 3,609,720
totalDeductions = BPJS_emp + 3,609,720
netPay          = 30,000,000 - totalDeductions  ← CORRECT TAX
```

## Out of Scope Decision — Test Case 3 (Pegawai Harian Lepas)

Per user decision on 2026-04-13: pegawai harian lepas (daily workers with TER Harian
per PMK 168/2023 Pasal 15-17) is declared OUT OF SCOPE for this HRMS. The system
focuses exclusively on PKWT (kontrak) and PKWTT (tetap) employees, which both use
TER Bulanan. This keeps the target release timeline intact.

## Type Check

`npx tsc --noEmit` passes — 0 errors in payroll files (1 pre-existing error in
unrelated recruitment file: add-candidate-wrapper.tsx TS2322).
