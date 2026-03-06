---
phase: 03-attendance-leave-management
plan: 09
subsystem: ui, database
tags: [nextjs, prisma, dashboard, leave-report, attendance, seed-data]

requires:
  - phase: 03-07
    provides: leave approval workflow, getLeaveRequests service
  - phase: 03-08
    provides: attendance export API, attendance admin view

provides:
  - Leave usage report page at /leave/report (HR Admin only)
  - Sidebar "Laporan Cuti" nav item for HR_ADMIN and SUPER_ADMIN
  - pendingLeaveCount and todayAttendanceCount in getDashboardData() (real DB queries)
  - HR Admin dashboard Cuti Menunggu + Absen Hari Ini stat cards
  - Manager dashboard Cuti Menunggu + Absen Hari Ini stat cards, placeholder removed
  - Employee dashboard upcoming approved leave card (within 7 days)
  - Seed data: attendance records (Mon-Fri last week, isLate for Wednesday), leave balances upsert, 2 PENDING leave requests

affects: [04-payroll-management, 05-recruitment-management]

tech-stack:
  added: []
  patterns:
    - "Per-employee data fetched in server page.tsx, passed as props to dashboard component (bypasses getDashboardData no-args constraint)"
    - "Leave report groups Prisma results by employeeId using Map; avoids extra GROUP BY query"

key-files:
  created:
    - src/app/(dashboard)/leave/report/page.tsx
  modified:
    - src/lib/services/dashboard.service.ts
    - src/app/(dashboard)/dashboard/page.tsx
    - src/app/(dashboard)/dashboard/_components/hr-admin-dashboard.tsx
    - src/app/(dashboard)/dashboard/_components/manager-dashboard.tsx
    - src/app/(dashboard)/dashboard/_components/employee-dashboard.tsx
    - src/components/layout/sidebar.tsx
    - prisma/seed.ts

key-decisions:
  - "upcomingLeave for employee fetched in dashboard/page.tsx and passed as prop to EmployeeDashboard; avoids breaking getDashboardData no-args Decision #24 while still providing per-employee data"
  - "pendingLeaveRequests kept in DashboardData for super-admin backward compat; pendingLeaveCount added as the canonical Phase 3 field"
  - "Seed attendance records use dynamic last-week calculation (not hardcoded dates) so idempotency works regardless of run date"

patterns-established:
  - "Dashboard role-specific extra data: fetch in page.tsx, pass as named props to the role's component"

duration: 35min
completed: 2026-03-06
---

# Phase 3 Plan 9: Leave Report, Dashboard Widgets, and Seed Data Summary

**Leave usage report at /leave/report, real pendingLeaveCount + todayAttendanceCount in dashboard widgets, and seed data with 5-day attendance records + leave balances + 2 PENDING leave requests for end-to-end QA**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-03-06T08:20:00Z
- **Completed:** 2026-03-06T08:55:00Z
- **Tasks:** 1 (+ checkpoint:human-verify pending)
- **Files modified:** 8

## Accomplishments

- Leave usage report page at /leave/report: role-gated (HR_ADMIN/SUPER_ADMIN), groups getLeaveRequests by employee, renders NIK/Nama/Departemen/Disetujui/Menunggu/Ditolak columns
- Dashboard service updated to query real pendingLeaveCount (LeaveRequest.count PENDING) and todayAttendanceCount (AttendanceRecord.count today UTC)
- All three role dashboards (HR Admin, Manager, Employee) updated with Phase 3 data
- Seed enriched with: 5 attendance records per active employee (Mon-Fri last week; Wednesday isLate=true, lateMinutes=35), leave balances upserted for all active employees and all leave types for current year, 2 PENDING leave requests (Rina and Ahmad)

## Task Commits

1. **Task 1: Leave report, dashboard widgets, seed data** - `32fa49d` (feat)

## Files Created/Modified

- `src/app/(dashboard)/leave/report/page.tsx` - New: HR Admin leave usage report with per-employee summary table
- `src/lib/services/dashboard.service.ts` - Added pendingLeaveCount, todayAttendanceCount fields with real Prisma queries
- `src/app/(dashboard)/dashboard/page.tsx` - Added per-employee upcoming leave fetch for EMPLOYEE role
- `src/app/(dashboard)/dashboard/_components/hr-admin-dashboard.tsx` - Added Cuti Menunggu + Absen Hari Ini stat cards
- `src/app/(dashboard)/dashboard/_components/manager-dashboard.tsx` - Added real stat cards, removed stale placeholder text
- `src/app/(dashboard)/dashboard/_components/employee-dashboard.tsx` - Added upcoming leave card with CalendarCheck icon
- `src/components/layout/sidebar.tsx` - Added BarChart2 import + "Laporan Cuti" nav item for HR_ADMIN/SUPER_ADMIN
- `prisma/seed.ts` - Added sections 10/11/12: attendance records, leave balances, leave requests

## Decisions Made

- upcomingLeave for employee is fetched in `dashboard/page.tsx` (server) and passed as a prop to `EmployeeDashboard`. This avoids breaking Decision #24 (getDashboardData no-args) while still supporting per-employee data.
- `pendingLeaveRequests` kept in DashboardData for backward compatibility with super-admin-dashboard; `pendingLeaveCount` added as the canonical Phase 3 field used by HR Admin and Manager dashboards.
- Seed attendance records use dynamic date calculation (relative to today) so the seed is date-agnostic and always seeds last week's data.

## Deviations from Plan

None - plan executed exactly as written. The per-employee upcoming leave approach (fetching in page.tsx) was consistent with Decision #24 and the plan's guidance.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 3 complete. All 14 requirements (ATT-01 through ATT-08, LEAVE-01 through LEAVE-06) are implemented. Awaiting human verification checkpoint (checkpoint:human-verify) to confirm end-to-end functionality.

Phase 4 (Payroll Management) can begin after:
- Human verification approved
- PPh 21 TER rate table and BPJS caps verified against 2026 official sources (see research/SUMMARY.md)

---
*Phase: 03-attendance-leave-management*
*Completed: 2026-03-06*
