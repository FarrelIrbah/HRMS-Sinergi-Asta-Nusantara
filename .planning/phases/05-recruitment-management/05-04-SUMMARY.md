---
phase: 05-recruitment-management
plan: "04"
subsystem: ui
tags: [dnd-kit, kanban, drag-and-drop, react-hook-form, shadcn, recruitment]

# Dependency graph
requires:
  - phase: 05-recruitment-management/05-02
    provides: recruitment.service.ts (getVacancyById, VacancyDetail type), recruitment.actions.ts (updateCandidateStageAction, createCandidateAction)
  - phase: 05-recruitment-management/05-01
    provides: CandidateStage enum in @/types/enums, createCandidateSchema, updateCandidateStageSchema
provides:
  - /recruitment/[vacancyId] page with vacancy info, breadcrumb, and candidate count
  - KanbanBoard component with 6-column drag-and-drop using @dnd-kit, optimistic updates with rollback
  - AddCandidateDialog with react-hook-form + Zod validation for adding new candidates
  - AddCandidateDialogWrapper client adapter for use in server component pages
affects:
  - 05-05 (candidate detail page — links from KanbanBoard cards to /recruitment/candidates/[id])
  - 05-06 (interview scheduling — sits inside candidate detail)
  - 05-07 (offer management and candidate conversion — DITERIMA stage links to offer form)

# Tech tracking
tech-stack:
  added:
    - "@dnd-kit/core ^6.3.1 — DnD context, sensors, drag overlay, collision detection"
    - "@dnd-kit/sortable ^10.0.0 — useSortable hook, SortableContext, verticalListSortingStrategy"
    - "@dnd-kit/utilities ^3.2.2 — CSS.Transform utility"
  patterns:
    - "Optimistic update with rollback: setState before server action, revert on error"
    - "Client wrapper pattern: thin 'use client' component wraps dialog to provide router.refresh() as onSuccess"
    - "Kanban DnD: DndContext wraps all columns; over.id disambiguation between card-id and stage-id"

key-files:
  created:
    - src/app/(dashboard)/recruitment/[vacancyId]/page.tsx
    - src/app/(dashboard)/recruitment/[vacancyId]/_components/kanban-board.tsx
    - src/app/(dashboard)/recruitment/[vacancyId]/_components/add-candidate-dialog.tsx
    - src/app/(dashboard)/recruitment/[vacancyId]/_components/add-candidate-wrapper.tsx
  modified:
    - package.json (added @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities)

key-decisions:
  - "vacancyId prop prefixed _vacancyId in KanbanBoard — received for interface completeness but server action resolves vacancy internally from candidateId"
  - "UniqueIdentifier (string | number) cast to string for active.id — candidate IDs are CUID strings at runtime"
  - "over.id disambiguation: check candidates array first, then STAGE_ORDER array, fallback to current stage (no-op)"

patterns-established:
  - "Client wrapper pattern: server page imports 'XWrapper' which is 'use client' and wires router.refresh() to onSuccess"
  - "Optimistic kanban: useState + startTransition; rollback via captured prevCandidates closure"

# Metrics
duration: 15min
completed: 2026-03-08
---

# Phase 5 Plan 04: Vacancy Detail with Kanban Board Summary

**@dnd-kit multi-column Kanban board for candidate pipeline stage movement with optimistic updates and AddCandidateDialog on the /recruitment/[vacancyId] detail page**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-08T08:40:00Z
- **Completed:** 2026-03-08T08:55:00Z
- **Tasks:** 4
- **Files modified:** 5 (1 modified, 4 created)

## Accomplishments

- Installed @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities with zero TypeScript errors
- KanbanBoard with 6 CandidateStage columns, PointerSensor (5px activation distance), DragOverlay ghost card, optimistic state update with rollback on server action error
- AddCandidateDialog with shadcn Dialog + react-hook-form + createCandidateSchema Zod validation, sonner toasts
- VacancyDetailPage (server component) with auth guard, breadcrumb navigation, vacancy metadata grid, and integrated Kanban board

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @dnd-kit packages** - `dc3ec01` (chore)
2. **Task 2: Kanban board component** - `692a0ca` (feat)
3. **Task 3: Add candidate dialog** - `9163010` (feat)
4. **Task 4: Vacancy detail page** - `b8ab2df` (feat)

**Plan metadata:** _(pending — docs commit)_

## Files Created/Modified

- `package.json` — added @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
- `src/app/(dashboard)/recruitment/[vacancyId]/page.tsx` — vacancy detail server page with auth guard and Kanban
- `src/app/(dashboard)/recruitment/[vacancyId]/_components/kanban-board.tsx` — DndContext multi-column board, CandidateCard (useSortable), KanbanColumn (SortableContext), optimistic updates
- `src/app/(dashboard)/recruitment/[vacancyId]/_components/add-candidate-dialog.tsx` — Dialog + Form dialog for adding candidates with validation
- `src/app/(dashboard)/recruitment/[vacancyId]/_components/add-candidate-wrapper.tsx` — thin client wrapper wiring router.refresh() as onSuccess

## Decisions Made

- `vacancyId` prop kept in `KanbanBoardProps` interface but prefixed `_vacancyId` internally — `updateCandidateStageAction` looks up vacancy internally from candidateId, so the board doesn't need to pass it. Kept in interface for API symmetry and future use.
- `over.id` disambiguation logic: when drag ends, `over.id` is either a candidate's CUID (dropped on a card) or a stage string (dropped on column area). Candidates array checked first, then STAGE_ORDER array, then fallback no-op.
- Used `UniqueIdentifier` import from @dnd-kit/core to properly type `event.active.id`, then cast `as string` when passing to server action (safe because all candidate IDs are CUIDs).

## Deviations from Plan

None - plan executed exactly as written. The `_vacancyId` naming and `UniqueIdentifier` type handling are natural TypeScript adaptations, not deviations from plan intent.

## Issues Encountered

None — all @dnd-kit packages installed successfully, all TypeScript checks passed with zero errors across all four tasks.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- /recruitment/[vacancyId] fully operational — clicking a vacancy from the list page navigates to the Kanban board
- Candidate cards link to /recruitment/candidates/[id] (plan 05-05 builds this page)
- Stage drag-and-drop wired to updateCandidateStageAction — tested to compile cleanly
- Ready for plan 05-05 (candidate detail page with CV upload and interview list)

---
*Phase: 05-recruitment-management*
*Completed: 2026-03-08*
