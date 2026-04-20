# 06-07: Redesign Role Dashboards (HR Admin, Manager, Employee)

**Date:** 2026-04-21
**Status:** Complete
**Scope:** `/dashboard` for `HR_ADMIN`, `MANAGER`, and `EMPLOYEE` roles
(`SUPER_ADMIN` was already redesigned in 06-01)

---

## Overview

The landing dashboard was the last screen still using the legacy `StatCard`
layout for three of four roles. Each role now gets a bespoke dashboard that
shows insights and actions scoped to that role's actual responsibilities —
using the same modern design system established in 06-01 through 06-06.

The old dashboards all shared a single `DashboardData` shape (5-6 flat
counters + a couple of card shortcuts). That shape was too thin to express
role-specific insights, so three new service functions now build typed
payloads per role.

## Role-by-role content

### HR Admin (`/dashboard` when `role === "HR_ADMIN"`)

Purpose: operational SDM overview across the whole organization.

- Greeting banner with live clock & actions (Kelola Cuti, Penggajian)
- 4 stat tiles: Total Karyawan, Hadir Hari Ini, Sedang Cuti, Rekrutmen Aktif
- 7-day company-wide attendance trend (area chart — hadir vs. terlambat)
- Payroll status card for the current month (status pill, net total
  compact, coverage progress bar employees processed / active)
- Department donut (pie + legend with %)
- Recruitment pipeline (lowongan + interview + kandidat-per-stage bars)
- Pending leave approvals (with department tag + relative time)
- Recent hires (last 5)
- Upcoming birthdays (30-day window)
- Contract-expiring-soon (PKWT anniversaries within 90 days)

### Manager (`/dashboard` when `role === "MANAGER"`)

Purpose: team health, scoped strictly to the manager's own department.

- Greeting banner includes department name + member count
- 4 stat tiles: Anggota Tim, Hadir Hari Ini, Cuti Hari Ini, Tidak Hadir
  (all scoped to the manager's department)
- 7-day **team** attendance trend (area chart)
- Horizontal bar chart of team composition by position
- Pending-leave-approval list scoped to the team (with "Tinjau" quick link)
- Currently-on-leave list for the team
- **Team roster with live status pills** — every direct report shown with
  `Hadir / Terlambat / Cuti / Belum absen` status badge computed from
  today's attendance & approved leave
- Upcoming birthdays for the team (30-day window)

### Employee (`/dashboard` when `role === "EMPLOYEE"`)

Purpose: personal, action-oriented — one look and you know what you need
to do today.

- Greeting banner uses first name + position + department
- **Clock-status hero**: a big prominent card that detects three states —
  "Siap memulai hari?" / "Hadir · Terlambat N menit" or "Hadir tepat
  waktu" / "Hari ini selesai" — and swaps the primary CTA accordingly
  (Absen Masuk / Absen Pulang / Lihat Detail). Shows scheduled
  start/end times from the assigned office location when available.
- 4 monthly stat tiles: Hadir Bulan Ini, Keterlambatan, Sisa Cuti, Lembur
  (total overtime formatted as "N jam M menit")
- 7-day personal work-hour bar chart with per-day color coding
  (tepat waktu = emerald, terlambat = amber, tidak hadir = slate)
- Latest payslip card (compact Rupiah, status pill, link to payslip page)
- Leave balances card with a progress bar per leave type (color transitions
  emerald → amber → rose as usage increases) + pending count badge
- Upcoming leave card (or empty-state CTA to apply)
- Department rekan-sedang-cuti list
- Coworker birthdays (30-day, 3 nearest)
- Profile summary (avatar, join date, tenure in years/months)

## Files touched

### Service layer — `src/lib/services/dashboard.service.ts`

Added 3 new typed interfaces and data fetchers (each a single
`Promise.all` of Prisma reads scoped to the role):

- `HrAdminDashboardData` + `getHrAdminDashboardData()`
- `ManagerDashboardData` + `getManagerDashboardData(userId)`
- `EmployeeDashboardData` + `getEmployeeDashboardData(userId)`

Shared helpers extracted to avoid duplication with
`getSuperAdminDashboardData`:

- `computeUpcomingBirthdays(employees, today, limit)` — normalizes the
  next-birthday-in-<=30d computation used by 3 of 4 dashboards.
- `buildAttendanceTrend(records, sevenDaysAgo)` — 7-day bucket-by-day
  reducer that's identical across HR/Manager dashboards.

Key scoping rules:

- **Manager** — resolves `departmentId` from `Employee.userId`, then
  filters `employee: { isActive, departmentId }` on every query. Falls
  back to a dead-end `id: "__NONE__"` where-clause if the manager has no
  linked employee record so counts come back as 0 rather than whole-org
  data.
- **Employee** — resolves the Employee via `userId`, then uses compound
  unique `employeeId_date` for the today-attendance lookup and pulls
  `leaveBalances` for the current year. Co-worker queries exclude the
  current user's own row.
- **HR Admin** — org-wide, but also adds a "contract expiring" section:
  PKWT employees whose `joinDate` anniversary falls within the next 90
  days. The approximation surfaces renewals without needing a new
  `contractEndDate` column.

### UI components — `src/app/(dashboard)/dashboard/_components/`

- **`hr-admin-dashboard.tsx`** — full rewrite, ~790 lines. Mirrors the
  super-admin layout with HR-appropriate sections.
- **`manager-dashboard.tsx`** — full rewrite, ~620 lines. Team-scoped
  layout with the live-status team roster as its distinctive feature.
- **`employee-dashboard.tsx`** — full rewrite, ~780 lines. Clock-status
  hero, personal stats, payslip, leave balances, profile.

### Wiring — `src/app/(dashboard)/dashboard/page.tsx`

Collapsed the previous "fetch one generic `DashboardData` + conditionally
render" pattern into a switch by role. Each branch calls exactly one
role-specific data function and passes a typed payload to the matching
component.

## Design system compliance

All three dashboards follow the conventions from 06-01 through 06-06:

- Outer wrapper `-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4
  md:-m-6 md:p-6`
- Greeting section with time-of-day label (`Selamat pagi/siang/sore/malam`)
  + `Halo, {name} 👋` heading + date + contextual subtitle + right-aligned
  action buttons
- Stat tiles: `h-12 w-12` rounded-`xl` icon badge tinted by tone, chevron
  hover affordance, focus ring on linked variants
- Section cards: `border-slate-200/80 shadow-sm`, header with title +
  description, right-aligned "Kelola / Semua / Lihat detail" link
- Charts: shadcn `ChartContainer` + Recharts with consistent emerald /
  amber palette and `CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4"`
- Empty states: centered icon-in-circle + title + hint, never a bare
  "no data" string
- Rupiah formatting: compact for card headers (`Rp 1,2 M`) with the full
  format stashed in `title` for hover precision

## Accessibility

- Every page-level container has an `aria-label` (e.g. "Dashboard HR
  Admin", "Dashboard Manager", "Dashboard Karyawan")
- Every section has an `aria-label` or `aria-labelledby`
- Decorative icons are `aria-hidden="true"`; informational icons carry
  labels via nearby text
- Progress bars use `role="progressbar"` + `aria-valuemin/max/now/label`
  (leave balances, payroll coverage, recruitment stage bars)
- Linked stat tiles expose their composite label via `aria-label` so
  screen readers announce "Total Karyawan: 120" rather than just the link
  text
- Live-status pills in the manager's team roster are real text so SRs
  read the state, not a color
- Keyboard focus: all links use the project's standard
  `focus-visible:ring-emerald-500 focus-visible:ring-offset-2` treatment

## Verification

- `rtk tsc --noEmit` — 0 new errors (one pre-existing error in
  `recruitment/[vacancyId]/_components/add-candidate-wrapper.tsx`, not
  touched here)
- `rtk lint` — 0 new violations (all 8 pre-existing errors are in
  unrelated files)
- `rtk next build` — build completes with 0 errors and 0 warnings

## Follow-ups (not in scope)

- The contract-expiring heuristic assumes a 1-year PKWT cadence. When a
  proper `contractEndDate` column is added, swap the anniversary
  approximation for the real field.
- Employee monthly "absent days" is currently `workingDaysSoFar -
  presentDays`. Once a calendar-aware working-days service exists,
  replace with the authoritative count.
- Manager team-roster scroll area can become paginated if any department
  grows past ~50 members.
