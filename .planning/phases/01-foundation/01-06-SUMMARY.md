---
phase: 01-foundation
plan: 06
subsystem: ui, api
tags: [prisma, zod, react, shadcn, nuqs, master-data, soft-delete, audit-log]

# Dependency graph
requires:
  - phase: 01-foundation (01-03)
    provides: Dashboard layout, shared components (DataTable, ConfirmDialog)
  - phase: 01-foundation (01-04)
    provides: Audit logging infrastructure (createAuditLog), Prisma schema with Department/Position models
provides:
  - Department CRUD with soft delete and audit logging
  - Position CRUD linked to departments with soft delete and audit logging
  - Master data page with tabs layout
  - Validation schemas for all master data types
  - Service and action files structured for Plan 07 to append
affects: [01-07 (office locations, leave types append to same files), 02-employee-data (uses departments and positions)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Master data service pattern: paginated queries with soft delete filter"
    - "Server action pattern: auth check, zod validate, call service, revalidate"
    - "Client tab state via nuqs useQueryState for URL persistence"
    - "Form dialog pattern: shared create/edit dialog with react-hook-form + zod"

key-files:
  created:
    - src/lib/validations/master-data.ts
    - src/lib/services/master-data.service.ts
    - src/lib/actions/master-data.actions.ts
    - src/app/(dashboard)/master-data/page.tsx
    - src/app/(dashboard)/master-data/_components/master-data-tabs.tsx
    - src/app/(dashboard)/master-data/_components/department-tab.tsx
    - src/app/(dashboard)/master-data/_components/department-form-dialog.tsx
    - src/app/(dashboard)/master-data/_components/position-tab.tsx
    - src/app/(dashboard)/master-data/_components/position-form-dialog.tsx
  modified:
    - src/app/layout.tsx

key-decisions:
  - "Structured service/action files with section comments for Plan 07 to append safely"
  - "Added read actions (getDepartmentsAction, getPositionsAction) for client component data fetching"
  - "Date serialization in read actions (toISOString) for client component compatibility"

patterns-established:
  - "Master data CRUD: validation -> service (with audit log) -> server action -> client component"
  - "Soft delete pattern: deletedAt field, all queries filter deletedAt: null"
  - "Department delete guard: check active positions before allowing soft delete"

# Metrics
duration: 6min
completed: 2026-02-27
---

# Phase 1 Plan 6: Master Data Departments & Positions Summary

**Department and position CRUD with soft delete, audit logging, and tabbed master data page using shadcn Tabs + nuqs URL state**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-27T16:35:30Z
- **Completed:** 2026-02-27T16:41:27Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Full department CRUD with soft delete and active-positions guard
- Full position CRUD linked to departments via dropdown, with soft delete
- Master data page with 4 tabs (2 functional, 2 placeholders for Plan 07)
- All mutations audit-logged with before/after values
- Zod validation schemas for all 4 master data types (department, position, office location, leave type)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create master data validation, service, and actions** - `97758d6` (feat)
2. **Task 2: Build master data page with tabs and department tab UI** - `de80cc9` (feat)
3. **Task 3: Build positions tab with department dropdown** - `8400cfd` (feat)

## Files Created/Modified
- `src/lib/validations/master-data.ts` - Zod schemas for department, position, office location, leave type
- `src/lib/services/master-data.service.ts` - CRUD services with soft delete and audit logging
- `src/lib/actions/master-data.actions.ts` - Server actions with auth, validation, revalidation
- `src/app/(dashboard)/master-data/page.tsx` - Server component with SUPER_ADMIN guard
- `src/app/(dashboard)/master-data/_components/master-data-tabs.tsx` - Tabs with nuqs URL state
- `src/app/(dashboard)/master-data/_components/department-tab.tsx` - Department DataTable with CRUD
- `src/app/(dashboard)/master-data/_components/department-form-dialog.tsx` - Create/edit department dialog
- `src/app/(dashboard)/master-data/_components/position-tab.tsx` - Position DataTable with CRUD
- `src/app/(dashboard)/master-data/_components/position-form-dialog.tsx` - Create/edit position with department dropdown
- `src/app/layout.tsx` - Added NuqsAdapter provider

## Decisions Made
- Structured service and action files with clear section comments (e.g., `// ===== OFFICE LOCATION FUNCTIONS (to be added by Plan 07) =====`) so Plan 07 can append without merge conflicts
- Added read-only server actions (getDepartmentsAction, getPositionsAction, getAllDepartmentsAction) alongside mutation actions, since client components cannot directly call service functions
- Serialized Date objects to ISO strings in read actions for client component compatibility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added NuqsAdapter to root layout**
- **Found during:** Task 2 (master-data-tabs.tsx uses useQueryState)
- **Issue:** nuqs v2 requires NuqsAdapter provider wrapping the app; without it, useQueryState throws at runtime
- **Fix:** Added `import { NuqsAdapter } from "nuqs/adapters/next/app"` and wrapped children in root layout
- **Files modified:** src/app/layout.tsx
- **Verification:** TypeScript compiles cleanly
- **Committed in:** de80cc9 (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added read actions for client data fetching**
- **Found during:** Task 2 (department-tab.tsx needs to fetch department list)
- **Issue:** Plan specified service functions but no server actions for reading data; client components cannot import service functions directly
- **Fix:** Added getDepartmentsAction, getAllDepartmentsAction, getPositionsAction, getAllPositionsAction with date serialization
- **Files modified:** src/lib/actions/master-data.actions.ts
- **Verification:** TypeScript compiles cleanly
- **Committed in:** de80cc9 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical)
**Impact on plan:** Both fixes necessary for correct operation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 07 can safely append office location and leave type functions to service/action files
- Plan 07 can replace placeholder tabs in master-data-tabs.tsx
- Department and position data available for employee management in Phase 2

---
*Phase: 01-foundation*
*Completed: 2026-02-27*
