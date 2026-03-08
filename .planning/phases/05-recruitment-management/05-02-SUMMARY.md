---
plan: "05-02"
phase: 5
subsystem: recruitment
tags: [service-layer, server-actions, api-route, cv-upload, recruitment]
requires: ["05-01"]
provides: ["recruitment.service.ts", "recruitment.actions.ts", "api/recruitment/cv"]
affects: ["05-03", "05-04", "05-05", "05-06", "05-07"]
tech-stack:
  added: []
  patterns: ["service-query separation", "requireHRAdmin local helper", "file upload API route"]
key-files:
  created:
    - src/lib/services/recruitment.service.ts
    - src/lib/actions/recruitment.actions.ts
    - src/app/api/recruitment/cv/route.ts
  modified: []
decisions:
  - id: 68
    summary: "createAuditLog called with module/targetId/newValue (not entity/entityId/newData)"
    plan: "05-02"
metrics:
  duration: "~12 minutes"
  completed: "2026-03-08"
---

# Phase 5 Plan 02: Recruitment Service Layer Summary

**One-liner:** Typed Prisma query services and validated server actions for all recruitment CRUD operations, plus a file-upload API route for candidate CVs.

## What Was Built

### recruitment.service.ts

Pure read-query functions with typed return helpers:

- `getVacancies(status?)` — list with department include and candidate count
- `getVacancyById(id)` — full tree including candidates and their interviews
- `getOpenVacancyCount()` — scalar count for dashboard widgets
- `getCandidateById(id)` — full detail with vacancy, department, and interviews
- `VacancyWithCounts`, `VacancyDetail`, `CandidateDetail` — inferred type exports for UI plans

### recruitment.actions.ts

All server actions with `"use server"`, local `requireHRAdmin()` helper, Zod validation, and audit logging:

- Vacancy: `createVacancyAction`, `updateVacancyAction`, `toggleVacancyStatusAction`
- Candidate: `createCandidateAction`, `updateCandidateStageAction`, `updateOfferAction`
- Interview: `createInterviewAction`
- Conversion: `convertCandidateToEmployeeAction` — guards `stage === "DITERIMA"`, marks `hiredAt`, returns prefill data for employee creation form

### api/recruitment/cv/route.ts

`POST /api/recruitment/cv` — multipart file upload handler:

- Auth: HR_ADMIN / SUPER_ADMIN only
- Validates MIME (PDF/JPEG/PNG) and file size (5MB max)
- Confirms candidate exists in DB before writing
- Saves to `uploads/cv/{candidateId}-cv.{ext}`
- Updates `candidate.cvPath` in database

## Decisions Made

| # | Decision | Rationale |
|---|----------|-----------|
| 68 | `createAuditLog` called with `module`/`targetId`/`newValue` | Actual signature in `@/lib/prisma` differs from plan scaffold which used `entity`/`entityId`/`newData`; adapted to match real implementation |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Adapted createAuditLog call signature**

- **Found during:** Task 2
- **Issue:** Plan scaffold used `{ action, entity, entityId, newData }` but `createAuditLog` in `@/lib/prisma` requires `{ action, module, targetId, newValue }`.
- **Fix:** Read `src/lib/prisma.ts` and existing actions (leave.actions.ts, employee-document.actions.ts) to confirm actual signature; used `module` and `targetId` throughout recruitment.actions.ts.
- **Files modified:** `src/lib/actions/recruitment.actions.ts`

**2. [Rule 2 - Missing Critical] Added MIME type and file size validation to CV upload route**

- **Found during:** Task 3
- **Issue:** Plan scaffold did not include input validation for file type or size — accepting arbitrary uploads is a security gap.
- **Fix:** Added `ALLOWED_MIME_TYPES` and `MAX_FILE_SIZE` guards matching the pattern in `employees/[id]/documents/route.ts`.
- **Files modified:** `src/app/api/recruitment/cv/route.ts`

**3. [Rule 2 - Missing Critical] Used `Role` enum for role check in CV route**

- **Found during:** Task 3
- **Issue:** Plan scaffold used bare string `"HR_ADMIN"` for role check; project pattern imports `Role` from `@/types/enums` in all route handlers.
- **Fix:** Used `Role.HR_ADMIN` and `Role.SUPER_ADMIN` for consistency.
- **Files modified:** `src/app/api/recruitment/cv/route.ts`

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | b4f504c | feat(05-02): recruitment service layer |
| 2 | bfd706a | feat(05-02): recruitment server actions |
| 3 | f54042f | feat(05-02): CV upload API route |

## Next Phase Readiness

All UI plans (05-03, 05-04, 05-05) can now consume:

- `getVacancies`, `getVacancyById` for server-side page data
- `createVacancyAction`, `updateVacancyAction`, `toggleVacancyStatusAction` for vacancy forms
- `createCandidateAction`, `updateCandidateStageAction`, `updateOfferAction` for candidate management
- `createInterviewAction` for interview scheduling
- `convertCandidateToEmployeeAction` for the hire-to-employee flow
- `POST /api/recruitment/cv` for CV file uploads
