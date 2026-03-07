---
phase: 04-payroll-management
plan: "01"
subsystem: database
tags: [prisma, decimal.js, postgresql, zod, payroll, bpjs, pph21, ter]

# Dependency graph
requires:
  - phase: 03-attendance-leave-management
    provides: AttendanceRecord model with overtimeMinutes, lateMinutes fields used in payroll deduction calculation
  - phase: 02-employee-data-management
    provides: Employee model, PTKPStatus enum, ptkpStatus field used for TER category lookup
provides:
  - PayrollStatus enum (DRAFT, FINALIZED) in schema and client-safe enums
  - Employee.baseSalary: Decimal(15,2) field with default 0
  - EmployeeAllowance model for per-employee fixed/variable allowances
  - PayrollRun model with unique [month, year] constraint and status tracking
  - PayrollEntry snapshot model storing all calculation fields at run time
  - BPJS_RATES constants with verified 2025/2026 rates and salary caps
  - PTKP_ANNUAL values for all 8 PTKPStatus categories
  - TER_CATEGORY mapping and TER_TABLE_A/B/C (PP 58/2023 full tables)
  - PPH21_PROGRESSIVE_BRACKETS for December annualization
  - BIAYA_JABATAN_RATE and BIAYA_JABATAN_MAX
  - Zod schemas: runPayrollSchema, finalizePayrollSchema, calculateTHRSchema, updateEmployeeSalarySchema
affects:
  - 04-02 (pph21 calculation service depends on TER tables and PTKP values)
  - 04-03 (payroll runner uses PayrollRun, PayrollEntry, BPJS_RATES)
  - 04-04 (salary management UI uses EmployeeAllowance and updateEmployeeSalarySchema)
  - 04-05 through 04-08 (all payroll plans depend on schema and constants)

# Tech tracking
tech-stack:
  added: [decimal.js]
  patterns:
    - Payroll constants use new Decimal() instances for type-safe monetary arithmetic
    - TER tables are [upperLimit, ratePercent][] arrays — lookup by finding first entry where gross <= upperLimit
    - PayrollEntry uses snapshot approach — all values stored at calculation time, not recomputed
    - Client-safe PayrollStatus follows same const+type pattern as all other enums in types/enums.ts

key-files:
  created:
    - src/lib/validations/payroll.ts
    - prisma/migrations/20260307120948_add_payroll_models/migration.sql
  modified:
    - prisma/schema.prisma
    - src/types/enums.ts
    - src/lib/constants.ts
    - package.json
    - package-lock.json

key-decisions:
  - "decimal.js imported at top of constants.ts and used for all monetary rate/cap constants"
  - "PayrollEntry uses snapshot pattern — all calculation fields stored at run time, not foreign-key references to rates"
  - "TER_TABLE_C row 8 anomaly (10,950,000-11,200,000 = 1.75% is lower than row 7's 2%) preserved as-is from PP 58/2023"

patterns-established:
  - "Payroll constants pattern: import Decimal from decimal.js, use new Decimal('string') for exact values"
  - "TER lookup pattern: find first [limit, rate] tuple where gross <= limit"
  - "Snapshot payroll entry: all fields (baseSalary, bpjsKesEmp, pph21, etc.) stored in PayrollEntry at calculation time"

# Metrics
duration: 8min
completed: 2026-03-07
---

# Phase 4 Plan 01: Payroll Foundation Summary

**Prisma schema extended with PayrollRun/PayrollEntry/EmployeeAllowance models, decimal.js installed, and complete Indonesian regulatory constants (TER tables A/B/C, BPJS rates, PTKP values) codified as typed constants.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-07T12:06:06Z
- **Completed:** 2026-03-07T12:13:47Z
- **Tasks:** 2/2
- **Files modified:** 7

## Accomplishments

- Installed decimal.js and applied Prisma migration `20260307120948_add_payroll_models` to hrms_ptsan database
- Added PayrollRun, PayrollEntry, EmployeeAllowance models and Employee.baseSalary field; Prisma client regenerated
- Codified complete TER tables A/B/C (PP 58/2023), BPJS rates (2025 caps), PTKP annual values, and PPh 21 progressive brackets in constants.ts with Decimal types
- Created payroll Zod schemas (runPayrollSchema, finalizePayrollSchema, calculateTHRSchema, updateEmployeeSalarySchema)
- Added client-safe PayrollStatus enum to src/types/enums.ts

## Task Commits

Each task was committed atomically:

1. **Task 1: Install decimal.js and extend Prisma schema with payroll models** - `502ae8d` (feat)
2. **Task 2: Add PayrollStatus enum, constants, and Zod schemas** - `488ee98` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `prisma/schema.prisma` - Added PayrollStatus enum, Employee.baseSalary, EmployeeAllowance, PayrollRun, PayrollEntry models
- `prisma/migrations/20260307120948_add_payroll_models/migration.sql` - Applied migration creating 3 new tables and altering employees table
- `src/types/enums.ts` - Added PayrollStatus const and type
- `src/lib/constants.ts` - Added Decimal import, BPJS_RATES, PTKP_ANNUAL, TER_CATEGORY, TER_TABLE_A/B/C, PPH21_PROGRESSIVE_BRACKETS, BIAYA_JABATAN_RATE/MAX
- `src/lib/validations/payroll.ts` - Created with 4 Zod schemas and inferred types
- `package.json` - Added decimal.js dependency
- `package-lock.json` - Updated lock file

## Decisions Made

- **Snapshot approach for PayrollEntry**: All calculation values (baseSalary, bpjsKesEmp, pph21, netPay, etc.) stored at calculation time rather than recomputed from live rates. This ensures payslip history is immutable and audit-safe even if rates change.
- **TER_TABLE_C row 8 anomaly preserved**: Row 8 (10,950,000–11,200,000) shows 1.75%, which is lower than row 7's 2%. This matches the official PP 58/2023 Lampiran verbatim and is noted with a comment. Future plan 04-02 must handle non-monotonic TER tables.
- **decimal.js imported in constants.ts**: All monetary constants use `new Decimal("string")` for exact representation, avoiding floating-point errors in rate calculations.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Docker Desktop not running — started automatically**

- **Found during:** Task 1 (Prisma migrate dev)
- **Issue:** `prisma migrate dev` failed with P1001 (can't reach localhost:5432); Docker Desktop was not running
- **Fix:** Launched Docker Desktop via PowerShell, waited for cms-postgres container to reach healthy status, then reran migration
- **Files modified:** None (infrastructure only)
- **Verification:** `docker inspect --format='{{.State.Health.Status}}' cms-postgres` returned "healthy"; migration applied successfully
- **Committed in:** 502ae8d (part of Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — Docker not running)
**Impact on plan:** Required starting Docker Desktop. No scope change, no new files.

## Issues Encountered

- Docker Desktop was not running at execution start. Launched automatically. cms-postgres container started within ~15 seconds and reached healthy status. No data loss.

## User Setup Required

None - no external service configuration required. Docker container (cms-postgres) was already configured in prior phases.

## Next Phase Readiness

- Schema foundation complete: PayrollRun, PayrollEntry, EmployeeAllowance all exist in database
- Employee.baseSalary field available (default 0) — all existing employees have Rp 0 salary until populated via Plan 04-04 (salary management UI)
- All regulatory constants available at `@/lib/constants` for Plan 04-02 (PPh 21 calculation engine)
- Zod schemas available at `@/lib/validations/payroll` for Plan 04-03 (payroll runner server actions)
- TypeScript compiles cleanly with no new errors

---
*Phase: 04-payroll-management*
*Completed: 2026-03-07*
