---
phase: 04-payroll-management
plan: "03"
subsystem: payroll
tags: [prisma, decimal.js, payroll, bpjs, pph21, next.js, react-hook-form, server-actions]

# Dependency graph
requires:
  - phase: 04-01
    provides: PayrollRun/PayrollEntry/EmployeeAllowance schema, Zod validations, decimal.js
  - phase: 04-02
    provides: calculateBPJS (bpjs.service.ts), calculateMonthlyPPh21, calculateDecemberPPh21 (pph21.service.ts)
provides:
  - payroll.service.ts: runPayroll batch engine, finalizePayroll, getPayrollRuns, getPayrollRunDetail
  - payroll.actions.ts: server actions wrapping payroll service + updateEmployeeSalaryAction
  - Gaji & Tunjangan tab on employee profile page (HR_ADMIN/SUPER_ADMIN only)
affects:
  - 04-04 (payroll UI pages — consumes getPayrollRuns, getPayrollRunDetail, runPayrollAction, finalizePayrollAction)
  - 04-05 (payslip PDF — reads PayrollEntry data from finalized runs)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Batch payroll engine: serial per-employee loop to allow December DB fetch within same transaction scope"
    - "Absence detection via AttendanceRecord.clockIn IS NULL (no ABSENT enum in AttendanceStatus)"
    - "PayrollRun upsert pattern with month_year unique constraint for idempotent re-runs"
    - "salary-tab uses useFieldArray for dynamic allowances with native checkbox (no shadcn Checkbox)"
    - "salaryData passed as optional prop to EmployeeProfileTabs; tab hidden when undefined"

key-files:
  created:
    - src/lib/services/payroll.service.ts
    - src/lib/actions/payroll.actions.ts
    - src/app/(dashboard)/employees/[id]/_components/salary-tab.tsx
  modified:
    - src/app/(dashboard)/employees/[id]/_components/employee-profile-tabs.tsx
    - src/app/(dashboard)/employees/[id]/page.tsx

key-decisions:
  - "Absence = AttendanceRecord.clockIn IS NULL (no ABSENT status in schema; AttendanceStatus has ON_TIME/LATE/EARLY_OUT/OVERTIME variants only)"
  - "requireHRAdmin() defined locally in payroll.actions.ts (no auth-utils.ts file exists; pattern from employee.actions.ts)"
  - "shadcn Checkbox not installed; replaced with native <input type='checkbox'> in salary-tab"
  - "salaryData fetched in page.tsx server component and passed as optional prop to EmployeeProfileTabs"
  - "Gaji & Tunjangan tab conditional on salaryData prop presence (only HR_ADMIN/SUPER_ADMIN see it)"

patterns-established:
  - "Payroll batch engine: fetch employees, loop serially, accumulate EntryData[], upsert run, delete old entries, createMany"
  - "December true-up queries prior PayrollEntries within same year where month < 12"

# Metrics
duration: 9min
completed: 2026-03-07
---

# Phase 4 Plan 03: Payroll Batch Engine and Salary Tab Summary

**Batch payroll engine (runPayroll) orchestrating BPJS + PPh 21 across all active employees with snapshot writes to PayrollEntry, plus Gaji & Tunjangan HR tab on employee profile**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-07T12:25:36Z
- **Completed:** 2026-03-07T12:34:29Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- `runPayroll(month, year)`: fetches all active employees, computes BPJS and PPh 21 for each, upserts DRAFT PayrollRun, bulk-inserts PayrollEntry snapshots — idempotent via delete-before-reinsert on DRAFT re-runs
- `finalizePayroll(id)`: locks DRAFT to FINALIZED; subsequent runPayroll calls throw "Payroll sudah difinalisasi"
- `updateEmployeeSalaryAction`: HR Admin can save baseSalary and replace allowances list atomically (deleteMany + createMany)
- Employee profile gains "Gaji & Tunjangan" tab for HR_ADMIN/SUPER_ADMIN with useFieldArray dynamic allowances form

## Task Commits

Each task was committed atomically:

1. **Task 1: Create payroll.service.ts batch calculation engine** - `1629b43` (feat)
2. **Task 2: Create payroll.actions.ts and add Gaji/Tunjangan tab** - `6d82b5b` (feat)

**Plan metadata:** TBD (docs commit)

## Files Created/Modified

- `src/lib/services/payroll.service.ts` — Batch engine: runPayroll, finalizePayroll, getPayrollRuns, getPayrollRunDetail
- `src/lib/actions/payroll.actions.ts` — Server actions with requireHRAdmin: runPayrollAction, finalizePayrollAction, updateEmployeeSalaryAction
- `src/app/(dashboard)/employees/[id]/_components/salary-tab.tsx` — Client form for baseSalary + dynamic allowances
- `src/app/(dashboard)/employees/[id]/_components/employee-profile-tabs.tsx` — Added SalaryTab import and optional salaryData prop
- `src/app/(dashboard)/employees/[id]/page.tsx` — Fetches salary data for HR roles, passes to EmployeeProfileTabs

## Decisions Made

| # | Decision | Rationale |
|---|----------|-----------|
| 54 | Absence = AttendanceRecord.clockIn IS NULL | AttendanceStatus enum has no ABSENT value; admin-created absent records have no clockIn |
| 55 | requireHRAdmin() defined locally in payroll.actions.ts | No auth-utils.ts exists; employee.actions.ts also defines it locally |
| 56 | Native `<input type="checkbox">` for isFixed | shadcn Checkbox component not installed in this project |
| 57 | salaryData prop optional on EmployeeProfileTabs | Tab hidden for EMPLOYEE/MANAGER; shown only when prop passed (HR roles) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] AttendanceStatus has no ABSENT value**
- **Found during:** Task 1 (payroll.service.ts)
- **Issue:** Plan specified counting records with `status = "ABSENT"` but AttendanceStatus enum has no ABSENT — values are ON_TIME, LATE, EARLY_OUT, OVERTIME, LATE_AND_EARLY_OUT, LATE_AND_OVERTIME. AttendanceRecord also has no status column.
- **Fix:** Count records where `clockIn IS NULL` instead (admin-marked absent records have no clock-in)
- **Files modified:** src/lib/services/payroll.service.ts
- **Verification:** TypeScript compiles cleanly; logic is semantically correct
- **Committed in:** 1629b43 (Task 1 commit)

**2. [Rule 3 - Blocking] requireHRAdmin import path does not exist**
- **Found during:** Task 2 (payroll.actions.ts)
- **Issue:** Plan referenced `@/lib/auth-utils` but no such file exists; employee.actions.ts defines requireHRAdmin locally
- **Fix:** Defined requireHRAdmin locally following exact employee.actions.ts pattern
- **Files modified:** src/lib/actions/payroll.actions.ts
- **Verification:** TypeScript compiles; same auth logic as established pattern
- **Committed in:** 6d82b5b (Task 2 commit)

**3. [Rule 3 - Blocking] shadcn Checkbox not installed**
- **Found during:** Task 2 (salary-tab.tsx)
- **Issue:** `@/components/ui/checkbox` does not exist; TypeScript error TS2307
- **Fix:** Replaced `<Checkbox>` with native `<input type="checkbox">` with Tailwind styling
- **Files modified:** src/app/(dashboard)/employees/[id]/_components/salary-tab.tsx
- **Verification:** TypeScript compiles; renders as standard checkbox
- **Committed in:** 6d82b5b (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All fixes required for correct compilation and semantically correct behavior. No scope creep.

## Issues Encountered

None beyond the above deviations.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- payroll.service.ts is ready for Plan 04 (payroll UI pages) to call runPayrollAction and finalizePayrollAction
- getPayrollRuns() and getPayrollRunDetail() ready for list/detail pages
- Plan 05 (THR) can call updateEmployeeSalaryAction for salary management
- Gaji & Tunjangan tab functional and ready for testing once DB migration is applied
- December true-up logic depends on prior month PayrollEntries existing in DB (correct behavior; first Dec run with no prior entries will use 0 for Jan-Nov accumulated values)

---
*Phase: 04-payroll-management*
*Completed: 2026-03-07*
