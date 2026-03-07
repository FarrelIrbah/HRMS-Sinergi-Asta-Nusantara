---
phase: 04-payroll-management
plan: "07"
subsystem: payroll
tags: [thr, permenaker, date-fns, decimal.js, prisma, next.js, server-actions]

# Dependency graph
requires:
  - phase: 04-03
    provides: PayrollEntry schema with thrAmount field, EmployeeAllowance.isFixed flag
  - phase: 04-01
    provides: payroll calculation patterns, Decimal.js usage, PayrollRun/PayrollEntry models
provides:
  - THR pure calculation service (thr.service.ts) with Permenaker 6/2016 logic
  - /payroll/thr HR Admin page with employee eligibility table
  - addTHRToPayrollAction to append THR into existing DRAFT PayrollEntry rows
affects:
  - 04-08 (plan 08 — payslip view will display thrAmount from PayrollEntry)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Pure calculation service with no DB imports (same pattern as bpjs.service.ts, pph21.service.ts)
    - Server page fetches + calculates, passes serialized results to client table component
    - Client form component calls server action via direct import (same as run-payroll-form.tsx)

key-files:
  created:
    - src/lib/services/thr.service.ts
    - src/app/(dashboard)/payroll/thr/page.tsx
    - src/app/(dashboard)/payroll/thr/_components/thr-table.tsx
    - src/app/(dashboard)/payroll/thr/_components/add-thr-form.tsx
  modified:
    - src/lib/actions/payroll.actions.ts

key-decisions:
  - "THR basis uses isFixed=true allowances only (Permenaker 6/2016) — same BPJS basis pattern"
  - "referenceDate for page display = new Date() (today); for action = first day of selected month"
  - "Employees without agama field recorded are skipped (calculationNote explains why)"
  - "AddTHRForm is a separate client component rather than inline to keep page.tsx a clean server component"

patterns-established:
  - "THR service: pure function module, no Prisma imports, only Decimal + date-fns + enums"
  - "addTHRToPayrollAction guards: run not found → error, FINALIZED → error; only DRAFT allowed"

# Metrics
duration: 4min
completed: 2026-03-07
---

# Phase 4 Plan 07: THR Calculation Service and HR Admin THR Page Summary

**THR calculation service (Permenaker 6/2016) with eligibility table at /payroll/thr and addTHRToPayrollAction that appends thr/gross/net to DRAFT PayrollEntry rows**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-07T13:00:05Z
- **Completed:** 2026-03-07T13:03:52Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Pure calculation service `thr.service.ts` handles all three Permenaker 6/2016 tiers (≥12 months, 1–11 months prorated, <1 month not eligible)
- RELIGION_HOLIDAY_MAP covers all 6 Indonesian religion enum values (ISLAM, KRISTEN, KATOLIK, HINDU, BUDDHA, KONGHUCU)
- `/payroll/thr` server page with eligibility table showing NIK, Nama, Agama, Hari Raya, Masa Kerja, THR Amount, Status badge, and Keterangan
- `addTHRToPayrollAction` safely appends THR (thrAmount + grossPay + netPay delta) to DRAFT entries, guarded against FINALIZED runs

## Task Commits

Each task was committed atomically:

1. **Task 1: Create thr.service.ts with pure THR calculation logic** - `305f8de` (feat)
2. **Task 2: THR page and addTHRToPayrollAction** - `ebad4e5` (feat)

## Files Created/Modified

- `src/lib/services/thr.service.ts` - Pure THR calculation (no DB), RELIGION_HOLIDAY_MAP, calculateEmployeeTHR
- `src/app/(dashboard)/payroll/thr/page.tsx` - Server page: auth check, employee fetch, THR calc, summary
- `src/app/(dashboard)/payroll/thr/_components/thr-table.tsx` - Client DataTable: 8 columns, Berhak/Tidak Berhak badges, muted ineligible rows
- `src/app/(dashboard)/payroll/thr/_components/add-thr-form.tsx` - Client form: month/year selects, calls addTHRToPayrollAction
- `src/lib/actions/payroll.actions.ts` - Appended addTHRToPayrollAction + calculateTHRSchema import

## Decisions Made

- **THR basis = isFixed=true allowances only**: Matches Permenaker 6/2016 and mirrors BPJS basis (Decision #52 pattern); non-fixed allowances excluded
- **referenceDate for page = today, for action = first of payroll month**: Display shows current eligibility; action uses consistent reference point matching runPayroll pattern
- **Employees without agama skipped gracefully**: Returns "—" holiday with ineligible status and explanatory note rather than crashing; covers employees added before Phase 2 agama field was populated
- **Separate AddTHRForm client component**: Keeps page.tsx a pure server component; follows existing run-payroll-form.tsx separation pattern

## Deviations from Plan

None — plan executed exactly as written. The `calculateTHRSchema` was already present in `src/lib/validations/payroll.ts` (added in a prior plan). Religion field on Employee is `agama` as verified from schema.prisma. PayrollRun unique constraint `month_year` confirmed from payroll.service.ts existing usage.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `thrAmount` field on PayrollEntry is populated by `addTHRToPayrollAction`; plan 04-08 (payslip) can read it directly
- THR calculation is separate from the main payroll run — HR Admin workflow: (1) run payroll for month, (2) navigate to /payroll/thr, (3) add THR to that month's run
- No blockers for plan 04-08

---
*Phase: 04-payroll-management*
*Completed: 2026-03-07*
