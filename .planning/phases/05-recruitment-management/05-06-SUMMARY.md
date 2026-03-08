---
phase: "05"
plan: "06"
name: "Offer letter PDF and candidate-to-employee conversion"
subsystem: recruitment
tags: [pdf, react-pdf, offer-letter, recruitment, candidate]

dependency-graph:
  requires:
    - 04-05  # payslip PDF patterns (renderToStream, Uint8Array, React.createElement cast)
    - 05-02  # convertCandidateToEmployeeAction, recruitment server actions
    - 05-05  # candidate detail page with stage-gated UI
  provides:
    - offer-letter-pdf-route   # GET /api/recruitment/offer-letter/[candidateId]
    - offer-letter-document    # OfferLetterDocument React-PDF component
    - offer-letter-download-ui # Download anchor in candidate detail page
  affects:
    - 05-07  # final phase plan (pipeline complete after this)

tech-stack:
  added: []
  patterns:
    - react-pdf Document/Page/View/Text/StyleSheet for PDF generation
    - renderToStream + Buffer + Uint8Array for route handler streaming (Decision 43)
    - React.createElement cast to ReactElement<DocumentProps> (Decision 42)
    - Direct anchor tag (not Button asChild) for PDF download links (Decision 66)

file-tracking:
  created:
    - src/lib/pdf/offer-letter-pdf.tsx
    - src/app/api/recruitment/offer-letter/[candidateId]/route.ts
  modified:
    - src/app/(dashboard)/recruitment/candidates/[candidateId]/_components/candidate-detail-client.tsx

decisions:
  - id: 70
    decision: "offer-letter-pdf placed in src/lib/pdf/ not src/components/pdf/"
    rationale: "Established project convention — payslip-pdf.tsx and attendance-pdf.tsx both live in src/lib/pdf/. src/components/pdf/ does not exist in this project."
    plan: "05-06"

metrics:
  duration: "~15 minutes"
  completed: "2026-03-08"
---

# Phase 05 Plan 06: Offer Letter PDF and Candidate-to-Employee Conversion Summary

**One-liner:** Offer letter PDF generation using @react-pdf/renderer with streaming route and download anchor gated on DITERIMA stage + offerSalary.

## What Was Built

This plan delivers the final two recruitment pipeline actions for accepted candidates (stage = DITERIMA):

1. **Offer letter PDF component** (`src/lib/pdf/offer-letter-pdf.tsx`) — `OfferLetterDocument` renders an A4 PDF with company header, recipient block, position/department/salary detail table, closing paragraph, and HR signature block using the same `@react-pdf/renderer` patterns established in plan 04-05.

2. **Offer letter API route** (`GET /api/recruitment/offer-letter/[candidateId]`) — HR_ADMIN/SUPER_ADMIN only. Validates candidate is in DITERIMA stage and has `offerSalary` set before streaming the PDF. Uses `renderToStream` + `Buffer` + `Uint8Array` (Decisions 42/43).

3. **Download button wired to candidate detail page** — A direct `<a>` anchor (Decision 66) labeled "Download Surat Penawaran" appears alongside the "Konversi ke Karyawan" button when stage is DITERIMA and `offerSalary` is populated.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install @react-pdf/renderer | (pre-existing from 04-05) | package.json |
| 2 | Offer letter PDF document component | 74ce885 | src/lib/pdf/offer-letter-pdf.tsx |
| 3 | Offer letter PDF API route | 75ce71d | src/app/api/recruitment/offer-letter/[candidateId]/route.ts |
| 4 | Wire offer letter download to candidate detail page | 56edace | candidate-detail-client.tsx |

## Decisions Made

| # | Decision | Rationale |
|---|----------|-----------|
| 70 | `offer-letter-pdf.tsx` placed in `src/lib/pdf/` | Matches `payslip-pdf.tsx` and `attendance-pdf.tsx` location; `src/components/pdf/` does not exist in this project |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] PDF component location changed from src/components/pdf/ to src/lib/pdf/**

- **Found during:** Task 2
- **Issue:** Plan specified `src/components/pdf/offer-letter-pdf.tsx` but the project places all PDF components in `src/lib/pdf/` (payslip-pdf.tsx, attendance-pdf.tsx). `src/components/pdf/` directory does not exist.
- **Fix:** Created component at `src/lib/pdf/offer-letter-pdf.tsx` matching established project convention. Import path in route.ts updated accordingly.
- **Files modified:** Route import updated to `@/lib/pdf/offer-letter-pdf`
- **Commit:** 74ce885, 75ce71d

**2. Task 1 (@react-pdf/renderer install) already complete**

- @react-pdf/renderer was installed in plan 04-05 (commit 56df5c6). `npm install` was a no-op and `package.json` was already committed clean. No new commit needed for Task 1.

## Next Phase Readiness

Phase 5 has one plan remaining (05-07). The offer letter download and candidate detail page are complete. The recruitment pipeline end-to-end is now functional:

- Vacancy created → Kanban board shows candidates by stage
- Candidate progresses through stages via Kanban drag/actions
- DITERIMA stage: offer letter PDF downloadable, convert to employee available
- Conversion redirects to /employees/new with pre-filled fields

**No blockers for 05-07.**
