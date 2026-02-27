---
phase: 01-foundation
plan: 09
subsystem: ui
tags: [nextjs, prisma, tailwind, seed-data, role-based-access, dashboard]

# Dependency graph
requires:
  - phase: 01-foundation/01-01
    provides: Prisma schema, database, seed infrastructure
  - phase: 01-foundation/01-02
    provides: Auth system with role in JWT session
  - phase: 01-foundation/01-03
    provides: Dashboard layout, StatCard shared component
  - phase: 01-foundation/01-05
    provides: User management (SUPER_ADMIN only)
  - phase: 01-foundation/01-06
    provides: Master data management (departments, positions, locations, leave types)
  - phase: 01-foundation/01-07
    provides: Office locations and leave types in master data
  - phase: 01-foundation/01-08
    provides: Audit log viewer

provides:
  - Role-specific dashboard pages for all 4 roles (SUPER_ADMIN, HR_ADMIN, MANAGER, EMPLOYEE)
  - Dashboard service with real counts for users/departments/positions
  - Comprehensive seed data: 4 users (all roles), 3 departments, 5 positions, 2 offices, 4 leave types
  - Client-safe enum types (src/types/enums.ts) decoupled from Prisma runtime
  - Production build passing (npm run build succeeds)

affects:
  - All future phases that add dashboard widgets
  - Phase 2+ onboarding (seed users exist for testing all features)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Role-specific rendering: server component calls auth(), switches on role to render appropriate dashboard component"
    - "Client-safe enums: Role/AuditAction defined as const objects in src/types/enums.ts to avoid Prisma runtime in client bundles"
    - "Dashboard service: getDashboardData() in src/lib/services/ returns real counts + placeholder zeros"
    - "Idempotent seed: upsert by email for users, findFirst-before-create for master data entities"

key-files:
  created:
    - src/types/enums.ts
    - src/lib/services/dashboard.service.ts
    - src/app/(dashboard)/dashboard/_components/super-admin-dashboard.tsx
    - src/app/(dashboard)/dashboard/_components/hr-admin-dashboard.tsx
    - src/app/(dashboard)/dashboard/_components/manager-dashboard.tsx
    - src/app/(dashboard)/dashboard/_components/employee-dashboard.tsx
  modified:
    - src/app/(dashboard)/dashboard/page.tsx
    - prisma/seed.ts
    - src/lib/constants.ts
    - src/lib/validations/user.ts
    - src/types/index.ts
    - src/types/next-auth.d.ts
    - src/components/layout/sidebar.tsx
    - src/components/layout/header.tsx
    - src/components/shared/confirm-dialog.tsx
    - src/app/(dashboard)/users/_components/user-columns.tsx
    - src/app/(dashboard)/users/_components/user-form-dialog.tsx
    - src/app/(dashboard)/users/_components/user-table.tsx
    - src/app/(dashboard)/audit-log/_components/audit-log-columns.tsx
    - src/app/(dashboard)/master-data/_components/department-tab.tsx
    - src/app/(dashboard)/master-data/_components/leave-type-tab.tsx
    - src/app/(dashboard)/master-data/_components/office-location-form-dialog.tsx
    - src/app/(dashboard)/master-data/_components/office-location-tab.tsx
    - src/app/(dashboard)/master-data/_components/position-tab.tsx
    - src/lib/services/user.service.ts
    - src/hooks/use-toast.ts

key-decisions:
  - "Client-safe enums in src/types/enums.ts: Role and AuditAction defined as plain const objects, not imported from Prisma, so they can be used in 'use client' components without bundling Node.js runtime"
  - "getDashboardData() takes no arguments: all 4 dashboards use same service; role-specific filtering happens at component level"
  - "Seed uses findFirst-before-create for departments/positions/locations/leave-types (not upsert) because these models have no unique constraint on name alone"
  - "ConfirmDialog now accepts loading prop: wires isToggling state to disable confirm button and show loading text"

patterns-established:
  - "Pattern: Dashboard page is server component, role switching happens in JSX conditionals (not switch statement) for simpler TypeScript narrowing"
  - "Pattern: Each role's dashboard is a separate component file receiving DashboardData props"
  - "Pattern: Placeholder values are explicit (0 or descriptive string), never blank"

# Metrics
duration: 35min
completed: 2026-02-27
---

# Phase 1 Plan 09: Role-Specific Dashboards and Seed Data Summary

**Role-specific dashboard pages for all 4 roles using a DashboardData service with real DB counts, plus comprehensive idempotent seed data covering all 4 roles and all master data types; production build fixed by extracting client-safe enum types from Prisma runtime**

## Performance

- **Duration:** 35 min
- **Started:** 2026-02-27T17:21:05Z
- **Completed:** 2026-02-27T17:56:15Z
- **Tasks:** 2 (+ 1 checkpoint pending verification)
- **Files modified:** 25

## Accomplishments

- DASH-01 complete: Super Admin sees 6 stat cards (4 HR shared + 2 organizational with real counts), HR Admin sees 4 stat cards, Manager sees 2 stat cards + placeholder notice, Employee sees 3 stat cards
- Comprehensive seed data: 4 users (all roles), 3 departments, 5 positions, 2 office locations with lat/lng/radius, 4 Indonesian statutory leave types - all idempotent
- Production build now passes (npm run build) - fixed pre-existing bug where client components importing Prisma caused webpack to fail on node: scheme URIs

## Task Commits

Each task was committed atomically:

1. **Task 1: Dashboard service and role-specific components** - `f16693f` (feat)
2. **Task 2: Comprehensive seed data** - `b05d0cc` (feat)
3. **Bug fix: Production build / client-safe enums** - `ed04c1e` (fix)

## Files Created/Modified

- `src/types/enums.ts` - Client-safe Role and AuditAction const enums (no Prisma import)
- `src/lib/services/dashboard.service.ts` - getDashboardData() returning real counts + placeholder zeros
- `src/app/(dashboard)/dashboard/page.tsx` - Server component: auth() -> role switch -> dashboard component
- `src/app/(dashboard)/dashboard/_components/super-admin-dashboard.tsx` - 6 stat cards
- `src/app/(dashboard)/dashboard/_components/hr-admin-dashboard.tsx` - 4 stat cards
- `src/app/(dashboard)/dashboard/_components/manager-dashboard.tsx` - 2 stat cards + placeholder notice
- `src/app/(dashboard)/dashboard/_components/employee-dashboard.tsx` - 3 stat cards
- `prisma/seed.ts` - Full seed: 4 users, 3 departments, 5 positions, 2 offices, 4 leave types
- `src/lib/constants.ts` - Updated to import Role/AuditAction from @/types/enums
- `src/lib/validations/user.ts` - Updated to use client-safe Role for z.nativeEnum
- Multiple client components updated to import Role/AuditAction from @/types/enums instead of Prisma

## Decisions Made

- **Client-safe enums:** Created `src/types/enums.ts` with `Role` and `AuditAction` as plain `const` objects so they can be imported in `"use client"` components without pulling in Prisma's Node.js runtime
- **getDashboardData() no arguments:** All roles use the same service function; component-level rendering handles role differences
- **Seed idempotency:** Used `findFirst`-before-create pattern for master data (departments, positions, etc.) since they lack unique name constraints in the schema
- **ConfirmDialog loading prop:** Added `loading` prop to surface async operation state to the user (disables button, shows "Memproses...")

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Production build failed: Prisma Node.js runtime bundled in client components**
- **Found during:** Post-task build verification
- **Issue:** `user-form-dialog.tsx` and other `"use client"` components imported `Role`/`AuditAction` from `@/generated/prisma/client`, which transitively imports `@prisma/client/runtime/library.mjs` which uses `node:async_hooks`, `node:fs`, `node:child_process` etc. Webpack cannot bundle `node:` scheme URIs for browser
- **Fix:** Created `src/types/enums.ts` with client-safe enum definitions; updated all client components and constants.ts, validations/user.ts to import from there instead
- **Files modified:** src/types/enums.ts (new), src/lib/constants.ts, src/lib/validations/user.ts, src/types/index.ts, src/types/next-auth.d.ts, 5 client components (sidebar, header, user-columns, user-form-dialog, audit-log-columns)
- **Verification:** `npm run build` succeeds with 10 routes generated
- **Committed in:** ed04c1e

**2. [Rule 1 - Bug] ESLint unused variable errors blocked production build**
- **Found during:** Same build verification
- **Issue:** 6 pre-existing unused variable lint errors: isPending in 4 master-data tabs, zodResolver in office-location-form-dialog, InputJsonValue in user.service.ts, actionTypes in use-toast.ts, toggleLoading in user-table.tsx
- **Fix:** Fixed each: renamed destructured binding to ignore pattern, removed imports, added eslint-disable comment for generated shadcn code, renamed and wired loading state to ConfirmDialog's new loading prop
- **Files modified:** 4 master-data tab components, office-location-form-dialog, user.service.ts, use-toast.ts, user-table.tsx, confirm-dialog.tsx
- **Committed in:** ed04c1e

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug)
**Impact on plan:** Both fixes necessary for production deployment. No scope creep. ConfirmDialog loading state is a UX improvement.

## Issues Encountered

- None beyond the deviations above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 1 Foundation complete: auth, layout, user management, master data (4 types), audit logging, role-specific dashboards, comprehensive seed data
- Production build verified passing
- Dev server running at http://localhost:3000 for checkpoint verification
- Phase 2 (Employee Data Management) can begin immediately - seed users and master data exist

---
*Phase: 01-foundation*
*Completed: 2026-02-27*
