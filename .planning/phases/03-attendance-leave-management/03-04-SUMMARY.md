---
phase: 03-attendance-leave-management
plan: 04
subsystem: ui
tags: [nextjs, react, prisma, geolocation, attendance, server-components, date-fns]

# Dependency graph
requires:
  - phase: 03-02
    provides: clockInAction, clockOutAction server actions with GPS/IP location verification
  - phase: 03-01
    provides: attendance.service.ts with getTodayRecord, getWeeklySummary, getEmployeeAttendance
provides:
  - Employee-facing /attendance route with server-rendered page
  - ClockInButton client component with GPS collection flow and IP fallback
  - AttendanceToday card showing clock-in/out times and weekly summary grid
  - AttendanceHistory table showing last 7 days with status badges
  - Sidebar navigation with Absensi and Cuti links for all roles
affects: [03-05, 04-payroll-management, leave-management-UI]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - GPS geolocation collected client-side in ClockInButton; fallback to IP-only on denial or timeout
    - Server component page fetches data via service functions; passes to client component ClockInButton
    - Local interface pattern for Prisma records with relations (AttendanceRecordWithLocation)
    - Null-safe access for Prisma boolean/number fields with ?? false / ?? 0 guards

key-files:
  created:
    - src/app/(dashboard)/attendance/page.tsx
    - src/app/(dashboard)/attendance/_components/clock-in-button.tsx
    - src/app/(dashboard)/attendance/_components/attendance-today.tsx
    - src/app/(dashboard)/attendance/_components/attendance-history.tsx
  modified:
    - src/components/layout/sidebar.tsx

key-decisions:
  - "AttendanceHistory uses a local interface (AttendanceRecordWithLocation) instead of bare AttendanceRecord to accommodate officeLocation relation returned by getEmployeeAttendance"
  - "AttendanceToday is a pure server component (no 'use client') — ClockInButton handles all interactivity as a separate client component"
  - "Null guards (?? false, ?? 0) applied to Prisma boolean/number fields in AttendanceToday even though schema has @default values, for TypeScript type safety"
  - "Sidebar owns both Absensi and Cuti nav items per plan coordination to avoid parallel conflicts with 03-05"

patterns-established:
  - "GPS-first with IP fallback pattern: try geolocation(8s timeout), on error fall back to server-side IP check"
  - "Weekly summary grid: Mon-Fri colored cells (green=on-time, amber=late, muted=no-record)"

# Metrics
duration: 18min
completed: 2026-03-06
---

# Phase 3 Plan 4: Attendance Employee UI Summary

**Employee-facing /attendance page with GPS clock-in/out button, today status card, weekly hours grid, and 7-day history table; sidebar updated with Absensi and Cuti navigation links for all roles.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-06T06:17:10Z
- **Completed:** 2026-03-06T06:35:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created /attendance server page that fetches today's record, weekly summary, and 7-day history in parallel
- Built ClockInButton with navigator.geolocation (8s timeout, high accuracy) and automatic IP-only fallback on denial
- Built AttendanceToday showing clock-in/out times, late/overtime/early-out badges, and Mon-Fri weekly grid
- Built AttendanceHistory table with status badge composition (Tepat Waktu, Terlambat, Pulang Awal, Lembur, Override)
- Updated sidebar with Clock icon (Absensi) and CalendarDays icon (Cuti) nav items visible to all roles

## Task Commits

Each task was committed atomically:

1. **Task 1: Create attendance page server component and update sidebar with BOTH Absensi and Cuti links** - `d6b9001` (feat)
2. **Task 2: Build ClockInButton, AttendanceToday, and AttendanceHistory components** - `69a59d1` (feat)

**Plan metadata:** `(pending docs commit)` (docs: complete plan)

## Files Created/Modified

- `src/app/(dashboard)/attendance/page.tsx` - Server component page; fetches employee, todayRecord, weeklySummary, recentAttendance
- `src/app/(dashboard)/attendance/_components/clock-in-button.tsx` - "use client" button with GPS + IP fallback clock-in/out
- `src/app/(dashboard)/attendance/_components/attendance-today.tsx` - Server component card for today's status and weekly grid
- `src/app/(dashboard)/attendance/_components/attendance-history.tsx` - Table of last 7 attendance records with composed status badges
- `src/components/layout/sidebar.tsx` - Added Clock/CalendarDays imports and Absensi+Cuti nav items

## Decisions Made

- **Local interface for history records:** `getEmployeeAttendance` returns records with `officeLocation: { name: string }` via Prisma `include`. Rather than using `Prisma.AttendanceRecordGetPayload` (which requires internal Prisma types), a local `AttendanceRecordWithLocation` interface was defined in attendance-history.tsx. This is clean and explicit.
- **AttendanceToday as pure server component:** The component only renders static HTML from props — no interactivity needed at the card level. ClockInButton is the only client island.
- **Null guards on Prisma defaults:** Even though the Prisma schema uses `@default(false)` and `@default(0)`, the TypeScript model type exposes these as potentially nullable in some Prisma 6 generated types. Applied `?? false` and `?? 0` guards to prevent TypeScript errors and runtime issues.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- /attendance route is fully functional for employee use
- Sidebar now has both Absensi and Cuti links — plan 03-05 should skip sidebar modifications as planned
- HR Admin attendance management page (03-05) can be built next
- Leave management page (03-06+) can be built using the same component patterns established here

---
*Phase: 03-attendance-leave-management*
*Completed: 2026-03-06*
