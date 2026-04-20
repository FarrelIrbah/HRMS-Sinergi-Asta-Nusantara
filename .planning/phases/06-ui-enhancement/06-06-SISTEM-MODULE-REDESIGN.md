# 06-06: Redesign Sistem Module

**Date:** 2026-04-20
**Status:** Complete
**Scope:** Pengguna, Data Master (4 tabs), Log Audit (filters + table + detail)
— all pages, tables, dialogs, and action buttons under the "Sistem" sidebar
section

---

## Overview

Full redesign of the "Sistem" sidebar section to match the modern design
system established across 06-01 (Super Admin Dashboard), 06-02 (HR Module),
06-03 (Employee Detail + Recruitment Kanban), 06-04 (Kehadiran & Cuti), and
06-05 (Penggajian).

Every primary page, every CRUD dialog, every table, and every icon-only
button that the user can reach from the three submenus has been redesigned
— not just the top-level pages. Shared tile logic has also been extracted
into a reusable `SummaryTile` component to remove duplication across phases.

## Design System Applied

All pages follow the consistent pattern established in prior phases:

- **Outer wrapper**: `-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6`
- **Header**: `h-9 w-9` icon badge (`bg-emerald-600 text-white`) + `text-2xl font-semibold tracking-tight text-slate-900` title + subtitle
- **KPI tiles**: Shared `SummaryTile` component with 6 tones (`emerald/sky/violet/amber/slate/rose`), `h-10 w-10` icon container with ring accent
- **Section cards**: `Card` with `border-slate-200 shadow-sm`, icon-prefixed header (`h-7 w-7` accent badge)
- **Tables**: `bg-slate-50/60` header row, `text-xs font-semibold uppercase tracking-wide text-slate-600` column headers, `hover:bg-slate-50/50` body rows
- **Dialogs**: Icon-prefixed `DialogHeader` with `h-10 w-10` tinted badge (domain color), `border-slate-200 bg-white` inputs, emerald primary submit
- **Action badges**: `rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset` with semantic tones
- **Primary buttons**: `bg-emerald-600 hover:bg-emerald-700` with `lucide-react` icon + text
- **Destructive actions**: Rose-600 styling on text + hover:bg-rose-50
- **Loading states**: `Loader2` spinner replacing action icon during async operations
- **Empty states**: Centered icon badge + title + description in the card body
- **Accessibility**: `aria-label` on sections/pages, `aria-hidden` on decorative icons, `aria-label` on icon-only action buttons

## New Shared Component

### `src/components/shared/summary-tile.tsx`

Previously, each page inlined its own "KPI tile" component, leading to
duplicated code across `payroll/page.tsx`, `user-table.tsx`, and would have
multiplied across the 4 Data Master tabs + audit-log page. Extracted into
one component with a discriminated `tone` union (`emerald | sky | violet |
amber | slate | rose`), a required `icon` / `label` / `value` API, and an
optional `title` attribute for tooltip-text context.

## Pages Redesigned

### 1. Pengguna (`/users`)

**Before:** Plain `CardHeader` / `CardTitle` with primary-colored "Tambah
Pengguna" button; role and status rendered as simple outline badges; action
column used default outline buttons with no icons; form dialog had unstyled
header.

**After:**

- **Page header**: `UserCog` emerald icon badge + title + subtitle, with
  "Tambah Pengguna" button aligned right
- **KPI tiles** (4): Total Pengguna, Aktif, Nonaktif, Admin — computed from
  the user list
- **Table card wrap** with slate-50 header row
- **User columns**:
  - Avatar with gradient slate background + user initials ring
  - Role badge: rose (SUPER_ADMIN), sky (HR_ADMIN), amber (MANAGER), emerald
    (EMPLOYEE) — distinct colors for instant role recognition
  - Status badge: emerald/slate with a dot indicator (not color-only)
  - Action `DropdownMenu` with icons (`Pencil`, `Power`, `Trash2`),
    `DropdownMenuSeparator` before destructive items, rose-tinted destructive
    text
- **Form dialog**: `UserPlus` (create) / `UserCog` (edit) icon badge header,
  bordered slate-200 inputs, emerald submit with `Save` icon → `Loader2`

### 2. Data Master (`/master-data`)

**Before:** Default shadcn `Tabs` with plain labels; each tab rendered a
plain `Card` with `Table`, solid-green outline badges on stat numbers, plain
"Tambah" buttons, unstyled empty states.

**After:**

- **Page wrapper**: `Database` emerald icon badge header with subtitle
- **Tabs list**: `bg-white` ring-1 ring-slate-200 shell, each trigger has
  an icon (Building2 / Briefcase / MapPin / CalendarDays),
  `data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700`
  active style
- **Per-tab common structure**: 3 KPI tiles (domain-specific) + Card-wrapped
  table + icon-prefixed "Tambah" button + contextual empty state

**Tab 1 — Departemen** (3 tiles: Total, Posisi, Rata-rata/Dept):
- Building2 emerald icon cells
- Inline position-count pill (`bg-sky-50 text-sky-700`) on each row

**Tab 2 — Jabatan** (3 tiles: Total, Departemen Unik, Rata-rata/Dept):
- Briefcase sky icon cells
- Department name rendered as neutral slate pill

**Tab 3 — Lokasi Kantor** (3 tiles: Total, Dengan GPS, Dengan IP):
- MapPin violet icon cells
- Emerald "GPS" badge when latitude+longitude+radius all present
- Sky "IP Range" badge showing count of `allowedIPs`

**Tab 4 — Jenis Cuti** (3 tiles: Total, Cuti Berbayar, Total Hari Kuota):
- CalendarDays amber icon cells
- `BadgeDollarSign` badge for paid leave (emerald) vs slate for unpaid
- Gender restriction: emerald "Semua" / sky "Pria" / amber "Wanita"

**Dialogs** (all four):
- `DepartmentFormDialog` — Building2 emerald badge header
- `PositionFormDialog` — Briefcase sky badge header
- `OfficeLocationFormDialog` — MapPin violet badge header; IP and GPS
  sections grouped into nested `bg-slate-50/50` rounded panels with
  dedicated sub-headers (Globe for IP, Navigation for GPS)
- `LeaveTypeFormDialog` — CalendarDays amber badge header; checkbox for
  "Cuti Berbayar" upgraded to a bordered card row with descriptor text
  explaining the implication

### 3. Log Audit (`/audit-log`)

**Before:** Plain header with `ScrollText` icon; flat filter bar with
default buttons; plain "Total: N entri" text above a default DataTable;
green/blue/red solid-color badges (low contrast, poor a11y); plain text
"Lihat" link with underline-on-hover.

**After:**

- **Page header**: `ScrollText` emerald icon badge + "Log Audit" +
  subtitle describing purpose
- **KPI tiles** (4): Total Entri (emerald/Activity), Aksi Buat (sky/
  PlusCircle), Aksi Ubah (violet/Pencil), Aksi Hapus — uses rose tone when
  `deleteCount > 0` else slate (so an empty state doesn't scream red)
- **Filter card**: Card-wrapped with `Filter` emerald icon heading, "aktif"
  indicator pill when any filter is set, border-slate-200 bg-white on all
  inputs/selects, emerald Apply with `Check` icon, outline Reset with
  `RotateCcw` — Reset is disabled when no active filter (no-op prevention)
- **Table card**: `Database` icon + "Riwayat Aktivitas" heading on a
  bordered top bar; total count shown as a slate pill with `toLocaleString`
  formatting; table body uses shared DataTable
- **Columns**:
  - Waktu: tabular-nums slate-700
  - Pengguna: avatar gradient + initials ring + name + email
  - Aksi: icon-prefixed badge (PlusCircle emerald CREATE, Pencil sky
    UPDATE, Trash2 rose DELETE) — matches the KPI tile palette for visual
    consistency from tile → row
  - Modul: neutral slate pill
  - Target ID: font-mono slate pill (8-char abbreviation with ring-inset)
  - Detail: rounded emerald hover link with `ArrowUpRight` chevron

### 4. Log Audit — Detail (`/audit-log/[id]`)

**Before:** Plain "Kembali" text link; plain h1 + description; 3-col dl
with minimal visual structure; diff view used 2 separate Cards with yellow
highlight for changed rows (bg-yellow-100) — no semantic cue for
added/removed/unchanged.

**After:**

- **Breadcrumb `<nav>`**: ArrowLeft + hover-highlighted rounded link
- **Header**: ScrollText emerald icon badge + title + action badge
  (icon-prefixed, domain-colored) inline with the h1 — you can tell at a
  glance that this entry is a CREATE / UPDATE / DELETE
- **Info card**: Icon-prefixed heading; each dt/dd row has its own leading
  icon tile (ActionIcon / Package / Hash / avatar-initials / Clock /
  UserIcon) for scannability; IDs rendered as font-mono slate pills
- **Diff card — single grid, not two cards**: left column "Sebelum" (rose
  tab) / right column "Sesudah" (emerald tab); per-row semantic highlight:
  - `bg-rose-50/70` for removed or changed keys in the "before" column
  - `bg-emerald-50/70` for added or changed keys in the "after" column
  - `opacity-40` for keys absent in that side
  - Right-side inline status chip (`Plus` / `Minus` / `Pencil` / `Equal`)
    with `Ditambahkan / Dihapus / Diubah` label — not color-alone
- **Empty diff**: `FileText` icon + "Tidak ada nilai yang dicatat" centered

## Files Modified

### New shared (1)
- `src/components/shared/summary-tile.tsx`

### Pages (3)
- `src/app/(dashboard)/users/page.tsx`
- `src/app/(dashboard)/master-data/page.tsx`
- `src/app/(dashboard)/audit-log/page.tsx`
- `src/app/(dashboard)/audit-log/[id]/page.tsx`

### Pengguna components (4)
- `src/app/(dashboard)/users/_components/user-page-header.tsx`
- `src/app/(dashboard)/users/_components/user-columns.tsx`
- `src/app/(dashboard)/users/_components/user-table.tsx`
- `src/app/(dashboard)/users/_components/user-form-dialog.tsx`

### Data Master components (9)
- `src/app/(dashboard)/master-data/_components/master-data-tabs.tsx`
- `src/app/(dashboard)/master-data/_components/department-tab.tsx`
- `src/app/(dashboard)/master-data/_components/position-tab.tsx`
- `src/app/(dashboard)/master-data/_components/office-location-tab.tsx`
- `src/app/(dashboard)/master-data/_components/leave-type-tab.tsx`
- `src/app/(dashboard)/master-data/_components/department-form-dialog.tsx`
- `src/app/(dashboard)/master-data/_components/position-form-dialog.tsx`
- `src/app/(dashboard)/master-data/_components/office-location-form-dialog.tsx`
- `src/app/(dashboard)/master-data/_components/leave-type-form-dialog.tsx`

### Log Audit components (3)
- `src/app/(dashboard)/audit-log/_components/audit-log-filters.tsx`
- `src/app/(dashboard)/audit-log/_components/audit-log-table.tsx`
- `src/app/(dashboard)/audit-log/_components/audit-log-columns.tsx`

## Icon Semantic Map

Chosen `lucide-react` icons reflect domain meaning to aid quick scanning:

| Area | Icon | Rationale |
|------|------|-----------|
| Pengguna (global) | `UserCog` | User settings / admin |
| Tambah Pengguna | `UserPlus` | Add user |
| Edit Pengguna | `UserCog` | Configure user |
| Toggle Active | `Power` | On/off semantic |
| Data Master (global) | `Database` | Master records storage |
| Departemen | `Building2` | Org unit / building |
| Jabatan | `Briefcase` | Job / role |
| Lokasi Kantor | `MapPin` | Geographic point |
| Jenis Cuti | `CalendarDays` | Time off / calendar |
| GPS Koordinat | `Navigation` | Direction / geo |
| Rentang IP | `Globe` | Network / internet |
| Cuti Berbayar | `BadgeDollarSign` | Paid status |
| Log Audit (global) | `ScrollText` | Log / record |
| CREATE action | `PlusCircle` | Creation |
| UPDATE action | `Pencil` | Edit |
| DELETE action | `Trash2` | Removal |
| Filter | `Filter` | Filtering UI |
| Apply filter | `Check` | Confirm |
| Reset filter | `RotateCcw` | Reset to default |
| Detail link | `ArrowUpRight` | External / deeper view |
| Diff: added | `Plus` | Insertion |
| Diff: removed | `Minus` | Deletion |
| Diff: changed | `Pencil` | Modified |
| Diff: unchanged | `Equal` | No difference |
| Entry metadata | `Hash` / `Clock` / `Package` | Semantic context |

## Accessibility Improvements

- All decorative icons have `aria-hidden="true"`
- Meaningful icon-only buttons have descriptive `aria-label` (e.g. "Hapus
  IP ke-2", "Lihat detail perubahan")
- Semantic `<nav aria-label="Navigasi kembali">` for breadcrumb on detail
- `<header>` and `<section aria-label="...">` wrap each major region
- Status always conveyed through both icon/label and color (never color-only)
- Diff view uses explicit status chips (`Ditambahkan / Dihapus / Diubah /
  Sama`) instead of relying on background color alone — supports low-vision
  and monochrome displays
- Role badges include the role name as visible text, not just color (e.g.
  "Super Admin" rose, "HR Admin" sky)
- Disabled Reset button when no filters are active prevents meaningless
  navigation for keyboard users
- Avatar initials have `aria-hidden` because the full user name is the
  adjacent accessible label
- Email on audit-log user column gives screen-reader additional context
  beyond the name alone
- Leave-type "Cuti Berbayar" checkbox now has an associated description
  explaining the behavioural consequence (WCAG 3.3.2 Labels or Instructions)

## UX Improvements

- **Scannability**: KPI tiles at top of every page give at-a-glance summary
  before the user scrolls to the data
- **Semantic color palette**: Role badges use distinct colors per role so
  users can scan a user table and instantly group admins vs employees
- **Icon reinforcement in diff**: Added/removed/changed status chips
  eliminate the prior "what does yellow mean?" ambiguity
- **Filter feedback**: "aktif" pill + disabled Reset button make it obvious
  whether a filter is applied — no more "nothing happened" confusion
- **Unified tone from tile to row**: The 4 action-type KPI tiles
  (Total/Create/Update/Delete) use the same palette as the row-level action
  badges — the eye learns "sky means UPDATE" in one glance
- **Consistency**: All 4 master-data subtabs share the same 3-tile layout
  and same "Tambah" header pattern — the mental model transfers between
  tabs, only the domain semantics change
- **Dialog clarity**: Icon-prefixed dialog headers with descriptive body
  copy (e.g. "Perbarui informasi jabatan dan departemen terkait.") tell
  the user what they're doing, not just what form they're on
- **Destructive differentiation**: Delete actions use rose-600 text + hover
  bg, distinct from primary emerald — prevents mis-click on dropdowns
- **Data density**: Font-mono slate pills for IDs (target ID, entry ID)
  signal "this is technical data to compare, not to read aloud"

## Skills Used

- `/frontend-design` — Visual hierarchy, KPI placement, diff layout decision
  (single-card 2-column grid vs prior 2 separate cards), domain-icon
  selection for each sub-area
- `/shadcn-ui` — Components: `Card`, `CardContent`, `Badge`, `Table`,
  `Button`, `buttonVariants`, `Dialog`, `Form`, `Select`, `Tabs`,
  `DropdownMenu`, `AlertDialog`
- `/ui-ux-pro-max` — Tone palette (`emerald/sky/violet/amber/slate/rose`),
  typography (`text-2xl/text-base/text-xs uppercase tracking-wide`),
  spacing (`space-y-6`, `gap-3`, `p-4 md:p-6`), loading/empty/disabled
  states
- `/web-accessibility` — ARIA labels, semantic HTML, dual encoding of
  status (icon + color + text), descriptive labels for icon-only actions,
  explicit disabled-state semantics
- `/web-design-guidelines` — Consistency with prior phase 06 pages;
  extraction of duplicated tile code into shared component

## Verification

- `tsc --noEmit` — 0 new errors across redesigned files (1 pre-existing
  error in `recruitment/[vacancyId]/_components/add-candidate-wrapper.tsx`
  unrelated to this phase; Phase 5 recruitment deep work is not started)
- All action paths preserved:
  - `/users` → Tambah → create dialog → refresh
  - `/users` → row dropdown → Edit / Nonaktifkan / Hapus → confirm → refresh
  - `/master-data` → tab select → keeps URL query param
  - `/master-data` → Tambah (per tab) → create dialog → refresh
  - `/master-data` → row edit / delete → dialog → refresh
  - `/audit-log` → filters → apply → server-side refresh with searchParams
  - `/audit-log` → row Detail → `/audit-log/[id]` → breadcrumb → back
- All Prisma / server action signatures unchanged
- All `nuqs` filter state keys unchanged (URL compatibility preserved)

## Out of Scope

- Changes to server actions, services, or API routes — redesign is
  presentation-only
- Changes to Prisma schema or seed data
- `DataTable` pagination / column visibility redesign — that shared
  component is used across many modules and would belong in its own phase
- Nested empty-state illustrations (plain icon badge + copy is sufficient
  for the density of these tables)
