---
phase: 03-attendance-leave-management
plan: "02"
subsystem: api
tags: [attendance, location, gps, ip-cidr, timezone, date-fns-tz, prisma, server-actions]

# Dependency graph
requires:
  - phase: 03-01
    provides: AttendanceRecord schema, LeaveRequest schema, manualAttendanceSchema validation
  - phase: 01-04
    provides: createAuditLog helper in @/lib/prisma, prisma singleton
  - phase: 01-02
    provides: auth() from @/lib/auth (NextAuth v5)
provides:
  - verifyLocation() pure function with GPS haversine + IP CIDR fallback
  - calculateAttendanceFlags() pure function using Asia/Jakarta timezone
  - getTodayRecord, getEmployeeAttendance, getWeeklySummary, getMonthlyAttendanceRecap DB query functions
  - clockInAction, clockOutAction server actions with location verification
  - manualOverrideAction server action restricted to HR_ADMIN/SUPER_ADMIN
affects:
  - 03-03 (attendance UI pages will call these actions)
  - 03-04 (leave management may reuse attendance query patterns)

# Tech tracking
tech-stack:
  added: [ip-range-check]
  patterns:
    - Pure service functions (no DB) alongside DB query functions in same service file
    - createAuditLog imported from @/lib/prisma (not audit.service)
    - WIB-to-UTC conversion with setUTCHours(h - 7, m) for manual time input
    - P2002 Prisma unique constraint error caught inline in try/catch for duplicate clock-in

key-files:
  created:
    - src/lib/services/location.service.ts
    - src/lib/services/attendance.service.ts
    - src/lib/actions/attendance.actions.ts
    - src/types/ip-range-check.d.ts
  modified:
    - package.json (ip-range-check added)
    - package-lock.json

key-decisions:
  - "createAuditLog imported from @/lib/prisma not @/lib/services/audit.service"
  - "@types/ip-range-check not on npm; manual declaration in src/types/ip-range-check.d.ts"
  - "clockOut empty string handled explicitly before parsing in manualOverrideAction"

patterns-established:
  - "Attendance flag calculation: pure function calculateAttendanceFlags() takes UTC dates, scheduleStart/End strings, returns flags object"
  - "Location verification: GPS primary when coords provided, IP CIDR fallback when no GPS config"
  - "Manual time input (WIB strings) converted to UTC with setUTCHours(h - 7, m, 0, 0)"

# Metrics
duration: 3min
completed: 2026-03-06
---

# Phase 3 Plan 02: Attendance Business Logic Summary

**IP/GPS location verification service, timezone-aware attendance flag calculator, and clock-in/clock-out/manual-override server actions using Asia/Jakarta (WIB) timezone**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-05T22:25:27Z
- **Completed:** 2026-03-05T22:28:29Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- `verifyLocation()` pure function that checks GPS coordinates via haversine distance first, falls back to IP CIDR check when no GPS coords/config
- `calculateAttendanceFlags()` pure function: computes isLate/lateMinutes, isEarlyOut/earlyOutMinutes, overtimeMinutes, totalMinutes — all timezone-corrected to Asia/Jakarta
- `clockInAction` / `clockOutAction` server actions: IP extraction from x-forwarded-for header, location verification, attendance flag calculation, P2002 duplicate guard with Indonesian error message
- `manualOverrideAction`: HR_ADMIN/SUPER_ADMIN role gate, Zod validation via manualAttendanceSchema, upsert semantics, audit log written via createAuditLog

## Task Commits

Each task was committed atomically:

1. **Task 1: Create location verification service and attendance flag calculation service** - `ce42549` (feat)
2. **Task 2: Create clock-in, clock-out, and manual override server actions** - `667444f` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/lib/services/location.service.ts` - verifyLocation() with GPS haversine + IP CIDR fallback
- `src/lib/services/attendance.service.ts` - calculateAttendanceFlags(), getTodayRecord, getEmployeeAttendance, getWeeklySummary, getMonthlyAttendanceRecap
- `src/lib/actions/attendance.actions.ts` - clockInAction, clockOutAction, manualOverrideAction server actions
- `src/types/ip-range-check.d.ts` - Manual TypeScript declaration for ip-range-check (no @types package on npm)
- `package.json` / `package-lock.json` - ip-range-check dependency added

## Decisions Made

- **createAuditLog from @/lib/prisma**: The `createAuditLog` function lives in `@/lib/prisma` as an export alongside the `prisma` singleton — not in `audit.service.ts` which only has read functions. Existing employee service patterns confirmed this.
- **@types/ip-range-check not on npm**: Package returns 404 on the npm registry; created manual declaration file at `src/types/ip-range-check.d.ts`.
- **clockOut empty string handling**: `manualAttendanceSchema` allows `clockOut` to be either a valid HH:MM string or an empty literal `""`. The action explicitly guards `if (clockOut && clockOut !== "")` before parsing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created manual TypeScript declaration for ip-range-check**

- **Found during:** Task 1 (install @types/ip-range-check)
- **Issue:** `@types/ip-range-check` is not published on npm (404 error)
- **Fix:** Created `src/types/ip-range-check.d.ts` with `declare module "ip-range-check"` declaration
- **Files modified:** `src/types/ip-range-check.d.ts`
- **Verification:** `npx tsc --noEmit` passes with no type errors
- **Committed in:** ce42549 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed empty-string clockOut guard in manualOverrideAction**

- **Found during:** Task 2 (manualOverrideAction implementation)
- **Issue:** The `manualAttendanceSchema` allows `clockOut` to be either a valid time string or empty literal `""`. The plan code only checked `if (clockOut)` which would be truthy for any non-empty string. Explicit `clockOut !== ""` guard added.
- **Fix:** Changed check to `if (clockOut && clockOut !== "")` before attempting to parse the time string
- **Files modified:** `src/lib/actions/attendance.actions.ts`
- **Verification:** `npx tsc --noEmit` passes; logic correct for empty string case
- **Committed in:** 667444f (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking dependency, 1 logic bug)
**Impact on plan:** Both fixes necessary for correct operation. No scope creep.

## Issues Encountered

None beyond the deviations documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three business logic files are in place and TypeScript-clean
- `clockInAction` and `clockOutAction` ready to be called from attendance UI components in 03-03
- `getWeeklySummary` and `getEmployeeAttendance` ready for dashboard and history views
- `getMonthlyAttendanceRecap` ready for HR admin monthly report views
- `manualOverrideAction` ready for HR admin override form in 03-03

---
*Phase: 03-attendance-leave-management*
*Completed: 2026-03-06*
