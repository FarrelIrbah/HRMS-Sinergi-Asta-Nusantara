---
phase: 04-payroll-management
plan: "04"
subsystem: ui
tags: [nextjs, react, react-hook-form, zod, tanstack-table, shadcn, payroll]

# Dependency graph
requires:
  - phase: 04-03
    provides: runPayrollAction, finalizePayrollAction, getPayrollRuns, getPayrollRunDetail in payroll.service.ts + payroll.actions.ts
provides:
  - /payroll list page with RunPayrollForm for initiating monthly payroll runs
  - /payroll/[periodId] detail page with serialized entry table and finalize action
  - PayrollEntryTable with Rupiah formatting, search, and payslip download column
  - FinalizeButton with ConfirmDialog gate before locking a run
affects: [04-05, 04-06, 04-07, 04-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Prisma Decimal serialized to number in server component before passing to client components
    - Resolver<FormValues> single cast for z.coerce.number() schema (matches Decision 36 pattern)
    - PayrollEntryTable columns built in factory function parameterised by runStatus
    - ConfirmDialog (shared/confirm-dialog.tsx) reused for finalization gate

key-files:
  created:
    - src/app/(dashboard)/payroll/page.tsx
    - src/app/(dashboard)/payroll/_components/run-payroll-form.tsx
    - src/app/(dashboard)/payroll/[periodId]/page.tsx
    - src/app/(dashboard)/payroll/[periodId]/_components/payroll-entry-table.tsx
    - src/app/(dashboard)/payroll/[periodId]/_components/finalize-button.tsx
  modified: []

key-decisions:
  - "Resolver<FormValues> single cast for z.coerce.number() schema — matches Decision 36 convention"
  - "Payslip download uses asChild + anchor tag when FINALIZED; span when DRAFT (avoids nested <a> inside <button>)"
  - "Summary totals (gross, deductions, net) computed server-side by summing serialized entries — no extra DB query"
  - "searchKey set to employeeName; DataTable search also matches NIK column via user typing (user can find by partial name)"

patterns-established:
  - "Decimal serialization: Number(e.fieldName) for all Prisma Decimal fields before crossing server/client boundary"
  - "Period label helper: MONTH_LABELS[month-1] + year, defined as module-level constant"
  - "Auth guard in payroll pages: HR_ADMIN and SUPER_ADMIN only; redirect to /dashboard on unauthorized"

# Metrics
duration: 3min
completed: 2026-03-07
---

# Phase 4 Plan 04: Payroll Management UI Summary

**HR Admin payroll management UI: /payroll list page with run form, and /payroll/[periodId] detail page with entry table, summary cards, and ConfirmDialog-gated finalize button**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-07T12:39:39Z
- **Completed:** 2026-03-07T12:42:38Z
- **Tasks:** 2
- **Files modified:** 5 created

## Accomplishments

- Built /payroll server page that lists all payroll runs with period label, status badge (Draft/Difinalisasi), and employee count
- Built RunPayrollForm client component with month/year selects, zodResolver with coerce.number, and redirect to detail page on success
- Built /payroll/[periodId] server page with Prisma Decimal serialization, summary totals, and full entry table
- Built PayrollEntryTable (DataTable-based) with 10 columns, Rupiah formatting, and payslip download button gated by FINALIZED status
- Built FinalizeButton with ConfirmDialog — prevents accidental finalization; router.refresh() on success

## Task Commits

1. **Task 1: Payroll list page with run-payroll form** - `9464b26` (feat)
2. **Task 2: Payroll period detail page with entry table and finalize button** - `1195cf0` (feat)

## Files Created/Modified

- `src/app/(dashboard)/payroll/page.tsx` - Server page: auth guard, getPayrollRuns, run table + RunPayrollForm
- `src/app/(dashboard)/payroll/_components/run-payroll-form.tsx` - Client form: month/year selects, runPayrollAction, redirect to detail
- `src/app/(dashboard)/payroll/[periodId]/page.tsx` - Server page: auth guard, getPayrollRunDetail, serializes Decimal, summary cards, entry table
- `src/app/(dashboard)/payroll/[periodId]/_components/payroll-entry-table.tsx` - DataTable with Rupiah formatting, payslip download column
- `src/app/(dashboard)/payroll/[periodId]/_components/finalize-button.tsx` - ConfirmDialog-gated button calling finalizePayrollAction

## Decisions Made

- **Resolver cast:** Used `zodResolver(formSchema) as Resolver<FormValues>` (single cast) for z.coerce.number() schema — matches Decision 36 pattern from Phase 3. The `as ReturnType<typeof zodResolver>` intermediate cast does not work with coerce schemas.
- **Payslip download:** Button uses `asChild + <a>` when FINALIZED; renders `<span>` when DRAFT to avoid invalid nested anchor elements. Both paths are wrapped in a `<Button>` with `disabled` when not finalized.
- **Summary totals:** Computed server-side by summing serialized entry numbers — no additional DB aggregate query needed since entries are already fetched for the table.
- **Search column:** `searchKey="employeeName"` used for DataTable search input — users typically search by name; NIK is visible in the adjacent column for cross-reference.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed zodResolver cast for coerce.number() schema**

- **Found during:** Task 1 (TypeScript check after writing run-payroll-form.tsx)
- **Issue:** `as ReturnType<typeof zodResolver>` cast fails with z.coerce.number() — TS2322 because the intermediate type still uses `unknown` for the output type, making it incompatible with `useForm<FormValues>`
- **Fix:** Changed to `zodResolver(formSchema) as Resolver<FormValues>` — single cast matches the established project pattern (Decisions 36, 41)
- **Files modified:** src/app/(dashboard)/payroll/_components/run-payroll-form.tsx
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** 9464b26 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — TypeScript resolver cast)
**Impact on plan:** Necessary for TypeScript correctness; follows established project pattern. No scope creep.

## Issues Encountered

None beyond the resolver cast fix documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- /payroll and /payroll/[periodId] pages are fully functional
- Payslip download links point to /api/payroll/payslip/[entryId] — this route must be built in Plan 05 (payslip PDF generation)
- FINALIZED runs are locked; DRAFT runs can be re-run (recalculated)
- THR column is present in the table (shows 0 until THR calculation is wired — Plan 06 or later)
- Navigation sidebar may need a "Penggajian" link added (check sidebar config in Phase 4 Plan 05 or earlier)

---
*Phase: 04-payroll-management*
*Completed: 2026-03-07*
