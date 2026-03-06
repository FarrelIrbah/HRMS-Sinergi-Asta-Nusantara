---
phase: 03-attendance-leave-management
plan: "05"
subsystem: ui
tags: [nextjs, react, shadcn, react-hook-form, zod, date-fns, leave-management]

# Dependency graph
requires:
  - phase: 03-01
    provides: leave service (getLeaveBalances, getLeaveRequests, ensureLeaveBalances), leave actions (submitLeaveAction, cancelLeaveAction), leave validations (submitLeaveSchema), LEAVE_STATUS_LABELS in constants.ts

provides:
  - /leave route: employee-facing leave management page (server component)
  - LeaveBalanceCard: grid of cards showing allocated/used/remaining days per leave type with Progress bar
  - LeaveRequestForm: client form with inline balance hint, date pickers, zodResolver with Resolver<T> cast
  - LeaveHistoryTable: table with status badges and cancellation support for PENDING requests

affects: [03-06, phase-4]

# Tech tracking
tech-stack:
  added:
    - "@radix-ui/react-popover (via shadcn calendar/popover)"
    - "react-day-picker (via shadcn calendar)"
  patterns:
    - "Resolver<T> cast for zodResolver with coerce.date() schemas (matches decision #32)"
    - "Date serialization in server component: toISOString() before passing to client components"
    - "ensureLeaveBalances called before reading balances in page server component"

key-files:
  created:
    - src/app/(dashboard)/leave/page.tsx
    - src/app/(dashboard)/leave/_components/leave-balance-card.tsx
    - src/app/(dashboard)/leave/_components/leave-request-form.tsx
    - src/app/(dashboard)/leave/_components/leave-history-table.tsx
    - src/components/ui/progress.tsx
    - src/components/ui/popover.tsx
    - src/components/ui/calendar.tsx
  modified: []

key-decisions:
  - "Resolver<T> single cast pattern for zodResolver (consistent with decision #32 in employment-details-tab.tsx)"
  - "Progress, Popover, Calendar shadcn components added as blocking dependencies"

patterns-established:
  - "LeaveBalanceCard uses leaveTypes prop (not just balances) to show cards for all types even if no balance row yet"
  - "CancelButton as isolated sub-component with its own useTransition to avoid re-rendering full table"

# Metrics
duration: 8min
completed: 2026-03-06
---

# Phase 3 Plan 05: Employee Leave Management UI Summary

**Employee-facing /leave page with balance card grid, date-picker form with inline balance hint, and history table with per-row PENDING cancel support**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-06T06:18:16Z
- **Completed:** 2026-03-06T06:26:00Z
- **Tasks:** 2
- **Files modified:** 7 created (4 components + 3 shadcn ui components)

## Accomplishments

- /leave server component fetches balances, leave types, and requests; calls ensureLeaveBalances before read; serializes dates for client components
- LeaveBalanceCard displays a responsive grid of cards (remaining/allocated/used) with Progress bar per leave type
- LeaveRequestForm with inline balance hint (Badge showing remaining days when leave type selected), date pickers with past-date disabled, and zodResolver with Resolver<T> cast for coerce.date() schema
- LeaveHistoryTable with LEAVE_STATUS_LABELS status badges and cancel button (useTransition) shown only for PENDING requests

## Task Commits

Each task was committed atomically:

1. **Task 1: Create leave page server component and leave balance card** - `aa9eae1` (feat)
2. **Task 2: Build leave request form and leave history table** - `95a2d9b` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/app/(dashboard)/leave/page.tsx` - Server component: auth check, ensureLeaveBalances, date serialization, composition
- `src/app/(dashboard)/leave/_components/leave-balance-card.tsx` - Balance grid with Progress bars per leave type
- `src/app/(dashboard)/leave/_components/leave-request-form.tsx` - Client form with inline balance hint and date pickers
- `src/app/(dashboard)/leave/_components/leave-history-table.tsx` - History table with status badges and cancel support
- `src/components/ui/progress.tsx` - Added shadcn/ui Progress (blocking dep for balance card)
- `src/components/ui/popover.tsx` - Added shadcn/ui Popover (blocking dep for date pickers)
- `src/components/ui/calendar.tsx` - Added shadcn/ui Calendar (blocking dep for date pickers)

## Decisions Made

- Used `as Resolver<SubmitLeaveInput>` single-cast pattern (consistent with employment-details-tab.tsx pattern, Decision #32)
- LeaveBalanceCard accepts both `balances` and `leaveTypes` props so cards render for all leave types even if a balance row doesn't exist yet in DB
- CancelButton extracted as isolated sub-component to isolate its own `useTransition` state without re-rendering the full table

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing shadcn/ui Progress component**

- **Found during:** Task 1 (leave-balance-card.tsx uses Progress)
- **Issue:** `@/components/ui/progress` did not exist; TypeScript reported module not found
- **Fix:** `npx shadcn@latest add progress --yes`
- **Files modified:** src/components/ui/progress.tsx, package.json, package-lock.json
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** aa9eae1 (Task 1 commit)

**2. [Rule 3 - Blocking] Added missing shadcn/ui Popover and Calendar components**

- **Found during:** Task 2 (leave-request-form.tsx uses Popover and Calendar for date pickers)
- **Issue:** Neither `@/components/ui/popover` nor `@/components/ui/calendar` existed
- **Fix:** `npx shadcn@latest add popover calendar --yes`
- **Files modified:** src/components/ui/popover.tsx, src/components/ui/calendar.tsx, package.json, package-lock.json
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 95a2d9b (Task 2 commit)

**3. [Rule 1 - Bug] Fixed zodResolver type cast from `ReturnType<typeof zodResolver>` to `Resolver<SubmitLeaveInput>`**

- **Found during:** Task 2 (TypeScript errors on resolver and form.control)
- **Issue:** `ReturnType<typeof zodResolver>` resolves to `Resolver<FieldValues, ...>` which is incompatible with typed FormField control; produces widespread TS2322 errors
- **Fix:** Import `Resolver` type from `react-hook-form`; use `zodResolver(schema) as Resolver<SubmitLeaveInput>`
- **Files modified:** leave-request-form.tsx
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** 95a2d9b (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 missing blocking deps, 1 type cast bug)
**Impact on plan:** All auto-fixes necessary for compilation. No scope creep. Plan execution matches intended behavior exactly.

## Issues Encountered

- The plan's suggested `zodResolver(schema) as ReturnType<typeof zodResolver>` cast produces TypeScript errors in this codebase's version of react-hook-form. The established project pattern (Decision #32) of `as Resolver<T>` resolves this. Applied consistently.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- /leave route is fully functional for employees
- LeaveBalanceCard, LeaveRequestForm, and LeaveHistoryTable are complete
- sidebar.tsx already updated by plan 03-04 to include the Cuti nav link
- Ready for plan 03-06 (HR admin leave management view) or further phase 3 plans

---
*Phase: 03-attendance-leave-management*
*Completed: 2026-03-06*
