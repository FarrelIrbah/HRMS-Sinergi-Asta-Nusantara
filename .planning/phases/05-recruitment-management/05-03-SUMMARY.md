---
phase: 05-recruitment-management
plan: "03"
subsystem: ui
tags: [nextjs, react-hook-form, zod, shadcn, recruitment, vacancy]

# Dependency graph
requires:
  - phase: 05-recruitment-management
    provides: recruitment service layer (getVacancies, createVacancySchema, toggleVacancyStatusAction)
provides:
  - /recruitment list page with filterable vacancy table
  - /recruitment/new create vacancy form with all required fields
  - VacancyTable client component with status filter and toggle action
  - CreateVacancyForm client component with zodResolver and coerce.date pattern
affects: [05-04-vacancy-detail, 05-05-candidate-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - zodResolver cast as Resolver<T> for coerce.date() schemas
    - Date input with ISO split/new Date() round-trip for HTML date inputs
    - useTransition for server action loading state in client components
    - URL searchParams filter via useSearchParams + router.push

key-files:
  created:
    - src/app/(dashboard)/recruitment/page.tsx
    - src/app/(dashboard)/recruitment/_components/vacancy-table.tsx
    - src/app/(dashboard)/recruitment/new/page.tsx
    - src/app/(dashboard)/recruitment/new/_components/create-vacancy-form.tsx
  modified: []

key-decisions:
  - "Local Department interface in CreateVacancyForm props (id, name) instead of importing Prisma type"
  - "Status filter uses _all sentinel for Select empty state (matches Decision 21 pattern)"
  - "Direct anchor tags for View link and Buat Lowongan to avoid Button asChild complexity"

patterns-established:
  - "Vacancy filter: useSearchParams + params.delete/set + router.push for URL-driven filter without nuqs"

# Metrics
duration: 12min
completed: 2026-03-08
---

# Phase 5 Plan 03: Vacancy List and Create Form Summary

**Recruitment entry point: filterable vacancy table at /recruitment and create form at /recruitment/new using react-hook-form + zod with coerce.date() cast pattern**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-08T08:25:00Z
- **Completed:** 2026-03-08T08:37:00Z
- **Tasks:** 2
- **Files modified:** 4 created

## Accomplishments
- /recruitment page with server-side vacancy fetch and HR_ADMIN/SUPER_ADMIN auth guard
- VacancyTable with status filter (Select via URL) and toggle status button using useTransition
- /recruitment/new page with department data fetch passed as props to client form
- CreateVacancyForm with all 6 fields, zodResolver cast, date input ISO formatting, redirect on success

## Task Commits

Each task was committed atomically:

1. **Task 1: Vacancy list page** - `bd6f434` (feat)
2. **Task 2: Create vacancy form** - `f803cf3` (feat)

**Plan metadata:** (next commit — docs)

## Files Created/Modified
- `src/app/(dashboard)/recruitment/page.tsx` - Server component; fetches vacancies with optional status filter; HR/SA auth guard
- `src/app/(dashboard)/recruitment/_components/vacancy-table.tsx` - Client component with Select status filter (URL-driven), vacancy table, toggle status button
- `src/app/(dashboard)/recruitment/new/page.tsx` - Server component; fetches departments; HR/SA auth guard
- `src/app/(dashboard)/recruitment/new/_components/create-vacancy-form.tsx` - Client form with react-hook-form, zodResolver cast, date inputs, createVacancyAction call

## Decisions Made
- Local `Department` interface `{ id: string; name: string }` in form props rather than importing Prisma-generated type — simpler and avoids server/client boundary issues
- Status filter uses `_all` sentinel for the "Semua Status" SelectItem, consistent with Decision 21 pattern
- Date inputs styled with Tailwind classes matching shadcn Input to maintain visual consistency without wrapping in FormControl (bare native input)
- Direct `<a>` anchors for navigation links (View vacancy, Buat Lowongan header button) following Decision 66 pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- /recruitment and /recruitment/new are fully functional entry points to the recruitment module
- Vacancy detail page (/recruitment/[id]) is next — needed to view candidates and manage pipeline
- Service layer (getVacancyById, getCandidateById) already exists from plan 05-02

---
*Phase: 05-recruitment-management*
*Completed: 2026-03-08*
