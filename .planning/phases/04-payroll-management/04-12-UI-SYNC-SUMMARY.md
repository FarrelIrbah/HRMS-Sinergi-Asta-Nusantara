---
plan: "04-12-ui-sync"
phase: "04-payroll-management"
status: complete
completed: "2026-04-13"
type: feature
files_changed:
  - src/lib/validations/employee.ts
  - src/lib/services/employee.service.ts
  - src/app/(dashboard)/employees/[id]/_components/employee-profile-tabs.tsx
  - src/app/(dashboard)/employees/[id]/_components/tax-bpjs-tab.tsx
  - src/lib/pdf/payslip-pdf.tsx
  - src/app/api/payroll/payslip/[entryId]/route.ts
---

# Feature 04-12: UI Sync — isTaxBorneByCompany End-to-End

Closes gap between backend engine (04-10) and frontend UI for the
"Pajak Ditanggung Perusahaan" feature.

## Gap G1 — Data Master Employee Toggle

### Problem
`isTaxBorneByCompany` existed in Prisma schema and payroll engine but had no UI
to set it. HR Admin could never enable the feature for any employee.

### Changes

**Zod validation (`validations/employee.ts`)**
- Added `isTaxBorneByCompany: z.boolean().optional()` to `updateTaxBpjsSchema`.

**Service layer (`employee.service.ts:updateTaxBpjs`)**
- Added `isTaxBorneByCompany?: boolean` to function parameter type.
- Prisma update: `isTaxBorneByCompany: data.isTaxBorneByCompany ?? false`.
- Audit log: both old and new values now include `isTaxBorneByCompany`.

**SerializedEmployee interface (`employee-profile-tabs.tsx`)**
- Added `isTaxBorneByCompany: boolean` to the interface.
- Already flows from server via `...employee` spread in page.tsx serialization.

**UI component (`tax-bpjs-tab.tsx`)**
- Added `isTaxBorneByCompany` to form defaultValues.
- Added native checkbox field (consistent with Decision #56 — no shadcn Checkbox).
- Label: "PPh 21 Ditanggung Perusahaan".
- Description text explains the behavior in Indonesian.
- Checkbox spans full width (`sm:col-span-2`), positioned after BPJS fields.
- Respects `readOnly` prop for non-HR roles.

### Data Flow
```
tax-bpjs-tab.tsx (checkbox)
  → updateTaxBpjsAction (server action)
    → updateTaxBpjs service (employee.service.ts)
      → prisma.employee.update({ isTaxBorneByCompany })
        → payroll engine reads this flag during runPayroll/addTHR
```

## Gap G2 — Payslip PDF Conditional Display

### Problem
When `isTaxBorneByCompany=true`, the payslip PDF showed PPh 21 as a full amount
in the "Potongan Karyawan" (employee deductions) section. This was misleading
because the employee was not actually deducted — `totalDeductions` and `netPay`
already reflected no PPh 21 deduction, but the individual line item showed the
full PPh 21 amount, creating visual inconsistency.

### UX Decision
Two-location approach for maximum clarity:

1. **Potongan section**: PPh 21 line shows `Rp 0` with label
   "PPh 21 (Ditanggung Perusahaan)" — employee sees zero deduction.
2. **Kontribusi Perusahaan section**: New line "PPh 21 (Ditanggung)" shows the
   actual tax amount — employee can verify what the company paid.

This approach was chosen over simply hiding the PPh 21 line because:
- Transparency: employee knows tax exists and who pays it.
- Audit trail: the actual tax amount is visible on the payslip.
- Consistency: `totalDeductions` matches the sum of visible deductions.

### Changes

**PayslipData interface (`payslip-pdf.tsx`)**
- Added `isTaxBorneByCompany: boolean` field.

**Payslip API route (`api/payroll/payslip/[entryId]/route.ts`)**
- Added `isTaxBorneByCompany: entry.employee.isTaxBorneByCompany` to PayslipData.
- Employee relation already included in the query (`include: { employee: ... }`).

**PDF rendering (`payslip-pdf.tsx`)**
- Destructured `isTaxBorneByCompany` from data.
- Potongan section (PPh 21 row):
  - Label: `"PPh 21"` or `"PPh 21 (Ditanggung Perusahaan)"`
  - Amount: `formatRupiah(pph21)` or `formatRupiah(0)`
- Kontribusi Perusahaan section:
  - Conditional row after JKM: `"PPh 21 (Ditanggung)"` with full pph21 amount.
  - Only rendered when `isTaxBorneByCompany === true`.

### Visual Comparison

**Normal employee payslip (isTaxBorneByCompany=false):**
```
Potongan Karyawan
  BPJS Kesehatan (Karyawan)    Rp 80.000
  JHT Karyawan                 Rp 136.000
  JP Karyawan                  Rp 68.000
  PPh 21                       Rp 904.860
  Total Potongan               Rp 1.188.860

Kontribusi Perusahaan — Informasi
  BPJS Kesehatan (Perusahaan)  Rp 320.000
  JHT Perusahaan               Rp 272.000
  JP Perusahaan                Rp 136.000
  JKK                          Rp 32.640
  JKM                          Rp 40.800
```

**Company-borne tax employee payslip (isTaxBorneByCompany=true):**
```
Potongan Karyawan
  BPJS Kesehatan (Karyawan)    Rp 80.000
  JHT Karyawan                 Rp 136.000
  JP Karyawan                  Rp 68.000
  PPh 21 (Ditanggung Perusahaan)  Rp 0
  Total Potongan               Rp 284.000

Kontribusi Perusahaan — Informasi
  BPJS Kesehatan (Perusahaan)  Rp 320.000
  JHT Perusahaan               Rp 272.000
  JP Perusahaan                Rp 136.000
  JKK                          Rp 32.640
  JKM                          Rp 40.800
  PPh 21 (Ditanggung)          Rp 904.860
```

## Type Check

`npx tsc --noEmit` passes — 0 errors in modified files (1 pre-existing error in
unrelated recruitment file: add-candidate-wrapper.tsx TS2322).
