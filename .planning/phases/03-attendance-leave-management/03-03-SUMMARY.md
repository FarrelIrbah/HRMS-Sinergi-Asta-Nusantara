---
phase: 03-attendance-leave-management
plan: "03"
subsystem: api
tags: [leave-management, prisma, date-fns, server-actions, nextauth, zod, transactions]

# Dependency graph
requires:
  - phase: 03-01
    provides: LeaveRequest, LeaveBalance, LeaveType schema models and migrations
  - phase: 01-04
    provides: createAuditLog helper in @/lib/prisma, audit pattern
  - phase: 01-02
    provides: auth() from @/lib/auth, session/role pattern
provides:
  - Leave service with pure working-day calculation (countWorkingDays)
  - Idempotent ensureLeaveBalances via upsert
  - getLeaveBalances for employee balance display
  - submitLeaveRequest with balance sufficiency guard
  - approveLeaveRequest atomic transaction (balance decrement + status update)
  - rejectLeaveRequest and cancelLeaveRequest with status guards
  - getLeaveRequests with multi-filter support (employee/department/status/year)
  - getPendingLeaveCount for dashboard widget
  - Four server actions: submitLeaveAction, approveLeaveAction, rejectLeaveAction, cancelLeaveAction
affects:
  - 03-04 (leave management UI pages)
  - 03-05 (attendance+leave dashboard integration)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Atomic approval transaction: balance decrement + status update in single prisma.$transaction"
    - "ensureLeaveBalances idempotent upsert pattern for per-employee per-year balance initialization"
    - "Server actions import createAuditLog from @/lib/prisma (not from audit.service)"
    - "MANAGER role included alongside HR_ADMIN/SUPER_ADMIN for leave approval"

key-files:
  created:
    - src/lib/services/leave.service.ts
    - src/lib/actions/leave.actions.ts
  modified: []

key-decisions:
  - "createAuditLog imported from @/lib/prisma not @/lib/services/audit.service — consistent with all other action files"
  - "countWorkingDays is a pure function (no DB calls) — testable in isolation"
  - "approveLeaveRequest uses prisma.$transaction to prevent concurrent double-approval race condition"
  - "cancelLeaveRequest restricted to PENDING status only — APPROVED leaves require separate reversal flow"

patterns-established:
  - "Leave service pattern: pure calculation function + DB mutations in separate exports"
  - "Leave action pattern: session auth check → role check (if needed) → schema parse → service call → audit log → revalidate"

# Metrics
duration: 2min
completed: 2026-03-06
---

# Phase 3 Plan 03: Leave Management Service and Actions Summary

**Atomic leave approval transaction with balance decrement, working-day calculation via date-fns, and four server actions covering the full employee leave request lifecycle**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-05T22:26:39Z
- **Completed:** 2026-03-05T22:28:27Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Leave service with all CRUD operations and atomic approval transaction preventing concurrent double-approval
- Pure `countWorkingDays` function using date-fns `eachDayOfInterval` and `isWeekend` for accurate working-day calculation
- Idempotent `ensureLeaveBalances` that initializes per-employee per-year balances for all active leave types
- Four server actions covering full leave request lifecycle: submit, approve, reject, cancel

## Task Commits

Each task was committed atomically:

1. **Task 1: Create leave service with working-day calculation, balance management, and approval transaction** - `45fa7d3` (feat)
2. **Task 2: Create leave server actions** - `3f07291` (feat)

**Plan metadata:** (next commit)

## Files Created/Modified
- `src/lib/services/leave.service.ts` - Leave domain service: pure working-day calculator, balance upsert, submit/approve/reject/cancel/query functions
- `src/lib/actions/leave.actions.ts` - Next.js server actions: auth-gated wrappers for all leave mutations with audit logging

## Decisions Made
- `createAuditLog` imported from `@/lib/prisma` (not from `@/lib/services/audit.service`) — this matches the pattern used by all other action files in the codebase; the plan incorrectly specified `audit.service`
- `countWorkingDays` implemented as a pure function with no DB dependencies, enabling isolated unit testing
- `approveLeaveRequest` uses `prisma.$transaction` with a PENDING status re-check inside the transaction body — this prevents two concurrent approvals from both decrementing the balance
- `cancelLeaveRequest` only allows cancellation of PENDING requests; reverting an APPROVED leave (balance restoration) is a separate workflow not in scope for this plan

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed incorrect import for createAuditLog in leave.actions.ts**
- **Found during:** Task 2 (create leave server actions)
- **Issue:** Plan specified `import { createAuditLog } from "@/lib/services/audit.service"` but `createAuditLog` is exported from `@/lib/prisma` in this project. `audit.service.ts` only contains read functions (`getAuditLogs`, `getAuditLogById`, etc.) — it does not export `createAuditLog`. Using the wrong import would cause a TypeScript error and runtime failure.
- **Fix:** Changed import to `import { prisma, createAuditLog } from "@/lib/prisma"` — matching the pattern used in `employee.actions.ts`, `employee-document.actions.ts`, and all other action files
- **Files modified:** `src/lib/actions/leave.actions.ts`
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** `3f07291` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking import error)
**Impact on plan:** Necessary fix; the plan's import path was incorrect for this codebase. No scope creep.

## Issues Encountered
None — both files compiled cleanly on first `npx tsc --noEmit` run after the import fix.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Leave service and actions are complete; UI pages (03-04) can now import `submitLeaveAction`, `approveLeaveAction`, `rejectLeaveAction`, `cancelLeaveAction` directly
- `getLeaveBalances` and `getLeaveRequests` service functions ready for server component data fetching
- `getPendingLeaveCount` ready for dashboard integration in 03-05
- No blockers

---
*Phase: 03-attendance-leave-management*
*Completed: 2026-03-06*
