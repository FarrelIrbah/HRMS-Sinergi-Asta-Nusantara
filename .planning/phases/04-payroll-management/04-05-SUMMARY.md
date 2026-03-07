---
phase: 04-payroll-management
plan: "05"
subsystem: api
tags: [react-pdf, pdf, payslip, payroll, role-based-access]

# Dependency graph
requires:
  - phase: 04-03
    provides: PayrollEntry model with all salary/BPJS/PPh21 fields stored as snapshots
  - phase: 03-08
    provides: renderToStream PDF streaming pattern (attendance-pdf.tsx + export route)
provides:
  - PayslipDocument react-pdf component (src/lib/pdf/payslip-pdf.tsx)
  - GET /api/payroll/payslip/[entryId] PDF streaming route with role-based auth
  - /payslip employee-facing page (payslip history + download links)
affects:
  - 04-06 (navigation sidebar may need /payslip link for employee role)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "renderToStream pattern: React.createElement cast to ReactElement<DocumentProps>, collect AsyncIterable<Buffer|string> chunks, Buffer.concat, new Uint8Array()"
    - "Role-based API auth: isHR gate then employee.findUnique({ where: { userId: session.user.id } }) to verify own resource"
    - "FINALIZED guard: payrollRun.status check before PDF generation returns 400"

key-files:
  created:
    - src/lib/pdf/payslip-pdf.tsx
    - src/app/api/payroll/payslip/[entryId]/route.ts
    - src/app/(dashboard)/payslip/page.tsx
  modified: []

key-decisions:
  - "{ prisma } named import from @/lib/prisma (not default import) — matches project export pattern"
  - "Allowance map callback typed explicitly as { name: string; amount: { toString: () => string } } for strict TS compliance"
  - "HR/SUPER_ADMIN on /payslip page: redirect info with link to /payroll rather than error"
  - "Download button uses asChild + <a href target=_blank download> (not a button onclick) matching Decision 59 from 04-04"

patterns-established:
  - "Payslip PDF pattern: PayslipDocument(data) → renderToStream → collect chunks → Uint8Array response"
  - "Employee self-service pages: auth() check → employee.findUnique({ userId: session.user.id }) → role-gated content"

# Metrics
duration: 4min
completed: 2026-03-07
---

# Phase 4 Plan 05: Payslip PDF Download Summary

**react-pdf PayslipDocument component, PDF streaming API route with role-based 403/400 guards, and employee self-service /payslip page**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-07T12:47:04Z
- **Completed:** 2026-03-07T12:50:58Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- PayslipDocument renders A4 payslip PDF with Indonesian labels across 5 sections: employee info, earnings table, deductions table, employer contributions info box, and GAJI BERSIH take-home pay box
- PDF API route at `/api/payroll/payslip/[entryId]` enforces role-based access (EMPLOYEE gets 403 for another employee's payslip, DRAFT payroll gets 400)
- Employee-facing `/payslip` page lists FINALIZED payroll periods with Unduh PDF download buttons; HR roles see redirect message to /payroll

## Task Commits

1. **Task 1: Create payslip-pdf.tsx react-pdf Document component** - `56df5c6` (feat)
2. **Task 2: API route for payslip PDF download and employee payslip page** - `f11e3cc` (feat)

## Files Created/Modified

- `src/lib/pdf/payslip-pdf.tsx` - PayslipDocument react-pdf component with PayslipData interface; formatRupiah Rp X.XXX.XXX formatter; StyleSheet.create with Helvetica (server-safe)
- `src/app/api/payroll/payslip/[entryId]/route.ts` - GET route: auth → findUnique → role check → FINALIZED guard → renderToStream → Uint8Array Response
- `src/app/(dashboard)/payslip/page.tsx` - Server component: HR redirect info, employee payslip list with download anchors

## Decisions Made

- Used `{ prisma }` named import (not default) — prisma.ts uses `export const prisma`, not `export default`
- Explicit type annotation on allowances.map callback to satisfy strict TS (Prisma Decimal type inference gap in strict mode)
- /payslip for HR roles renders an info card with link to /payroll rather than a redirect — preserves navigability

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Prisma import pattern in both new files**
- **Found during:** Task 2 verification (npx tsc --noEmit)
- **Issue:** Plan scaffold used `import prisma from "@/lib/prisma"` (default import) but project exports as `export const prisma` (named import)
- **Fix:** Changed to `import { prisma } from "@/lib/prisma"` in both route.ts and page.tsx
- **Files modified:** src/app/api/payroll/payslip/[entryId]/route.ts, src/app/(dashboard)/payslip/page.tsx
- **Verification:** npx tsc --noEmit exits 0
- **Committed in:** f11e3cc (Task 2 commit)

**2. [Rule 1 - Bug] Added explicit type to allowances.map callback**
- **Found during:** Task 2 verification (npx tsc --noEmit)
- **Issue:** Parameter 'a' implicitly has 'any' type — Prisma Decimal type inference gap under strict TS
- **Fix:** Added explicit `(a: { name: string; amount: { toString: () => string } })` annotation matching EmployeeAllowance shape
- **Files modified:** src/app/api/payroll/payslip/[entryId]/route.ts
- **Verification:** npx tsc --noEmit exits 0
- **Committed in:** f11e3cc (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking import pattern, 1 TypeScript strict compliance)
**Impact on plan:** Both fixes required for correct compilation. No scope creep.

## Issues Encountered

None beyond the auto-fixed TypeScript errors above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- PAY-07 complete: employees can download their monthly payslip PDF
- /payslip page needs to be added to the sidebar navigation for EMPLOYEE role (plan 04-06 or navigation plan)
- PDF output ready for visual verification in plan 04-08 (human-verify checkpoint)

---
*Phase: 04-payroll-management*
*Completed: 2026-03-07*
