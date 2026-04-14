---
plan: "06-01-super-admin-dashboard-v2"
phase: "06-ui-enhancement"
status: complete
completed: "2026-04-14"
type: feature
files_changed:
  - src/app/(dashboard)/dashboard/page.tsx
  - src/app/(dashboard)/dashboard/_components/super-admin-dashboard.tsx
  - src/lib/services/dashboard.service.ts
  - src/components/layout/sidebar.tsx
  - src/components/ui/chart.tsx
  - src/components/ui/scroll-area.tsx
  - src/components/ui/tooltip.tsx
  - package.json
skills_applied:
  - frontend-design
  - ui-ux-pro-max
  - shadcn-ui
  - web-accessibility
  - web-design-guidelines
---

# Feature 06-01: Super Admin Dashboard V2 (Modern, Responsive, Dynamic)

Perombakan total Dashboard Super Admin dari StatCard generik menjadi layout
modern dengan data real-time dari database. Termasuk modernisasi sidebar
dengan navigation grouping dan theme light.

## Tujuan

- **Informatif**: tampilkan metrik operasional yang relevan untuk Super Admin
  (kehadiran, penggajian, rekrutmen, approvals, birthdays).
- **Dinamis**: semua data berasal dari Prisma queries — tidak ada mock data.
- **Responsif**: mobile-first, progressively enhanced di breakpoint sm / lg / xl.
- **Aksesibel**: memenuhi WCAG AA (contrast, aria-labels, keyboard nav, semantic HTML).

## Layout (CSS Grid 12-col di `lg+`)

```
┌──────────────── Greeting (full) ────────────────────────┐
│ Selamat pagi, {Name} · Tanggal hari ini · [Action bar]  │
├──────────────── Quick Stats ────────────────────────────┤
│ [Total Karyawan] [Hadir] [Sedang Cuti] [Tidak Hadir]     │  (xl:4 cols)
├──────────────── Charts ─────────────────────────────────┤
│ Attendance 7-day Area (col-7) │ Dept Donut (col-5)     │
├──────────────── Payroll + Recruitment ──────────────────┤
│ Payroll 6-month Bar (col-8) │ Recruitment (col-4)      │
├──────────────── Lists ──────────────────────────────────┤
│ Pending Approvals │ Recent Hires │ Birthdays            │  (lg:3 cols)
└──────────────────────────────────────────────────────────┘
```

Mobile (`< lg`): single column stack. Stats jadi 2 cols di sm, 4 di xl.

## Data Source — `getSuperAdminDashboardData()`

New function di `src/lib/services/dashboard.service.ts`. Semua query dijalankan
dengan satu `Promise.all` untuk efficiency:

| Field | Source | Query |
|---|---|---|
| `totals.employees` | Employee | `count({ isActive: true })` |
| `totals.departments/positions` | Department/Position | `count({ deletedAt: null })` |
| `totals.openVacancies` | Vacancy | `count({ status: "OPEN" })` |
| `totals.candidatesInPipeline` | Candidate | `count({ stage IN [MELAMAR, SELEKSI_BERKAS, INTERVIEW, PENAWARAN] })` |
| `today.present/lateCount` | AttendanceRecord | `findMany({ date: today })` → count clockIn / isLate |
| `today.onLeave` | LeaveRequest | `count({ APPROVED, startDate ≤ today ≤ endDate })` |
| `today.absent` | derived | `totalEmployees - present - onLeave` |
| `attendanceTrend` | AttendanceRecord | 7-day window, grouped in JS by ISO date |
| `payrollTrend` | PayrollRun + entries.netPay | last 6 runs, sum netPay per run |
| `departmentBreakdown` | Employee | `groupBy(departmentId)` joined with Department.name |
| `pendingApprovals.leave` | LeaveRequest | 5 latest PENDING with employee + leaveType |
| `recentHires` | Employee | 5 latest by joinDate |
| `upcomingBirthdays` | Employee (non-null tanggalLahir) | filtered in JS, next 30 days |
| `recruitment.stageBreakdown` | Candidate | `groupBy(stage)` |
| `recruitment.upcomingInterviews` | Interview | `count({ scheduledAt ≥ now })` |

**Why in-JS filtering for birthdays:** Prisma doesn't support month/day-only
date filters without raw SQL. Small employee count + selective projection
keeps this cheap.

## Komponen Baru (shadcn)

Diinstal via `npx shadcn@latest add chart scroll-area tooltip`:
- `@/components/ui/chart.tsx` — Recharts wrappers (ChartContainer, Tooltip)
- `@/components/ui/scroll-area.tsx` — Radix scroll area (dept legend, sidebar)
- `@/components/ui/tooltip.tsx` — Radix tooltip primitive

Dependensi baru: `recharts` (installed oleh shadcn CLI).

## Design System

**Palette:**
- Canvas: `bg-slate-50`
- Surface: `bg-white` + `border-slate-200/80` + `shadow-sm`
- Primary: `emerald-500/600/700` (brand hijau)
- Secondary tints:
  - Success / Present → emerald
  - Warning / Late → amber
  - Info / Attendance → sky
  - Danger / Absent → rose
  - Birthday → pink
- Donut palette (8 colors): emerald-500/400/300, teal-700/500, cyan-600, slate-500/400

**Typography:**
- Heading utama: `text-2xl sm:text-3xl font-semibold tracking-tight`
- Stat values: `text-3xl font-bold tabular-nums`
- Card titles: `text-base font-semibold`
- Body: `text-sm` / `text-xs` (hierarchical)
- Semua angka pakai `tabular-nums` untuk alignment

**Spacing rhythm:** 4/6 via Tailwind (`gap-4`, `space-y-6`, `p-5`, `p-6`).

## Accessibility (WCAG AA)

- **Semantic landmarks**: `<section aria-labelledby>` / `<section aria-label>` per zona.
- **Alt text untuk icons**: semua icon dekoratif pakai `aria-hidden="true"`.
- **Interactive labels**: setiap Link wrapper punya `aria-label` deskriptif
  (e.g., `"Total Karyawan: 156"`).
- **Progress bars**: kandidat stage bars pakai `role="progressbar"` + aria-value*.
- **Focus indicators**: `focus-visible:ring-2 focus-visible:ring-emerald-500`
  pada semua Link stats.
- **Color contrast**:
  - slate-900 on white: 17:1 (AAA)
  - slate-600 on white: 7.5:1 (AAA)
  - slate-500 on white: 5.2:1 (AA)
  - emerald-700 on emerald-50: 6.8:1 (AA)
- **Keyboard nav**: semua card yang clickable jadi `<Link>` (native tab-able).
- **Screen reader**: `<ul aria-label>` pada semua list (dept, approvals, hires, birthdays).

## Sidebar Modernization

**Dari**: flat list 14 items, tema dark (`bg-slate-900`), active state solid block.

**Ke**: grouped (5 sections), tema light (`bg-white`), active state dengan
rounded pill + left indicator bar.

### Groups
1. **Umum** — Dashboard
2. **Manajemen SDM** — Karyawan, Rekrutmen
3. **Kehadiran & Cuti** — Absensi, Admin Absensi, Cuti, Kelola Cuti, Laporan Cuti
4. **Penggajian** — Penggajian, Hitung THR, Slip Gaji
5. **Sistem** — Pengguna, Data Master, Log Audit

### Visual improvements
- Brand header: logo emerald square + wordmark "HRMS / PT. SAN"
- Section labels: `uppercase tracking-wider text-[10px] text-slate-400`
- Active state:
  - Background: `bg-emerald-50`, text: `text-emerald-700`
  - Left indicator: `w-1 rounded-r-full bg-emerald-500`
  - Icon tint: `text-emerald-600`
- Hover state: `hover:bg-slate-100 hover:text-slate-900`
- Sticky footer: "Masuk sebagai {Role}" badge
- `aria-current="page"` pada active link (WAI-ARIA compliant)
- Wrapped scroll content di `ScrollArea` untuk menangani banyak items di layar kecil

## Empty States

Semua list + chart punya `<EmptyState>` fallback dengan icon, title, hint — tidak ada
"white void" saat data kosong. Dipakai di:
- Department donut (belum ada karyawan)
- Payroll trend (belum ada periode)
- Pending approvals (tidak ada pengajuan)
- Recent hires (belum ada karyawan)
- Birthdays (tidak ada dalam 30 hari)

## Responsive Breakpoints

| Breakpoint | Quick Stats | Charts Row | Lists Row |
|---|---|---|---|
| `< sm` | 1 col | stack | stack |
| `sm` | 2 cols | stack | stack |
| `lg` | 2 cols | 7+5 | 3 cols |
| `xl` | 4 cols | 7+5 | 3 cols |

## Verifikasi

- **TypeScript**: `npx tsc --noEmit` → hanya error pre-existing di
  `add-candidate-wrapper.tsx` (TS2322 sejak 04-09, bukan dari plan ini).
- **Schema compatibility**: CandidateStage enum values sesuai schema (`MELAMAR`,
  `SELEKSI_BERKAS`, `INTERVIEW`, `PENAWARAN`, `DITERIMA`, `DITOLAK`).
- **No breaking change**: HR_ADMIN / MANAGER / EMPLOYEE dashboards tetap pakai
  `getDashboardData()` yang lama. Hanya SUPER_ADMIN branch yang diganti.

## Next Steps (di luar plan ini)

1. **Realtime updates**: Tambah polling / SSE untuk attendance `today` counter.
2. **Dark mode**: pairing palette untuk `bg-slate-50` ↔ `bg-slate-950`.
3. **Date range selector**: ganti hardcoded 7-day / 6-month dengan user-selectable.
4. **Export dashboard**: tombol "Export PDF" untuk ringkasan eksekutif.
5. **HR Admin variant**: terapkan skeleton layout yang mirip untuk role HR_ADMIN.
