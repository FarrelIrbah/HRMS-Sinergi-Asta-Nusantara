---
phase: 03-attendance-leave-management
plan: 07
subsystem: ui
tags: [next.js, react, prisma, leave-management, role-based-access]

# Dependency graph
requires:
  - phase: 03-attendance-leave-management/03-05
    provides: leave service functions (getLeaveRequests, approveLeaveRequest, rejectLeaveRequest), leave.actions.ts with approveLeaveAction/rejectLeaveAction, LEAVE_STATUS_LABELS in constants.ts
provides:
  - /leave/manage route with role-scoped leave request table
  - Approve/reject dialogs with inline note entry
  - Status and year filter controls
  - Manager department scoping via prisma.employee lookup
affects: [03-06-sidebar, 04-payroll-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Role-gated server page with redirect for unauthorized roles
    - Manager department scoping: prisma.employee.findUnique({ where: { userId } }) to resolve departmentId
    - Date serialization pattern reused from 03-05 for client component compatibility
    - Inline approve/reject dialogs with useTransition for non-blocking server action calls
    - Reject enforces non-empty notes client-side before calling server action

key-files:
  created:
    - src/app/(dashboard)/leave/manage/page.tsx
    - src/app/(dashboard)/leave/manage/_components/leave-approval-table.tsx
    - src/app/(dashboard)/leave/manage/_components/approve-reject-dialog.tsx
  modified: []

key-decisions:
  - "ApproveRejectDialog validates non-empty notes for reject mode client-side before server action call (avoids round-trip for obvious validation)"
  - "pendingCount shown only in subtitle when viewing non-filtered page — computed from already-fetched serialized list, no extra query"
  - "_all sentinel passed as status to getLeaveRequests which already handles it (skips where.status clause)"

patterns-established:
  - "Leave approval page pattern: server page fetches and serializes, client table handles filter URL updates via router.push"
  - "Approve/reject dialog pattern: single component with mode prop (approve | reject) controls variant, label, and notes validation"

# Metrics
duration: 91min (includes rate limit interruption between sessions)
completed: 2026-03-06
---

# Phase 3 Plan 07: Leave Approval Management Summary

**Role-scoped /leave/manage page with filterable requests table, approve/reject dialogs, mandatory rejection notes, and Manager department isolation via prisma employee lookup.**

## Performance

- **Duration:** ~91 min (includes rate limit reset pause between sessions)
- **Started:** 2026-03-06T06:32:24Z
- **Completed:** 2026-03-06T08:04:17Z
- **Tasks:** 2/2
- **Files modified:** 3 created, 0 modified

## Accomplishments

- /leave/manage route created: HR_ADMIN, SUPER_ADMIN, and MANAGER can access; EMPLOYEE redirected to /leave
- Manager role automatically scoped to their own department's requests via prisma employee lookup
- Status filter (PENDING/APPROVED/REJECTED/CANCELLED/all) and year filter update URL params, triggering server re-fetch
- Approve dialog: notes optional, submits via approveLeaveAction with useTransition
- Reject dialog: notes mandatory, client-side validation prevents empty submission before server action call
- Approve/Reject buttons rendered only for PENDING status rows
- `npx tsc --noEmit` passes with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create leave manage server page** - `1a01eac` (feat)
2. **Task 2: Build leave approval table and approve/reject dialog** - `ee68740` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/app/(dashboard)/leave/manage/page.tsx` - Server page: auth, role gate, manager scoping, date serialization, renders LeaveApprovalTable
- `src/app/(dashboard)/leave/manage/_components/leave-approval-table.tsx` - Client component: status/year filter selects, full requests table with Badge status display
- `src/app/(dashboard)/leave/manage/_components/approve-reject-dialog.tsx` - Client dialog: approve (optional notes) and reject (required notes) with useTransition and toast feedback

## Decisions Made

- Client-side notes validation for reject mode: avoids a round-trip to server for an obviously invalid submission. The server action (rejectLeaveSchema) also validates, providing defense in depth.
- `pendingCount` computed from the already-fetched serialized list rather than a separate DB count query. Acceptable since list is already paginated by status filter.
- sidebar.tsx intentionally NOT modified per plan constraint — plan 03-06 runs in parallel and owns all remaining sidebar changes.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Rate limit interruption between Task 1 and Task 2. Task 1 page.tsx was written to disk but not committed before the interruption. On resumption, the file was verified correct and both tasks committed cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Leave approval workflow is complete end-to-end: submit (03-05) -> manage/approve/reject (03-07)
- sidebar entry for /leave/manage will be added by 03-06 (running in parallel)
- Phase 3 leave management feature set is functionally complete
- Phase 4 (Payroll Management) can proceed once Phase 3 is fully merged

---
*Phase: 03-attendance-leave-management*
*Completed: 2026-03-06*
