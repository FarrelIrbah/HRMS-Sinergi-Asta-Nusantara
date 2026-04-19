# 06-04: Redesign Kehadiran & Cuti Module

**Date:** 2026-04-17
**Status:** Complete
**Scope:** Absensi, Admin Absensi, Cuti, Kelola Cuti, Laporan Cuti

---

## Overview

Full redesign of the "Kehadiran & Cuti" sidebar section (5 pages + sub-pages) to match the modern design system established in Phase 06-01/02/03. Also enhanced the seed with rich dummy data so all pages display meaningful content.

## Design System Applied

All pages now follow the consistent pattern from the Employees/Recruitment redesign:

- **Outer wrapper**: `-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6`
- **Header**: Icon badge (h-9 w-9, bg-emerald-600) + `text-2xl font-semibold tracking-tight text-slate-900` title + subtitle
- **KPI tiles**: `grid grid-cols-2 gap-3 sm:grid-cols-3|4 lg:grid-cols-5` with SummaryTile pattern (emerald/sky/violet/amber/slate tones)
- **Tables**: Wrapped in `Card > CardContent` with `bg-slate-50/60` header rows, `text-xs font-semibold text-slate-600` column headers
- **Status badges**: Consistent color-coding (emerald=approved/on-time, amber=pending/warning, red=rejected/late, slate=neutral)
- **Form cards**: Icon-prefixed CardTitle, border-slate-200 inputs, emerald-600 submit buttons
- **Accessibility**: `aria-label` on sections/pages, `aria-hidden` on decorative icons

## Pages Redesigned

### 1. Absensi (`/attendance`)
- **KPI tiles**: Hari Ini (status), Hadir Minggu Ini, Terlambat, Rata-rata/Hari, Lembur Bulan Ini
- **Today card**: Redesigned with icon-prefixed title, emerald/amber colored time displays, completion banner
- **Weekly summary**: Grid with color-coded day cells (emerald=on-time, amber=late, slate=no record)
- **History table**: 7-day table with status badges in Card wrapper

### 2. Admin Absensi (`/attendance-admin`)
- **KPI tiles**: Total Karyawan, Pernah Hadir, Pernah Terlambat, Rata-rata Jam, Total Lembur
- **Filters**: CalendarRange icon + styled selects with bg-white borders
- **Summary table**: Card-wrapped with Eye icon detail links
- **Export/Manual buttons**: Styled with border-slate-200 bg-white

### 3. Admin Absensi Detail (`/attendance-admin/[employeeId]`)
- **Header**: Back button + employee name with icon badge + department/position info
- **KPI tiles**: Hari Hadir, Terlambat, Rata-rata/Hari, Total Lembur
- **Detail table**: Full month records with Manual/Override badges

### 4. Cuti (`/leave`)
- **KPI tiles**: Sisa Cuti, Terpakai, Menunggu Approval, Total Alokasi
- **Balance cards**: Redesigned with uppercase tracking-wide labels, color-coded progress bars (emerald>50%, amber>20%, red<20%)
- **Request form**: Card with Send icon, emerald-600 submit, color-coded balance badge
- **History table**: Consistent status badges with cancel button

### 5. Kelola Cuti (`/leave/manage`)
- **KPI tiles**: Menunggu, Disetujui, Ditolak, Dibatalkan
- **Filters**: Filter icon + styled status/year selects
- **Approval table**: Card-wrapped with inline approve/reject buttons (emerald/red)

### 6. Laporan Cuti (`/leave/report`)
- **KPI tiles**: Karyawan, Total Disetujui, Menunggu, Ditolak
- **Summary table**: Card-wrapped per-employee breakdown

## Seed Enhancement

Enhanced `prisma/seed.ts` sections 10-12:

### Attendance Records (Section 10)
- **4 weeks** of weekday records (was 1 week)
- **4 distinct patterns** rotated per employee:
  - Pattern 0: Punctual, occasional late on Wed, overtime on Fri
  - Pattern 1: Sometimes late, sometimes early out
  - Pattern 2: Overtime-heavy (Mon, Wed, Fri OT)
  - Pattern 3: Mixed behavior
- Minute jitter per week for realistic variation
- Dynamic date calculation (relative to today)
- **120 records** seeded (was ~30)

### Leave Balances (Section 11)
- Pre-defined `usedDays` per employee reflecting approved leave history
- Realistic distribution: 0-5 days used across different leave types

### Leave Requests (Section 12)
- **13 diverse requests** (was 2):
  - APPROVED: 8 (various employees, past dates, with approver notes)
  - PENDING: 4 (future dates)
  - REJECTED: 1 (with rejection reason)
  - CANCELLED: 1
- Multiple leave types used (Cuti Tahunan, Cuti Sakit)
- All linked to HR admin user as approver

## Files Modified

### Pages
- `src/app/(dashboard)/attendance/page.tsx`
- `src/app/(dashboard)/attendance-admin/page.tsx`
- `src/app/(dashboard)/attendance-admin/[employeeId]/page.tsx`
- `src/app/(dashboard)/leave/page.tsx`
- `src/app/(dashboard)/leave/manage/page.tsx`
- `src/app/(dashboard)/leave/report/page.tsx`

### Components
- `src/app/(dashboard)/attendance/_components/attendance-today.tsx`
- `src/app/(dashboard)/attendance/_components/attendance-history.tsx`
- `src/app/(dashboard)/attendance/_components/clock-in-button.tsx`
- `src/app/(dashboard)/attendance-admin/_components/attendance-summary-table.tsx`
- `src/app/(dashboard)/attendance-admin/_components/attendance-filters.tsx`
- `src/app/(dashboard)/attendance-admin/_components/export-buttons.tsx`
- `src/app/(dashboard)/leave/_components/leave-balance-card.tsx`
- `src/app/(dashboard)/leave/_components/leave-request-form.tsx`
- `src/app/(dashboard)/leave/_components/leave-history-table.tsx`
- `src/app/(dashboard)/leave/manage/_components/leave-approval-table.tsx`
- `src/app/(dashboard)/leave/manage/_components/approve-reject-dialog.tsx`

### Seed
- `prisma/seed.ts` (sections 10, 11, 12 enhanced)

## Skills Used
- `/frontend-design` — Design thinking and aesthetic direction
- `/shadcn-ui` — Component patterns (Card, Badge, Table, Form, Select, Dialog)
- `/ui-ux-pro-max` — Color tones, typography hierarchy, spacing system, interaction patterns
- `/web-accessibility` — ARIA labels, semantic HTML, keyboard navigation, focus management
- `/web-design-guidelines` — Vercel web interface compliance

## Verification
- `tsc --noEmit`: 0 new errors (1 pre-existing in recruitment module)
- `next build`: 0 errors, 0 warnings
- `prisma db seed`: 120 attendance records, 24 leave balances, 13 leave requests
