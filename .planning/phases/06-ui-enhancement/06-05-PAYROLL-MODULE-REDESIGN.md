# 06-05: Redesign Penggajian Module

**Date:** 2026-04-19
**Status:** Complete
**Scope:** Penggajian, Hitung THR, Slip Gaji (3 sidebar submenus + all in-page actions/dialogs)

---

## Overview

Full redesign of the "Penggajian" sidebar section to match the modern design
system established across 06-01 (Super Admin Dashboard), 06-02 (HR Module),
06-03 (Employee Detail + Recruitment Kanban), and 06-04 (Kehadiran & Cuti).

Every primary page, every action button, and every dialog/form that the user
can reach from the three submenus has been redesigned — not just the
top-level pages.

## Design System Applied

All pages follow the consistent pattern established in 06-04:

- **Outer wrapper**: `-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6`
- **Header**: `h-9 w-9` icon badge (`bg-emerald-600`) + `text-2xl font-semibold tracking-tight text-slate-900` title + subtitle
- **KPI tiles**: `SummaryTile` component with `emerald/sky/violet/amber/slate` tone map, `h-10 w-10` icon container with ring accent
- **Section cards**: `Card` with `border-slate-200 shadow-sm`, icon-prefixed CardTitle (`h-7 w-7` accent badge)
- **Tables**: `bg-slate-50/60` header row, `text-xs font-semibold text-slate-600` column headers, `hover:bg-slate-50/50` on body rows
- **Status badges**: `outline` variant with semantic borders (emerald=finalized/eligible, amber=draft/warning, rose=rejected/deductions, slate=neutral)
- **Primary buttons**: `bg-emerald-600 hover:bg-emerald-700` with `lucide-react` icon + text
- **Loading states**: `Loader2` spinner with `animate-spin` replacing action icon during async operations
- **Empty states**: Circle icon badge + title + description, centered in the card body
- **Accessibility**: `aria-label` on sections/pages, `aria-hidden` on decorative icons, `aria-label` on icon-only link buttons, semantic `<nav>` for breadcrumbs

## Pages Redesigned

### 1. Penggajian — List (`/payroll`)

**Before:** Plain cards with basic `CardHeader`/`CardDescription`; status badges
using solid green/amber backgrounds; single-column table with `text-primary`
underlined links.

**After:**

- **KPI tiles** (4): Total Periode, Difinalisasi, Draft, Periode Terbaru
- **Action card**: "Hitung Penggajian Bulan Baru" with `Calculator` icon badge
- **History table**: Card-wrapped, slate-50 header row, outline badges, hover
  states, `ArrowRight` chevron on each row for affordance
- **Empty state**: `CalendarRange` icon + "Belum ada data penggajian" copy

### 2. Periode Detail (`/payroll/[periodId]`)

**Before:** Basic breadcrumb, simple header, 3 info cards with plain typography,
unstyled table wrapper.

**After:**

- **Breadcrumb**: `ArrowLeft` + hover-highlighted link, `aria-label="Breadcrumb"`
- **Header row**: Icon badge + period title + status badge + contextual subtitle
  ("periode ini sudah difinalisasi" / "dapat dihitung ulang")
- **Finalize button** in header (only when DRAFT)
- **KPI tiles** (4): Jumlah Karyawan, Total Bruto, Total Potongan, Total
  Bersih — using compact rupiah format (`Rp 12.3 jt`, `Rp 1.4 M`) with full
  amount on `title` tooltip
- **Entry table toolbar**: Icon-prefixed section label + Excel export
  (`FileSpreadsheet`) aligned right
- **Data table cells**: font-mono NIK, tabular-nums rupiah, semantic colors
  (rose-600 for deductions, emerald-700 for net pay)
- **Payslip download** per row: `FileDown` icon + outline button, disabled state
  while DRAFT

### 3. Run Payroll Form — "Hitung Gaji" Action (inline on `/payroll`)

**Before:** Default shadcn Select + unstyled primary button with text "Hitung
Gaji" / "Menghitung...".

**After:**

- Inputs with `border-slate-200 bg-white`
- Labels `text-sm text-slate-700`
- Submit button: emerald with `Calculator` icon → `Loader2` spinner when loading
- `aria-label="Form hitung penggajian"`

### 4. Finalize Payroll Action — `/payroll/[periodId]` button

**Before:** Green button + shared `ConfirmDialog` with default styling.

**After:** Upgraded to a purpose-built `AlertDialog`:

- **Trigger button**: `Lock` icon + "Finalisasi Penggajian" on emerald-600
- **Dialog**: Warning icon badge (`AlertTriangle` on amber background) with
  concise copy; bold highlight on "tidak dapat diubah"
- **Confirm action**: `Lock` icon + "Finalisasi" on emerald, `Loader2` when
  processing
- **Cancel**: outline border-slate-200

### 5. Hitung THR (`/payroll/thr`)

**Before:** Blue info card with emoji bullets, plain form card, plain table
with solid-color badges, basic summary band.

**After:**

- **KPI tiles** (4): Karyawan Aktif, Berhak THR, Total THR Layak, Tanggal
  Referensi — compact rupiah + tooltip full format
- **Info card**: Redesigned with `Info` icon badge in sky-50 container, clean
  bullet list with `•` markers (better than emoji for a11y / screen readers)
- **Add THR to Payroll form card**: `PlusCircle` accent badge, emerald submit
  with `Gift` icon → `Loader2` on loading
- **Eligibility table**: slate-50 header, outline badges ("Berhak" emerald /
  "Tidak Berhak" slate), em-dash `—` for non-eligible THR amount (instead of
  a misleading `Rp 0`), opacity-70 tint for ineligible rows
- **Footer summary**: emerald-tinted band with `Banknote` icon badge showing
  total THR and eligible/total employee ratio

### 6. Add THR to Payroll — inline form action on `/payroll/thr`

**Before:** Default Select + plain text submit button "Tambahkan ke
Penggajian" / "Memproses...".

**After:**

- Inputs with `border-slate-200 bg-white`
- Submit: emerald with `Gift` icon (contextual) → `Loader2` when loading
- `aria-label="Form tambah THR ke penggajian"`

### 7. Slip Gaji (`/payslip`)

Two distinct views based on role — both fully redesigned.

**Admin (HR_ADMIN / SUPER_ADMIN):**

- **KPI tiles** (4): Total Slip, Periode (distinct months), Karyawan
  (distinct), Periode Terbaru
- **Table**: Period + NIK (font-mono) + Name + status badge + download button
  with `FileDown` icon
- **Empty state**: `ReceiptText` icon badge + "Belum ada slip gaji tersedia"

**Employee (EMPLOYEE / MANAGER):**

- **KPI tiles** (3): Total Slip Tersedia, Periode Terbaru, Periode Terlama
- **Personal table**: Period + status + download
- **Empty state** with contextual copy ("Slip akan muncul setelah HR
  menfinalisasi penggajian bulan Anda")

### 8. Download Payslip PDF — button action (on `/payslip` and payroll detail)

**Before:** Plain outline button with text "Unduh PDF" / "Unduh".

**After:**

- `FileDown` icon + "Unduh PDF" / "Unduh" label
- `border-slate-200` + `text-xs` for compact look in table rows
- `aria-label` describing which employee & period (screen-reader friendly)
- External link semantics preserved (`target="_blank" rel="noopener noreferrer"`)

## Files Modified

### Pages (4)
- `src/app/(dashboard)/payroll/page.tsx`
- `src/app/(dashboard)/payroll/[periodId]/page.tsx`
- `src/app/(dashboard)/payroll/thr/page.tsx`
- `src/app/(dashboard)/payslip/page.tsx`

### Components / Actions (5)
- `src/app/(dashboard)/payroll/_components/run-payroll-form.tsx`
- `src/app/(dashboard)/payroll/[periodId]/_components/finalize-button.tsx`
- `src/app/(dashboard)/payroll/[periodId]/_components/payroll-entry-table.tsx`
- `src/app/(dashboard)/payroll/thr/_components/add-thr-form.tsx`
- `src/app/(dashboard)/payroll/thr/_components/thr-table.tsx`

## Icon Semantic Map

Chosen `lucide-react` icons reflect the domain meaning to aid quick scanning:

| Area | Icon | Rationale |
|------|------|-----------|
| Penggajian (global) | `Wallet` | Salary / money container |
| Hitung Gaji | `Calculator` | Computation action |
| Finalisasi | `Lock` | Locks data against further changes |
| Difinalisasi (status) | `FileCheck2` | Completed / sealed |
| Draft (status) | `FileClock` | Unfinalized / in-progress |
| Hitung THR | `Gift` | Tunjangan Hari Raya = holiday bonus |
| Tambah THR | `PlusCircle` | Add action |
| Slip Gaji | `ReceiptText` | Physical receipt / payslip metaphor |
| Unduh PDF | `FileDown` | Download file |
| Unduh Excel | `FileSpreadsheet` | Spreadsheet export |
| Info / regulation | `Info` | Neutral informational |
| Total Bruto | `TrendingUp` | Incoming gross |
| Total Potongan | `TrendingDown` | Outgoing deductions |
| Total Bersih | `Banknote` | Final cash result |

## Accessibility Improvements

- All decorative icons have `aria-hidden="true"`
- All meaningful icon-only buttons/links have descriptive `aria-label` (e.g.
  "Unduh PDF slip gaji Budi Santoso periode Maret 2026")
- Semantic `<nav aria-label="Breadcrumb">` for crumbs
- `<header>` and `<section aria-label="...">` wrap each major region
- Status is conveyed through both color and text (not color alone)
- Warning dialog uses heading + descriptive text + explicit bold emphasis on
  "tidak dapat diubah" rather than relying on color cues
- Tabular numbers use `tabular-nums` for readable alignment
- Compact currency (`Rp 12.3 jt`) always pairs with full currency in `title`
  tooltip for screen readers and desktop hover
- Rose-600 / emerald-700 combinations meet WCAG AA contrast on white

## UX Improvements

- **Affordance**: chevron (`ArrowRight`) on payroll row makes the row
  clickable area obvious
- **Scannability**: KPI tiles at top of every page give an at-a-glance summary
  before the user scrolls to the data
- **Feedback**: every async button swaps its leading icon for a `Loader2`
  spinner during pending state (no mystery empty waits)
- **Consistency**: Add THR form mirrors Run Payroll form field-for-field, so
  the mental model transfers — only the submit verb+icon changes
- **Warning weight**: Finalize dialog now has an icon + structured body +
  bold emphasis, making the irreversibility obvious before clicking
- **Legibility of "zero"**: THR table shows em-dash `—` (not `Rp 0`) for
  ineligible rows, which avoids confusing the reader
- **Rupiah formatting**: Large numbers are presented compactly (e.g. `Rp 1.4 M`)
  in KPI tiles with full formatting reserved for the data table and tooltip,
  preventing horizontal overflow on mobile

## Skills Used

- `/frontend-design` — Design direction: what to emphasize, where the visual
  hierarchy lives per page, KPI + form + table rhythm
- `/shadcn-ui` — Components: `Card`, `CardHeader`, `CardTitle`, `CardContent`,
  `Badge`, `Table`, `Button`, `buttonVariants`, `Form`, `Select`,
  `AlertDialog`, `Dialog`
- `/ui-ux-pro-max` — Tone palette (`emerald/sky/violet/amber/slate`),
  typography hierarchy (`text-2xl/text-base/text-xs`), spacing system
  (`space-y-6`, `gap-3`, `p-4 md:p-6`), loading/empty states
- `/web-accessibility` — ARIA labels, semantic HTML, focus management,
  color-independent status conveyance, screen-reader-friendly currency
- `/web-design-guidelines` — Consistent with prior phase 06 pages; reuses
  layout tokens and sub-components

## Verification

- `tsc --noEmit` — 0 errors across redesigned files (1 pre-existing error in
  recruitment area, unrelated)
- All action paths preserved:
  - `/payroll` → Hitung Gaji → `/payroll/[periodId]`
  - `/payroll/[periodId]` → Finalisasi → dialog → POST → refresh
  - `/payroll/[periodId]` → Unduh Rekap Excel → `/api/payroll-report`
  - `/payroll/[periodId]` per-row → Unduh Slip (disabled if DRAFT)
  - `/payroll/thr` → Tambahkan ke Penggajian → refresh
  - `/payslip` per-row → Unduh PDF → `/api/payroll/payslip/:id`

## Out of Scope

- Changes to server actions, service layer, or API routes (redesign is
  presentation-only)
- Changes to Prisma schema or seed data (the data already has enough variety
  from phase 04 to exercise each new visual state)
- PDF/Excel template redesign (handled by separate report generation code,
  not these pages)
