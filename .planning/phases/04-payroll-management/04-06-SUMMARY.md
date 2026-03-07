---
phase: 04-payroll-management
plan: "06"
subsystem: api
tags: [xlsx, excel, export, payroll, route-handler, next-js]

# Dependency graph
requires:
  - phase: 04-04
    provides: payroll-entry-table.tsx component with runId prop and PayrollRun data
  - phase: 04-03
    provides: PayrollRun/PayrollEntry Prisma models with all salary/BPJS/PPh21 fields
provides:
  - GET /api/payroll-report?runId=[id] — Excel export route returning .xlsx with all payroll columns
  - Excel download button in payroll period detail page for HR Admin roles
affects: [05-recruitment-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - XLSX aoa_to_sheet with header + data rows + totals row
    - Uint8Array buffer wrapping for Next.js Route Handler Response (established in 03-08)
    - Role-gated download button using isHRAdmin prop passed from server page

key-files:
  created:
    - src/app/api/payroll-report/route.ts
  modified:
    - src/app/(dashboard)/payroll/[periodId]/_components/payroll-entry-table.tsx
    - src/app/(dashboard)/payroll/[periodId]/page.tsx

key-decisions:
  - "isHRAdmin prop passed from server page rather than client-side useSession() — stays consistent with server-component auth pattern"
  - "runId prop was already declared in PayrollEntryTableProps but aliased _runId (unused); Task 2 activated it for the download link"
  - "Uint8Array(buf) wrapping follows Decision 43 (established 03-08) for Web API BodyInit compatibility"

patterns-established:
  - "Payroll Excel export: aoa_to_sheet with title row, status row, blank row, headers, data rows, totals row"

# Metrics
duration: 2min
completed: 2026-03-07
---

# Phase 4 Plan 06: Payroll Summary Excel Export Summary

**GET /api/payroll-report route with 19-column Excel workbook (employee breakdown + employer BPJS) and HR-gated download button on period detail page**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-07T12:54:23Z
- **Completed:** 2026-03-07T12:56:49Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Payroll summary Excel export API route at `/api/payroll-report?runId=[id]` — restricted to HR_ADMIN/SUPER_ADMIN
- Excel workbook with 19 columns: No, NIK, Name, baseSalary, allowances, overtime, THR, grossPay, BPJS employee (Kes/JHT/JP), PPh21, totalDeductions, netPay, BPJS employer (Kes/JHT/JP/JKK/JKM)
- Totals row summing all numeric columns appended after data rows
- "Unduh Rekap Excel" button with FileSpreadsheet icon added to period detail page, visible only for HR roles

## Task Commits

Each task was committed atomically:

1. **Task 1: Create payroll summary Excel export API route** - `3b85084` (feat)
2. **Task 2: Add Excel download button to period detail page** - `d3602b9` (feat)

**Plan metadata:** see final commit below

## Files Created/Modified
- `src/app/api/payroll-report/route.ts` — Excel export route handler with auth guard, Prisma query, aoa_to_sheet workbook, Uint8Array response
- `src/app/(dashboard)/payroll/[periodId]/_components/payroll-entry-table.tsx` — added isHRAdmin prop, activated runId for download href, added FileSpreadsheet download button toolbar
- `src/app/(dashboard)/payroll/[periodId]/page.tsx` — passes isHRAdmin={["HR_ADMIN","SUPER_ADMIN"].includes(role)} to PayrollEntryTable

## Decisions Made
- `isHRAdmin` prop is derived server-side in the page component from `session.user.role` and passed down — avoids a client-side `useSession()` call in a client component that already receives all needed data as props.
- `runId` prop was already declared in `PayrollEntryTableProps` (from plan 04-04) but aliased as `_runId` since the download column used entry-level IDs for payslips. Task 2 activated it for the run-level Excel export link.
- Follows Decision 43 (03-08): `new Uint8Array(buf)` wrapping required for Web API `BodyInit` compatibility in Route Handlers.

## Deviations from Plan

None - plan executed exactly as written.

The plan scaffold showed `import { auth } from "@/auth"` but the project uses `import { auth } from "@/lib/auth"` (consistent with all other API routes including attendance/export). Applied the correct import path automatically.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PAY-08 (monthly payroll summary report download) is now fully implemented
- Remaining Phase 4 plans: 04-07 and 04-08
- Phase 5 (Recruitment Management) ready to start after Phase 4 completes

---
*Phase: 04-payroll-management*
*Completed: 2026-03-07*
