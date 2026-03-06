---
phase: 03-attendance-leave-management
plan: 08
subsystem: api
tags: [xlsx, react-pdf, export, attendance, route-handler, next-auth]

# Dependency graph
requires:
  - phase: 03-attendance-leave-management
    provides: getMonthlyAttendanceRecap service with employee.position included
  - phase: 03-attendance-leave-management
    provides: AttendanceSummaryTable and attendance admin page structure
provides:
  - /api/attendance/export GET route returning XLSX or PDF on ?format= param
  - AttendancePDFDocument React component for @react-pdf/renderer
  - ExportButtons dropdown client component wired into attendance admin header
affects: [phase-4-payroll, future-report-exports]

# Tech tracking
tech-stack:
  added: [xlsx, @react-pdf/renderer, @types/xlsx]
  patterns:
    - renderToStream + for-await chunk collection for server-side PDF generation
    - React.createElement cast to DocumentProps for renderToStream type compat
    - Buffer -> Uint8Array conversion for Web API Response BodyInit compat
    - XLSX.write with type:"buffer" + auto-column-width calculation

key-files:
  created:
    - src/lib/pdf/attendance-pdf.tsx
    - src/app/api/attendance/export/route.ts
    - src/app/(dashboard)/attendance-admin/_components/export-buttons.tsx
  modified:
    - src/app/(dashboard)/attendance-admin/page.tsx
    - package.json
    - package-lock.json

key-decisions:
  - "React.createElement cast to ReactElement<DocumentProps> for renderToStream type compatibility"
  - "Buffer converted to new Uint8Array(buffer) for Web API Response BodyInit compatibility"
  - "ExportButtons only rendered for isHRAdmin (HR_ADMIN + SUPER_ADMIN), not MANAGER"
  - "position already included in getMonthlyAttendanceRecap service — no service change needed"

patterns-established:
  - "Server-side PDF export: renderToStream + for-await + Uint8Array response"
  - "Server-side XLSX export: XLSX.utils.json_to_sheet + auto-width cols + Uint8Array response"

# Metrics
duration: 6min
completed: 2026-03-06
---

# Phase 3 Plan 08: Attendance Export API Summary

**Server-side XLSX and PDF export for monthly attendance recap via /api/attendance/export route, using xlsx and @react-pdf/renderer with React.createElement for SSR-safe PDF generation**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-06T08:10:03Z
- **Completed:** 2026-03-06T08:16:03Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Installed xlsx and @react-pdf/renderer; created AttendancePDFDocument component with landscape A4 layout
- Built /api/attendance/export route handler returning XLSX or PDF based on `?format=` query param, role-gated to HR_ADMIN/SUPER_ADMIN
- Added ExportButtons dropdown to attendance admin page header, visible only to HR admins

## Task Commits

Each task was committed atomically:

1. **Task 1: Install export libraries and create AttendancePDFDocument component** - `685813b` (feat)
2. **Task 2: Create export Route Handler and ExportButtons component** - `4aefaa5` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/lib/pdf/attendance-pdf.tsx` - AttendancePDFDocument component using @react-pdf/renderer primitives, landscape A4 with 9-column table
- `src/app/api/attendance/export/route.ts` - GET route handler returning XLSX or PDF; role-gated, stream-to-buffer PDF, auto-width XLSX
- `src/app/(dashboard)/attendance-admin/_components/export-buttons.tsx` - Client dropdown with Excel and PDF download links
- `src/app/(dashboard)/attendance-admin/page.tsx` - Added ExportButtons import and render in header actions area
- `package.json` / `package-lock.json` - Added xlsx, @react-pdf/renderer, @types/xlsx

## Decisions Made

- **React.createElement cast to `ReactElement<DocumentProps>`**: `renderToStream` types require `ReactElement<DocumentProps, ...>` but `React.createElement` returns `FunctionComponentElement<Props>`. Cast resolves the type incompatibility without runtime impact.
- **Buffer to `new Uint8Array(buffer)`**: Next.js Route Handler `Response` uses the Web API `BodyInit` type which does not accept Node.js `Buffer`. Converting to `Uint8Array` satisfies the type and works correctly at runtime.
- **ExportButtons only for isHRAdmin**: MANAGER role can view the admin page but export is restricted to HR_ADMIN/SUPER_ADMIN to match the API route's auth check.
- **position already in service**: `getMonthlyAttendanceRecap` already included `position: { select: { name: true } }`, so no service modification was needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Cast React.createElement result for renderToStream type compatibility**

- **Found during:** Task 2 (TypeScript check)
- **Issue:** `renderToStream` parameter type is `ReactElement<DocumentProps, string | JSXElementConstructor<any>>`, but `React.createElement` returns `FunctionComponentElement<AttendancePDFDocumentProps>`. Types incompatible.
- **Fix:** Stored element in variable with explicit cast to `ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>`
- **Files modified:** src/app/api/attendance/export/route.ts
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 4aefaa5 (Task 2 commit)

**2. [Rule 1 - Bug] Convert Buffer to Uint8Array for Response BodyInit compatibility**

- **Found during:** Task 2 (TypeScript check)
- **Issue:** `new Response(buffer)` where buffer is Node.js `Buffer` fails type check — Web API `BodyInit` does not include `Buffer`
- **Fix:** Wrapped buffers in `new Uint8Array(buffer)` for both PDF and XLSX responses
- **Files modified:** src/app/api/attendance/export/route.ts
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 4aefaa5 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 type bugs)
**Impact on plan:** Both fixes required for TypeScript correctness; no scope change.

## Issues Encountered

None beyond the type fixes documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Attendance export feature complete; ATT-07 requirement fulfilled
- Phase 3 attendance management module now has clock-in/out, admin recap, manual override, leave management, leave approval, and export
- Phase 4 (Payroll) can proceed; attendance records and totals are accessible via getMonthlyAttendanceRecap

---
*Phase: 03-attendance-leave-management*
*Completed: 2026-03-06*
