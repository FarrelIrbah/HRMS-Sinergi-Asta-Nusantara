---
phase: 03-attendance-leave-management
plan: 01
subsystem: database
tags: [prisma, postgresql, zod, typescript, attendance, leave]

# Dependency graph
requires:
  - phase: 02-employee-data-management
    provides: Employee, OfficeLocation, LeaveType models that Phase 3 extends

provides:
  - AttendanceRecord Prisma model with clock-in/out, flags, and override support
  - LeaveRequest Prisma model with LeaveStatus enum and approver relation
  - LeaveBalance Prisma model with composite unique key (employeeId, leaveTypeId, year)
  - AttendanceStatus and LeaveStatus client-safe enums in src/types/enums.ts
  - Zod schemas for attendance (clock-in, manual override) and leave (submit, approve, reject)
  - OVERTIME_THRESHOLD_MINUTES constant and Indonesian label maps in constants.ts
  - 5mb server action body size limit in next.config.mjs

affects:
  - 03-02 and all subsequent Phase 3 plans (service layer, UI)
  - 04-payroll-management (leave balance data affects payroll deductions)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Phase 3 data layer established before any service or UI code written"
    - "Single migration adds all Phase 3 models to prevent intermediate broken states"

key-files:
  created:
    - prisma/migrations/20260305221746_add_attendance_leave_models/migration.sql
    - src/lib/validations/attendance.ts
    - src/lib/validations/leave.ts
  modified:
    - prisma/schema.prisma
    - src/types/enums.ts
    - src/lib/constants.ts
    - next.config.mjs

key-decisions:
  - "next.config.mjs used (not next.config.ts) — project uses .mjs extension"
  - "Migration applied successfully with Docker/PostgreSQL running (cms-postgres container)"

patterns-established:
  - "Attendance Zod schema pattern: clockActionSchema for GPS coords, manualAttendanceSchema for admin override"
  - "Leave Zod schema pattern: submitLeaveSchema with refine for date range validation"

# Metrics
duration: 4min
completed: 2026-03-06
---

# Phase 3 Plan 01: Attendance and Leave Data Foundation Summary

**Prisma schema extended with AttendanceRecord, LeaveRequest, and LeaveBalance models, migration applied, client-safe enums added, and Zod validation schemas created for attendance clock-in and leave submission flows.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-05T22:16:12Z
- **Completed:** 2026-03-05T22:20:54Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Applied database migration adding AttendanceRecord, LeaveRequest, and LeaveBalance models with all required fields, indexes, and composite unique constraints
- Extended OfficeLocation with workStartTime/workEndTime, Employee with officeLocation @relation, User with override/approval relations, and LeaveType with balance/request relations
- Added client-safe AttendanceStatus and LeaveStatus enums, OVERTIME_THRESHOLD_MINUTES constant, Indonesian label maps, and Zod validation schemas for all attendance and leave actions

## Task Commits

Each task was committed atomically:

1. **Task 1: Update Prisma schema with all Phase 3 models and run migration** - `0d12924` (feat)
2. **Task 2: Add client-safe enums, constants, Zod schemas, and server action body limit** - `c21dab2` (feat)

**Plan metadata:** *(committed below with docs commit)*

## Files Created/Modified

- `prisma/schema.prisma` - Added AttendanceStatus/LeaveStatus enums; updated OfficeLocation, LeaveType, User, Employee models with new relations; added AttendanceRecord, LeaveRequest, LeaveBalance models
- `prisma/migrations/20260305221746_add_attendance_leave_models/migration.sql` - Migration SQL for all Phase 3 schema changes
- `src/types/enums.ts` - Added AttendanceStatus and LeaveStatus client-safe const objects with types
- `src/lib/constants.ts` - Added OVERTIME_THRESHOLD_MINUTES, MODULES_ATTENDANCE, ATTENDANCE_STATUS_LABELS, LEAVE_STATUS_LABELS
- `src/lib/validations/attendance.ts` - Created clockActionSchema and manualAttendanceSchema Zod schemas
- `src/lib/validations/leave.ts` - Created submitLeaveSchema (with date range refine), approveLeaveSchema, rejectLeaveSchema
- `next.config.mjs` - Added experimental.serverActions.bodySizeLimit = '5mb'

## Decisions Made

- **next.config.mjs vs next.config.ts:** The plan referenced `next.config.ts` but the project uses `next.config.mjs`. Updated the correct file.
- **Migration succeeded with live database:** Docker/PostgreSQL was running (cms-postgres container), so full migration was applied — no deferred migration as warned in the plan.

## Deviations from Plan

None - plan executed exactly as written, with one minor deviation noted: the config file is `next.config.mjs` (not `.ts` as referenced in the plan frontmatter), but this was already the case from project setup and was handled automatically.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Database migration was applied automatically with existing Docker PostgreSQL container.

## Next Phase Readiness

- All Phase 3 models are in the database and Prisma client is generated
- `npx tsc --noEmit` passes with zero errors
- `npx prisma validate` passes cleanly
- Ready for 03-02 (attendance service layer) and all subsequent Phase 3 plans

---
*Phase: 03-attendance-leave-management*
*Completed: 2026-03-06*
