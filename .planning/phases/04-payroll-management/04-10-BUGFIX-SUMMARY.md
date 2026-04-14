---
plan: "04-10-tax-borne-by-company"
phase: "04-payroll-management"
status: complete
completed: "2026-04-13"
type: feature
regulation: "PMK 168/2023"
files_changed:
  - prisma/schema.prisma
  - src/lib/services/payroll.service.ts
migration: 20260413133047_add_is_tax_borne_by_company
---

# Feature 04-10: Pajak Ditanggung Perusahaan (Company-Borne PPh 21)

## Problem Statement

Indonesian companies can choose to bear the PPh 21 tax on behalf of their employees
("Pajak Ditanggung Perusahaan"). In this arrangement:

- The PPh 21 is still calculated using the same TER/annualization method per PMK 168/2023
- The tax amount is recorded for government reporting (SPT Masa PPh 21)
- However, the tax is NOT deducted from the employee's salary — the company pays it separately
- The employee's take-home pay (netPay) is higher because PPh 21 is not subtracted

This is distinct from "Tunjangan Pajak" (tax allowance), which is a cash allowance that
increases the employee's gross income and is subject to tax itself.

| Concept | Nature | Effect on Bruto | Effect on NetPay |
|---------|--------|-----------------|------------------|
| Tunjangan Pajak | Cash allowance | Increases grossPay | Tax calculated on higher gross, deducted from employee |
| Pajak Ditanggung Perusahaan | Employer benefit | grossPayForTax unchanged | PPh 21 NOT deducted; company pays |

## Schema Change

**Model:** `Employee`
**Field added:** `isTaxBorneByCompany Boolean @default(false)`
**Migration:** `20260413133047_add_is_tax_borne_by_company`

The field is placed on the Employee model (not EmployeeAllowance) because the tax-bearing
arrangement applies to the employee's entire PPh 21 obligation, not per-allowance. A company
either bears an employee's full PPh 21 or doesn't — there is no partial bearing.

Default `false` ensures backward compatibility: all existing employees continue to have
PPh 21 deducted from their salary as before.

## Service Layer Changes (payroll.service.ts)

### EmployeeForPayroll Type
- Added `isTaxBorneByCompany: boolean` field.

### Prisma Select (line 115)
- Added `isTaxBorneByCompany: true` to the employee fetch query.

### Net Pay Calculation (section 4g)
- Introduced `pph21EmployeeDeduction` variable:
  - When `isTaxBorneByCompany === true`: `pph21EmployeeDeduction = 0`
  - When `isTaxBorneByCompany === false`: `pph21EmployeeDeduction = pph21` (unchanged behavior)
- `totalDeductions = bpjs.totalEmployeeDeduction + pph21EmployeeDeduction`
- `netPay = grossPay - totalDeductions`

### What Remains Unchanged
- **grossPayForTax**: Still includes `grossPay + JKK + JKM` per PMK 168/2023 Pasal 14.
  The tax calculation basis is the same regardless of who pays the tax.
- **pph21 stored in PayrollEntry**: Always the full calculated amount (never 0).
  This is critical for SPT Masa PPh 21 reporting — the government needs to know the
  actual tax amount, even if the company paid it.
- **TER lookup, annualization, progressive brackets**: All calculation logic untouched.

### Data Flow Diagram

```
grossPay (salary + allowances + overtime - absence)
    │
    ├─► grossPayForTax = grossPay + JKK + JKM     ←── UNCHANGED (PMK 168/2023 basis)
    │       │
    │       └─► PPh 21 = TER × grossPayForTax     ←── UNCHANGED (full calculation)
    │               │
    │               ├─► PayrollEntry.pph21 = full amount     ←── ALWAYS stored for reporting
    │               │
    │               └─► pph21EmployeeDeduction               ←── NEW branching point
    │                       │
    │                       ├── isTaxBorneByCompany=false → pph21 (deducted from employee)
    │                       └── isTaxBorneByCompany=true  → 0 (company pays, not deducted)
    │
    └─► netPay = grossPay - BPJS employee - pph21EmployeeDeduction
```

## Backward Compatibility

- `isTaxBorneByCompany` defaults to `false` → all existing employees are unaffected.
- No changes to PPh 21 calculation logic, BPJS calculation, or TER table lookups.
- PayrollEntry schema is unchanged — `pph21` field continues to store the full tax amount.
- `totalDeductions` and `netPay` in PayrollEntry now correctly reflect the employee's
  actual deductions and take-home pay.

## Verification

### Case A: Normal employee (isTaxBorneByCompany = false)
```
grossPay = 6,800,000
pph21 = 34,184
totalDeductions = BPJS_emp + 34,184    ← PPh 21 deducted from employee
netPay = 6,800,000 - totalDeductions   ← Employee pays tax
```

### Case B: Company-borne tax employee (isTaxBorneByCompany = true)
```
grossPay = 6,800,000
pph21 = 34,184                         ← Same calculation, same stored value
totalDeductions = BPJS_emp + 0         ← PPh 21 NOT deducted
netPay = 6,800,000 - BPJS_emp         ← Employee does NOT pay tax (higher take-home)
```

## Important Notes for Future Development

1. **Payslip Display**: When generating payslips for company-borne-tax employees, the UI
   should indicate that PPh 21 is "ditanggung perusahaan" rather than showing it as a
   deduction. The `pph21` value in PayrollEntry is the actual tax amount for reference.

2. **SPT Reporting**: For SPT Masa PPh 21, the `pph21` stored in PayrollEntry is the
   correct amount to report — it represents the actual tax obligation regardless of
   who bears the cost.

3. **Gross-Up Method**: This implementation uses the simpler "net method" where
   grossPayForTax is unchanged. A full gross-up method (where the tax itself is treated
   as additional income, creating a circular calculation) is a more complex alternative
   used by some companies. The current implementation covers the most common use case.

## Type Check

`npx tsc --noEmit` passes — 0 errors in payroll files (1 pre-existing error in unrelated
recruitment file: add-candidate-wrapper.tsx TS2322).
