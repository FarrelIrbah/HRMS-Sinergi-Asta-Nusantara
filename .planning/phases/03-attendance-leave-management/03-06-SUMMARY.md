---
phase: 03-attendance-leave-management
plan: 06
subsystem: ui
tags: [nextjs, prisma, nuqs, react-hook-form, zod, lucide-react, date-fns]

# Dependency graph
requires:
  - phase: 03-attendance-leave-management/03-01
    provides: attendance schema (AttendanceRecord model) with isManualOverride, overrideReason fields
  - phase: 03-attendance-leave-management/03-03
    provides: manualOverrideAction server action and manualAttendanceSchema validation
  - phase: 03-attendance-leave-management/03-04
    provides: getMonthlyAttendanceRecap service function and base sidebar with Absensi/Cuti links
provides:
  - /attendance-admin page with role-scoped monthly recap table
  - /attendance-admin/[employeeId] per-employee daily drill-down page
  - ManualRecordDialog component for HR Admin override
  - AttendanceFilters component with nuqs month/year selectors
  - Admin Absensi and Kelola Cuti sidebar nav items for HR_ADMIN/SUPER_ADMIN/MANAGER
affects:
  - 03-07-leave-management (Kelola Cuti nav item points to /leave/manage built by 03-07)
  - 04-payroll (monthly recap data structure used for payroll calculations)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server page grouping attendance records with Map<employeeId, {employee, records[]}>
    - Role-scoped data fetching: Manager sees only own department, HR Admin sees all
    - Manager cross-department access guard on drill-down page (redirect if wrong dept)
    - ManualRecordDialog reused in both admin page header and per-row context

key-files:
  created:
    - src/app/(dashboard)/attendance-admin/page.tsx
    - src/app/(dashboard)/attendance-admin/[employeeId]/page.tsx
    - src/app/(dashboard)/attendance-admin/_components/attendance-filters.tsx
    - src/app/(dashboard)/attendance-admin/_components/attendance-summary-table.tsx
    - src/app/(dashboard)/attendance-admin/_components/manual-record-dialog.tsx
  modified:
    - src/components/layout/sidebar.tsx

key-decisions:
  - "ManualRecordDialog created in Task 1 commit (not Task 2) because attendance-summary-table.tsx imports it — avoids tsc failure between tasks"
  - "Resolver<ManualAttendanceInput> single cast pattern (not ReturnType<typeof zodResolver>) matches project convention for coerce.date() schemas"
  - "clockOut Input uses value={field.value ?? ''} to handle undefined from optional schema field"

patterns-established:
  - "Admin route pattern: auth check + role guard + optional dept scoping all in server page component"
  - "Dynamic [employeeId] route with Manager cross-dept redirect guard before data fetch"

# Metrics
duration: 15min
completed: 2026-03-06
---

# Phase 3 Plan 6: Attendance Admin View Summary

**Role-scoped monthly attendance recap at /attendance-admin with per-employee drill-down, manual override dialog, and Admin Absensi + Kelola Cuti sidebar links for HR_ADMIN/SUPER_ADMIN/MANAGER**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-06T08:00:00Z
- **Completed:** 2026-03-06T08:15:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Monthly attendance recap grouped by employee with aggregated metrics (present days, late count, total hours, overtime) at /attendance-admin
- Manager role-scoping: fetches only own department's records; blocks cross-department access on drill-down
- Per-employee daily detail page at /attendance-admin/[employeeId] showing clock-in/out, status badges, Manual override badge
- ManualRecordDialog (HR Admin only): date picker, time inputs, employee selector, reason textarea — calls existing manualOverrideAction
- Sidebar updated with Admin Absensi (ClipboardList) and Kelola Cuti (CheckSquare) links restricted to non-Employee roles

## Task Commits

Each task was committed atomically:

1. **Task 1: Attendance admin page, filters, summary table, sidebar update** - `cd53b9c` (feat)
2. **Task 2: Per-employee drill-down page** - `01d59e7` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/components/layout/sidebar.tsx` - Added ClipboardList/CheckSquare icons; Admin Absensi and Kelola Cuti nav items
- `src/app/(dashboard)/attendance-admin/page.tsx` - Server page: auth, role guard, dept scoping, grouped data, renders table + dialog
- `src/app/(dashboard)/attendance-admin/_components/attendance-filters.tsx` - Client component: nuqs month/year selectors
- `src/app/(dashboard)/attendance-admin/_components/attendance-summary-table.tsx` - Table with per-employee aggregated row + Detail link + inline ManualRecordDialog
- `src/app/(dashboard)/attendance-admin/_components/manual-record-dialog.tsx` - HR Admin dialog: employee select, date picker, clock-in/out time inputs, reason
- `src/app/(dashboard)/attendance-admin/[employeeId]/page.tsx` - Daily records table with status/Manual badges; Manager cross-dept redirect guard

## Decisions Made

- ManualRecordDialog was created as part of the Task 1 commit (even though the plan lists it under Task 2) because `attendance-summary-table.tsx` imports it — necessary to keep tsc clean between tasks
- Used `Resolver<ManualAttendanceInput>` single cast for zodResolver (matching Decision 36 from 03-05 — established project pattern for coerce.date() schemas)
- Added `value={field.value ?? ''}` on clockOut Input to handle `undefined` coming from the optional schema field — prevents React uncontrolled/controlled warning

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] clockOut Input value coercion for optional field**
- **Found during:** Task 1 (ManualRecordDialog creation)
- **Issue:** `manualAttendanceSchema.clockOut` is `string | undefined`; passing `undefined` to `<Input>` switches it from controlled to uncontrolled
- **Fix:** Added `value={field.value ?? ''}` on the clockOut Input
- **Files modified:** `src/app/(dashboard)/attendance-admin/_components/manual-record-dialog.tsx`
- **Verification:** tsc passes; no React controlled/uncontrolled warning
- **Committed in:** cd53b9c (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor fix for React controlled input correctness. No scope creep.

## Issues Encountered

None — plan executed smoothly. tsc passed cleanly after both tasks.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- /attendance-admin and /attendance-admin/[employeeId] are complete and ready
- /leave/manage route referenced by the Kelola Cuti sidebar link is built by plan 03-07
- Monthly recap service (getMonthlyAttendanceRecap) is available for Phase 4 payroll calculations

---
*Phase: 03-attendance-leave-management*
*Completed: 2026-03-06*
