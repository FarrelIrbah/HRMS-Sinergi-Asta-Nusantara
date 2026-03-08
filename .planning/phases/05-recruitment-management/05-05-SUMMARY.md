---
phase: 05
plan: 05
title: "Candidate detail page, CV upload, interview scheduling, offer fields"
subsystem: recruitment
tags: [nextjs, server-component, react-hook-form, zod, file-upload, recruitment]

dependency-graph:
  requires:
    - 05-01  # Vacancy/Candidate/Interview schema and enums
    - 05-02  # recruitment.service.ts, recruitment.actions.ts, CV upload route
    - 05-03  # /recruitment list page (provides breadcrumb target)
  provides:
    - /recruitment/candidates/[candidateId] page
    - CandidateDetailClient with CV upload, interview scheduling, offer form
    - Convert to Employee flow (redirects to /employees/new with prefill)
  affects:
    - 05-04  # Kanban board links to /recruitment/candidates/[candidateId]
    - 05-06  # Possibly references candidate detail in reporting

tech-stack:
  added: []
  patterns:
    - Server component serializes dates and Decimal before passing to client
    - Discriminated union narrowing for convertCandidateToEmployeeAction result
    - useTransition for server action calls with router.refresh() after mutations
    - zodResolver cast as Resolver<T> for coerce.date() and coerce.number() schemas

file-tracking:
  created:
    - src/app/(dashboard)/recruitment/candidates/[candidateId]/page.tsx
    - src/app/(dashboard)/recruitment/candidates/[candidateId]/_components/candidate-detail-client.tsx
  modified: []

decisions:
  - id: 69
    decision: "Discriminated union narrowed with result.success check for convertCandidateToEmployeeAction"
    rationale: "Action returns { success: true; prefill } | { success: false; error }; plan scaffold used result.error/result.prefill directly which would fail TS; narrowed via if (!result.success)"
    plan: "05-05"

metrics:
  tasks-total: 2
  tasks-completed: 2
  deviations: 1
  duration: "~10 minutes"
  completed: "2026-03-08"
---

# Phase 5 Plan 05: Candidate Detail Page Summary

**One-liner:** Candidate detail hub at /recruitment/candidates/[candidateId] with CV upload, interview scheduling form, offer fields, and Convert to Employee flow.

## What Was Built

The candidate detail page provides a per-candidate management hub accessible from Kanban card links (plan 05-04). It is a server component that fetches the candidate with vacancy, department, and interviews, serializes all dates and Decimal fields, then delegates to a client component for all interactive features.

The client component (`CandidateDetailClient`) includes:
- Candidate header: name, email, phone, stage badge, vacancy/department context
- Candidate notes display
- CV upload (POST to /api/recruitment/cv) with upload state, error feedback, and "Ganti CV" for replacement
- Interview list (sorted ascending by scheduledAt)
- Add interview form (scheduledAt datetime-local, interviewerName, notes) using react-hook-form + zod
- Offer fields form (offerSalary, offerNotes) shown only for PENAWARAN and DITERIMA stages
- Convert to Employee button shown for DITERIMA stage without hiredAt; redirects to /employees/new with URLSearchParams prefill

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Candidate detail page | 126bb46 | src/app/(dashboard)/recruitment/candidates/[candidateId]/page.tsx |
| 2 | Candidate detail client component | 893dafc | src/app/(dashboard)/recruitment/candidates/[candidateId]/_components/candidate-detail-client.tsx |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Narrowed discriminated union for convertCandidateToEmployeeAction**

- **Found during:** Task 2
- **Issue:** Plan scaffold used `result.error` and `result.prefill` directly on the action result, but the action returns a discriminated union `{ success: true; prefill: {...} } | { success: false; error: string }`. TypeScript would reject accessing `.prefill` without narrowing.
- **Fix:** Changed `if (result.error)` to `if (!result.success)` so TypeScript narrows the union correctly before accessing `result.prefill`.
- **Files modified:** candidate-detail-client.tsx
- **Commit:** 893dafc

**2. [Rule 2 - Missing Critical] Typed fetch response in handleCvUpload**

- **Found during:** Task 2
- **Issue:** `const data = await res.json()` returned `any`; accessing `data.error` would be an implicit any.
- **Fix:** Added type assertion `as { error?: string }` to the json() call for strict TS compliance.
- **Files modified:** candidate-detail-client.tsx
- **Commit:** 893dafc

## Success Criteria Verification

- [x] /recruitment/candidates/[candidateId] page fetches candidate data
- [x] CandidateDetailClient shows candidate info, CV upload, interview list, interview form
- [x] Offer fields shown for PENAWARAN/DITERIMA stage
- [x] Convert to Employee button shown for DITERIMA stage (without hiredAt)
- [x] No TypeScript errors (tsc --noEmit clean)

## Next Phase Readiness

This plan is a dependency for:
- **05-04** (Vacancy detail + Kanban): Kanban cards link to /recruitment/candidates/[candidateId] — this page is now available
- **05-06/07**: Remaining plans can proceed; candidate detail is complete
