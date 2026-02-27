---
phase: 01-foundation
plan: 03
subsystem: ui
tags: [next.js, react, shadcn, tanstack-table, sidebar, layout, dashboard]

# Dependency graph
requires:
  - phase: 01-foundation-01
    provides: "Project scaffold with shadcn, Prisma, Next.js 14, Tailwind"
provides:
  - "Dashboard route group layout with auth protection"
  - "Role-based sidebar navigation component"
  - "Header with user dropdown and logout (AUTH-04)"
  - "Breadcrumbs with Indonesian labels"
  - "StatCard, LoadingSkeleton, ConfirmDialog, DataTable, DataTablePagination shared components"
affects: [01-foundation-09, 02-employee, 03-attendance, 04-payroll, 05-recruitment]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dashboard route group (dashboard) with server layout + SessionProvider"
    - "Client components use useSession() for role/user data"
    - "Role-based nav filtering via Role enum array per nav item"
    - "Indonesian UI labels throughout (Keluar, Batal, Konfirmasi, etc.)"
    - "DataTable pattern: TanStack React Table + shadcn Table + pagination"

key-files:
  created:
    - src/app/(dashboard)/layout.tsx
    - src/app/(dashboard)/dashboard/page.tsx
    - src/components/layout/sidebar.tsx
    - src/components/layout/header.tsx
    - src/components/layout/breadcrumbs.tsx
    - src/components/layout/session-provider.tsx
    - src/components/shared/stat-card.tsx
    - src/components/shared/loading-skeleton.tsx
    - src/components/shared/confirm-dialog.tsx
    - src/components/shared/data-table.tsx
    - src/components/shared/data-table-pagination.tsx
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "SessionProvider wrapper created as separate client component for dashboard layout"
  - "Sidebar uses dark theme (slate-800/900) for visual distinction from main content"
  - "Mobile sidebar uses shadcn Sheet (slide-out drawer) triggered from header"
  - "DataTable defaults to 25 rows per page matching DEFAULT_PAGE_SIZE constant"

patterns-established:
  - "Layout pattern: server component checks auth, wraps children in SessionProvider"
  - "Shared components live in src/components/shared/, layout in src/components/layout/"
  - "All user-facing text in Indonesian"
  - "ConfirmDialog pattern for destructive actions with variant prop"

# Metrics
duration: 8min
completed: 2026-02-27
---

# Phase 01 Plan 03: Dashboard Layout Summary

**Dashboard shell with role-based sidebar, auth-protected layout, header with logout, and 5 reusable shared components (StatCard, skeletons, ConfirmDialog, DataTable)**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-27T16:21:07Z
- **Completed:** 2026-02-27T16:29:00Z
- **Tasks:** 2
- **Files created:** 11

## Accomplishments
- Dashboard route group with server-side auth check and redirect to /login
- Role-based sidebar: SUPER_ADMIN sees all nav items, other roles see Dashboard only
- Header with avatar dropdown showing user name, email, role badge, and logout button (AUTH-04)
- Breadcrumbs with Indonesian segment labels
- 5 reusable shared components: StatCard, TableSkeleton/CardSkeleton/StatCardSkeleton, ConfirmDialog, DataTable, DataTablePagination

## Task Commits

Each task was committed atomically:

1. **Task 1: Create dashboard layout with sidebar and header** - `24a4236` (feat)
2. **Task 2: Create reusable shared components** - `cf1132c` (feat)

**Plan metadata:** (pending)

## Files Created/Modified
- `src/app/(dashboard)/layout.tsx` - Protected dashboard layout with auth check, SessionProvider, sidebar + header + breadcrumbs
- `src/app/(dashboard)/dashboard/page.tsx` - Placeholder dashboard page with welcome text
- `src/components/layout/sidebar.tsx` - Desktop sidebar (w-64, dark theme) + MobileSidebar (Sheet drawer)
- `src/components/layout/header.tsx` - Header with mobile menu trigger, avatar dropdown with logout
- `src/components/layout/breadcrumbs.tsx` - Path-based breadcrumbs with Indonesian labels
- `src/components/layout/session-provider.tsx` - Client wrapper for NextAuth SessionProvider
- `src/components/shared/stat-card.tsx` - Reusable stat card with icon, title, value, description
- `src/components/shared/loading-skeleton.tsx` - TableSkeleton, CardSkeleton, StatCardSkeleton
- `src/components/shared/confirm-dialog.tsx` - AlertDialog wrapper with destructive variant
- `src/components/shared/data-table.tsx` - TanStack React Table with search and pagination
- `src/components/shared/data-table-pagination.tsx` - Indonesian pagination controls

## Decisions Made
- Created SessionProvider as separate client component rather than putting it in root layout -- keeps root layout clean and only applies session context to dashboard routes
- Sidebar uses dark slate-800/900 theme for visual contrast with white content area
- Mobile sidebar implemented via shadcn Sheet component (slide-out drawer) triggered from header hamburger
- DataTable initializes with pageSize 25 matching DEFAULT_PAGE_SIZE from constants.ts
- Auth stub created for parallel execution safety -- plan 01-02 replaced it with real implementation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added SessionProvider wrapper component**
- **Found during:** Task 1
- **Issue:** Client components (sidebar, header) need useSession() which requires SessionProvider, but plan didn't specify creating one
- **Fix:** Created src/components/layout/session-provider.tsx as client component wrapping NextAuth SessionProvider
- **Files modified:** src/components/layout/session-provider.tsx
- **Verification:** TypeScript compiles, useSession() calls have provider context
- **Committed in:** 24a4236 (Task 1 commit)

**2. [Rule 3 - Blocking] Installed shadcn alert-dialog and skeleton components**
- **Found during:** Task 2 (prerequisite check)
- **Issue:** ConfirmDialog needs alert-dialog and LoadingSkeleton needs skeleton -- neither was installed
- **Fix:** Ran `npx shadcn@latest add alert-dialog skeleton`
- **Files modified:** src/components/ui/alert-dialog.tsx, src/components/ui/skeleton.tsx, package.json
- **Verification:** Components import correctly, TypeScript compiles
- **Committed in:** 24a4236 (Task 1 commit, staged together)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking)
**Impact on plan:** Both auto-fixes necessary for correct operation. No scope creep.

## Issues Encountered
- Auth.ts was being created concurrently by plan 01-02. The parallel plan completed and replaced the stub before TypeScript verification ran, so no actual compilation issues occurred.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dashboard layout shell complete and ready for all feature pages to render inside it
- Shared components (StatCard, DataTable, ConfirmDialog) ready for use by plans 01-05 through 01-09
- Dashboard placeholder page will be replaced by plan 01-09 with actual metrics

---
*Phase: 01-foundation*
*Completed: 2026-02-27*
