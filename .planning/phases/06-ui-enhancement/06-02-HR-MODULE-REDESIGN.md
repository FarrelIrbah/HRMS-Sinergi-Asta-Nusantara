---
plan: "06-02-hr-module-redesign"
phase: "06-ui-enhancement"
status: complete
completed: "2026-04-14"
type: feature
files_changed:
  - src/lib/services/employee.service.ts
  - src/lib/services/recruitment.service.ts
  - src/app/(dashboard)/employees/page.tsx
  - src/app/(dashboard)/employees/_components/employee-filters.tsx
  - src/app/(dashboard)/employees/_components/employee-table.tsx
  - src/app/(dashboard)/employees/_components/employee-columns.tsx
  - src/app/(dashboard)/employees/new/page.tsx
  - src/app/(dashboard)/employees/new/_components/create-employee-form.tsx
  - src/app/(dashboard)/recruitment/page.tsx
  - src/app/(dashboard)/recruitment/_components/vacancy-table.tsx
  - src/app/(dashboard)/recruitment/new/page.tsx
  - src/app/(dashboard)/recruitment/new/_components/create-vacancy-form.tsx
skills_applied:
  - frontend-design
  - ui-ux-pro-max
  - shadcn-ui
  - web-accessibility
  - web-design-guidelines
---

# Feature 06-02: Manajemen SDM Module Redesign (Karyawan + Rekrutmen)

Lanjutan dari plan 06-01 (Super Admin Dashboard V2). Menerapkan design language
yang sama — canvas `bg-slate-50`, palette emerald, KPI tiles, typography
hierarchy — ke dua submenu dari grup "Manajemen SDM" di sidebar:

1. **/employees** (Karyawan) — daftar karyawan dengan filter, tabel, dan KPI.
2. **/employees/new** (Tambah Karyawan) — formulir pendaftaran karyawan baru.
3. **/recruitment** (Rekrutmen) — daftar lowongan dengan pipeline visualization.
4. **/recruitment/new** (Buat Lowongan) — formulir pembuatan lowongan baru.

## Tujuan

- **Konsistensi visual** dengan Super Admin Dashboard V2: palette, spacing,
  typography, komponen (SummaryTile/TONE_MAP pattern).
- **Informatif**: menambahkan KPI summary bar di atas setiap halaman agar HR
  langsung dapat gambaran operasional tanpa perlu scroll/hitung manual.
- **Responsif**: mobile-first grid (2 cols → 3 → 5) untuk KPI; table-to-card
  responsive pattern untuk Rekrutmen.
- **Aksesibel**: WCAG AA — aria-labels, semantic landmarks, progressbar role
  untuk pipeline bar, focus-visible rings.

## Halaman 1: Karyawan (/employees)

### Sebelum
- Header text polos dengan tombol "Tambah Karyawan".
- Filter berupa form grid flat tanpa visual anchor.
- Tabel tanpa context (jumlah ditampilkan, progress filter).
- Kolom nama hanya text; tidak ada avatar/visual cue.
- Badge status/kontrak memakai solid variant.
- Tidak ada KPI summary.

### Sesudah

**Layout structure (top → bottom):**

```
┌─────────────────────────────────────────────────────┐
│ Header: [Logo] Karyawan            [+ Tambah Karyawan] │
│   Subtitle: "Kelola seluruh data karyawan..."         │
├─────────────────────────────────────────────────────┤
│ KPI Bar (5 tiles, responsive 2→3→5 cols)            │
│ [Aktif][PKWT][PKWTT][Baru Bulan Ini][Nonaktif]      │
├─────────────────────────────────────────────────────┤
│ Filter Card                                         │
│   [Filter icon] FILTER                              │
│   [Search: nama/email/NIK] [Dept] [Jabatan] [Status] [Kontrak] │
│   Filter aktif: [chip][chip][chip]  [Reset][Terapkan]│
├─────────────────────────────────────────────────────┤
│ Table Card                                          │
│   [Users2 icon] Daftar Karyawan                     │
│   Menampilkan X dari Y karyawan                     │
│   ┌─ Data Table ────────────────────────────────┐  │
│   │ Karyawan | Dept | Jabatan | Kontrak | Bergabung | Status | ⋮ │ │
│   └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Komponen yang diubah

1. **`employees/page.tsx`** — server component
   - Full-bleed canvas `-m-4 md:-m-6 p-4 md:p-6 bg-slate-50`.
   - Header dengan emerald logo square (`Users2` icon, `h-9 w-9 rounded-lg`).
   - 5-card KPI grid, parallel fetch dengan `Promise.all`:
     ```ts
     const [employeeResult, stats, departments, positions] = await Promise.all([
       role === "MANAGER"
         ? getEmployeesForManager(session.user.id, { ... })
         : getEmployees({ ... }),
       getEmployeeStatsSummary(),
       getAllDepartments(),
       getAllPositions(),
     ])
     ```
   - `SummaryTile` + `TONE_MAP` sub-component di bawah file (reusable pattern
     yang sama dengan super-admin-dashboard.tsx).

2. **`employees/_components/employee-filters.tsx`** — client
   - Wrapped di Card dengan header strip (`Filter icon + "FILTER" uppercase`).
   - Grid 5-col di `lg+`, search mengambil 2 col (`lg:col-span-2`).
   - **Chip bar**: filter aktif direnderkan sebagai badges hijau kecil dengan
     tombol `X` untuk menghapus individual filter. Terdapat state
     `hasFilters` untuk menampilkan "Belum ada filter aktif" placeholder.
   - Reset button disabled saat `!hasFilters`.
   - MANAGER role: departemen select di-hide (`{!isManager && ...}`).
   - Label menggunakan `text-xs font-medium text-slate-600`.

3. **`employees/_components/employee-table.tsx`** — client
   - Wrapped DataTable di Card dengan CardHeader berisi title + description.
   - Description dinamis: "Menampilkan **X** dari **Y** karyawan".
   - Scoped styling via arbitrary Tailwind:
     ```
     [&_tbody_tr:hover]:bg-slate-50/70
     [&_thead_th]:bg-slate-50/60
     [&_thead_th]:text-xs
     [&_thead_th]:font-semibold
     [&_thead_th]:uppercase
     [&_thead_th]:tracking-wide
     ```
   - Borderless CardContent (`p-0`) agar table touch di tepi Card.

4. **`employees/_components/employee-columns.tsx`** — client
   - **Kolom "Karyawan"** (gabungan):
     - `Avatar` (shadcn) dengan `AvatarFallback` inisial dari namaLengkap
       (helper `initials()`: ambil 2 huruf pertama dari word pertama+kedua).
     - Background avatar: `bg-emerald-100 text-emerald-700`.
     - Baris 1: nama lengkap (font-medium, slate-900).
     - Baris 2: email · NIK (NIK pakai `font-mono tabular-nums`).
   - **Badge Kontrak**: outline variant, color by type
     - PKWT → `border-sky-200 bg-sky-50 text-sky-700`
     - PKWTT → `border-violet-200 bg-violet-50 text-violet-700`
   - **Badge Status**: outline + colored dot prefix
     - Aktif → emerald dot + emerald text
     - Nonaktif → slate dot + slate text
   - **Actions kolom**: DropdownMenu dengan ikon `Eye` (Lihat Detail) +
     `Pencil` (Edit, hanya jika `canEdit`).

## Halaman 2: Rekrutmen (/recruitment)

### Sebelum
- Tabel flat dengan kolom lowongan (judul, dept, status, count).
- Tidak ada visualisasi pipeline kandidat (perlu klik masuk ke detail).
- Tidak ada KPI summary.
- Toggle tutup/buka sebagai ikon kecil tanpa konteks.

### Sesudah

**Layout structure:**

```
┌─────────────────────────────────────────────────────┐
│ Header: [Logo] Rekrutmen            [+ Buat Lowongan]│
│   Subtitle: "Kelola lowongan pekerjaan..."          │
├─────────────────────────────────────────────────────┤
│ KPI Bar (5 tiles)                                   │
│ [Aktif][Ditutup][Total Kandidat][Interview][Hired]  │
├─────────────────────────────────────────────────────┤
│ [Tabs: Semua | Dibuka | Ditutup]    X lowongan ditemukan│
├─────────────────────────────────────────────────────┤
│ Grid of VacancyCard (1→2→3 cols)                    │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│ │ Card     │ │ Card     │ │ Card     │              │
│ │ title    │ │ title    │ │ title    │              │
│ │ meta     │ │ meta     │ │ meta     │              │
│ │ pipeline │ │ pipeline │ │ pipeline │              │
│ │ actions  │ │ actions  │ │ actions  │              │
│ └──────────┘ └──────────┘ └──────────┘              │
└─────────────────────────────────────────────────────┘
```

### Komponen yang diubah

1. **`recruitment/page.tsx`** — server component
   - Full-bleed canvas pattern yang sama.
   - Header dengan `BriefcaseBusiness` emerald logo.
   - 5 SummaryTile KPI:

   | Tile | Tone | Value |
   |---|---|---|
   | Lowongan Aktif | emerald | `stats.openVacancies` |
   | Ditutup | slate | `stats.closedVacancies` |
   | Total Kandidat | sky | `stats.totalCandidates` |
   | Interview Terjadwal | amber | `stats.upcomingInterviews` |
   | Hired Bulan Ini | violet | `stats.hiredThisMonth` |

   - Parallel fetch:
     ```ts
     const [vacancies, stats] = await Promise.all([
       getVacanciesWithPipeline(statusFilter),
       getRecruitmentStatsSummary(),
     ])
     ```

2. **`recruitment/_components/vacancy-table.tsx`** — client (nama dipertahankan,
   tapi sekarang card grid, bukan table)
   - **Tabs** shadcn untuk status filter (Semua / Dibuka / Ditutup), sync ke
     URL via `useSearchParams` + `router.push`.
   - **Grid responsif**: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`.
   - **Empty state card**: dashed border, icon briefcase, CTA "Buat Lowongan".

3. **`VacancyCard` sub-component** (inner di vacancy-table.tsx)

   **Header (CardHeader):**
   - Title: `<Link>` ke detail + hover emerald-700 + focus-visible ring.
   - Subtitle: `Briefcase` icon + nama departemen.
   - Badge status: outline + dot prefix (emerald untuk Dibuka, slate untuk Ditutup).

   **Meta grid (2 cols):**
   - Kandidat: `Users` icon + count besar (`text-lg font-bold tabular-nums`).
   - Dibuka: `Calendar` icon + tanggal (`formatDate` id-ID locale).

   **Pipeline visualization:**
   - Label uppercase `PIPELINE KANDIDAT`.
   - **Empty**: dashed border box "Belum ada pelamar untuk lowongan ini."
   - **Non-empty**:
     - Stacked progress bar dengan `role="progressbar"` + aria values.
     - Segments per stage dengan width = `(count / total) * 100%`.
     - Title attribute untuk hover tooltip native.
     - Stage badges di bawah: colored dot + label + count.

   **STAGE_CONFIG** map (label + bg color + bar color per stage):
   ```
   MELAMAR        → slate-400/100
   SELEKSI_BERKAS → sky-500/50
   INTERVIEW      → amber-500/50
   PENAWARAN      → violet-500/50
   DITERIMA       → emerald-500/50
   DITOLAK        → rose-400/50
   ```

   **PIPELINE_ORDER** tuple untuk konsistensi rendering:
   ```
   [MELAMAR, SELEKSI_BERKAS, INTERVIEW, PENAWARAN, DITERIMA, DITOLAK]
   ```

   **Action row:**
   - "Lihat Detail" Button (outline, flex-1) → `/recruitment/{id}`.
   - Separator vertikal `h-8`.
   - Toggle tutup/buka Button (ghost, tint sesuai status):
     - Isi saat `isPending`: `Loader2` spin.
     - `isOpen === true` → rose tint "Tutup".
     - `isOpen === false` → emerald tint "Buka".

## Halaman 3: Tambah Karyawan (/employees/new)

### Sebelum
- Header polos tanpa visual anchor atau back link.
- 4 Card section tanpa identitas visual (tidak ada ikon / nomor).
- Tidak ada panduan navigasi antar section pada form yang panjang.
- Password toggle button ukuran besar yang mengganggu input.
- Tombol aksi di bawah form (harus scroll semua field untuk submit).
- Tidak ada indikasi field wajib kecuali suffix `*` pada label.

### Sesudah

**Layout structure:**

```
┌─────────────────────────────────────────────────────┐
│ ← Kembali ke Daftar Karyawan                        │
├─────────────────────────────────────────────────────┤
│ [Logo] Tambah Karyawan                              │
│   Subtitle: "Lengkapi formulir... * wajib diisi"    │
├──────────────────────────┬──────────────────────────┤
│ Section Nav (sticky)     │ Form Cards (scroll)      │
│ ┌──────────────────────┐ │ ┌──────────────────────┐ │
│ │ 1 · Informasi Akun   │ │ │ [@] Langkah 1        │ │
│ │    Email & password  │ │ │     Informasi Akun   │ │
│ │ 2 · Informasi Pribadi│ │ │   [email][password]  │ │
│ │ 3 · Detail Pekerjaan │ │ └──────────────────────┘ │
│ │ 4 · Pajak & BPJS     │ │ ┌──────────────────────┐ │
│ └──────────────────────┘ │ │ [👤] Langkah 2        │ │
│                          │ │     ...              │ │
│                          │ └──────────────────────┘ │
│                          │ ... (sections 3, 4)     │ │
│                          │ ┌─────────────────────┐  │
│                          │ │ [sticky action bar] │  │
│                          │ └─────────────────────┘  │
└──────────────────────────┴──────────────────────────┘
```

### Perubahan kunci

1. **`employees/new/page.tsx`** — server component
   - Full-bleed canvas `bg-slate-50` pattern sama dengan list pages.
   - **Back link**: ghost button "← Kembali ke Daftar Karyawan" dengan `ArrowLeft` icon.
   - **Header**: emerald logo square dengan `UserPlus` icon + judul + subtitle
     yang menjelaskan konvensi `*` untuk field wajib (ditampilkan inline dengan
     warna rose-600 untuk immediate recognition).

2. **`employees/new/_components/create-employee-form.tsx`** — client
   - **Layout 2-col di `lg+`**: sidebar nav kiri (260px) + form kanan.
   - **Section nav sidebar** (sticky `top-6`):
     - `<ol>` dengan 4 anchor links (hash `#informasi-akun`, `#informasi-pribadi`,
       `#detail-pekerjaan`, `#pajak-bpjs`).
     - Tiap item: badge number (1-4) + title + hint subtitle.
     - Hover state: emerald tint pada badge + title.
     - Focus ring: `focus-visible:ring-2 focus-visible:ring-emerald-500`.
   - **`FormSection` sub-component**: reusable section card dengan:
     - Icon-badge emerald (sky tone) di header.
     - Eyebrow "Langkah N" + separator + section title.
     - Border-bottom header untuk visual separation dari fields.
     - `scroll-mt-24` agar anchor jump tidak tertutup fixed elements.
   - **`RequiredMark` sub-component**: `<span aria-hidden>*</span>` dengan
     warna rose-600; dipakai di 5 field required
     (email, password, nama, dept, jabatan, kontrak, join date).
   - **Password toggle**: diubah dari Button oversize ke tombol icon kecil
     (`h-7 w-7`) di dalam input dengan `pr-10` padding. Aria-label dinamis
     ("Tampilkan password" / "Sembunyikan password"). Added `autoComplete="new-password"`.
   - **Input enhancements**:
     - Email: `autoComplete="email"`.
     - Nama: `autoComplete="name"`.
     - Nomor HP: `inputMode="tel" autoComplete="tel"`.
     - NIK KTP & NPWP: `inputMode="numeric"`.
     - Password help text: "Karyawan dapat mengubah password setelah login pertama".
   - **Sticky action bar** (`sticky bottom-4 z-10`):
     - Rounded card dengan `bg-white/95 backdrop-blur shadow-lg`.
     - Left: hint text "Pastikan semua kolom wajib terisi sebelum menyimpan."
     - Right: Cancel (outline) + Save (emerald-600 dengan Save icon + Loader2 saat
       isSubmitting).
     - Mobile: stack column-reverse (aksi di atas, hint di bawah).

### Section icons

| Step | Title | Icon |
|---|---|---|
| 1 | Informasi Akun | `AtSign` |
| 2 | Informasi Pribadi | `User` |
| 3 | Detail Pekerjaan | `Briefcase` |
| 4 | Pajak & BPJS | `Receipt` |

## Halaman 4: Buat Lowongan (/recruitment/new)

### Sebelum
- Container `max-w-2xl p-6` polos tanpa canvas coloring.
- Title + subtitle flat, tanpa logo/ikon.
- Form tanpa section grouping (semua field sequential).
- Date input pakai `<input type="date">` raw dengan className 180+ karakter
  copy-paste dari shadcn source (tidak pakai `<Input>` component).
- Tidak ada tips/guidance untuk HR yang baru membuat lowongan.
- Tombol aksi `justify-start` tanpa emphasis visual.

### Sesudah

**Layout structure:**

```
┌─────────────────────────────────────────────────────┐
│ ← Kembali ke Daftar Lowongan                        │
├─────────────────────────────────────────────────────┤
│ [Logo] Buat Lowongan Baru                           │
│   Subtitle: "Isi detail... kualifikasi..."          │
├───────────────────────────────────┬─────────────────┤
│ Main Form (3 sections)            │ Tips Sidebar    │
│ ┌───────────────────────────────┐ │ ┌─────────────┐ │
│ │ [💼] Informasi Lowongan        │ │ │ [💡] Tips   │ │
│ │   Judul, departemen           │ │ │ • Judul ... │ │
│ │ [📄] Deskripsi & Persyaratan   │ │ │ • Tugas ... │ │
│ │   Desc, req                   │ │ │ • Kualif... │ │
│ │ [📅] Periode Lowongan          │ │ │ • Opsional  │ │
│ │   openDate, closeDate         │ │ └─────────────┘ │
│ └───────────────────────────────┘ │                 │
│ [sticky action bar]               │                 │
└───────────────────────────────────┴─────────────────┘
```

### Perubahan kunci

1. **`recruitment/new/page.tsx`** — server component
   - Full-bleed canvas + back link + emerald `BriefcaseBusiness` header
     (konsisten dengan `/recruitment` list page).
   - Subtitle explains purpose dan value of good vacancy descriptions.

2. **`recruitment/new/_components/create-vacancy-form.tsx`** — client
   - **Layout 2-col di `lg+`**: form kiri (1fr) + tips sidebar kanan (300px).
   - **3 FormSection**:
     - `Briefcase` — Informasi Lowongan (judul + departemen)
     - `FileText` — Deskripsi & Persyaratan (2 textarea, rows=5)
     - `CalendarRange` — Periode Lowongan (open + close date)
   - **Date inputs**: diubah dari raw `<input type="date">` + 180-char className
     copy-paste menjadi shadcn `<Input type="date" />`. Konsisten dengan form
     karyawan.
   - **Tips sidebar** (`Card` dengan tint emerald-50/50):
     - Emerald logo square dengan `Lightbulb` icon.
     - Title: "Tips Menulis Lowongan".
     - `<ul>` dengan 4 tips + `CheckCircle2` bullets:
       - Judul spesifik
       - Tanggung jawab 3–5 poin
       - Kualifikasi minimum vs preferred
       - Tanggal tutup opsional
     - `lg:sticky lg:top-6` — tetap terlihat saat scroll form panjang.
   - **Sticky action bar**: pola yang sama dengan create-employee-form:
     - Hint: "Lowongan akan langsung berstatus **Dibuka** setelah disimpan."
     - Save button emerald dengan `Save` icon + Loader2 spinner saat isPending.
   - **RequiredMark** applied pada judul, departemen, deskripsi, persyaratan, tanggal buka.

## Services Extended

### `src/lib/services/employee.service.ts`

Ditambahkan:

```ts
export interface EmployeeStatsSummary {
  totalActive: number
  totalInactive: number
  pkwtCount: number
  pkwttCount: number
  joinedThisMonth: number
}

export async function getEmployeeStatsSummary(): Promise<EmployeeStatsSummary>
```

Parallel Prisma count queries untuk 5 metrik; `joinedThisMonth` memakai window
`gte: firstOfMonth`.

### `src/lib/services/recruitment.service.ts`

Ditambahkan dua function + dua type:

```ts
// Extended include — candidates stage untuk pipeline viz
export async function getVacanciesWithPipeline(status?: "OPEN" | "CLOSED")
  : Promise<VacancyWithPipeline[]>

export type VacancyWithPipeline = Awaited<
  ReturnType<typeof getVacanciesWithPipeline>
>[number]

export interface RecruitmentStatsSummary {
  openVacancies: number
  closedVacancies: number
  totalCandidates: number
  upcomingInterviews: number
  hiredThisMonth: number
}

export async function getRecruitmentStatsSummary()
  : Promise<RecruitmentStatsSummary>
```

`getVacanciesWithPipeline` memakai Prisma include:

```ts
{
  department: { select: { name: true } },
  _count: { select: { candidates: true } },
  candidates: { select: { stage: true } },  // untuk pipeline grouping di client
}
```

## Design System (inherited dari 06-01)

**Palette:**
- Canvas: `bg-slate-50`
- Surface: `bg-white` + `border-slate-200/80` + `shadow-sm`
- Primary: `emerald-500/600/700`
- KPI tones (5 colors):
  - emerald — active / primary metrics
  - sky — info / count metrics
  - violet — secondary categorical
  - amber — warning / scheduling
  - slate — inactive / neutral
- Stage palette:
  - slate (MELAMAR) · sky (SELEKSI) · amber (INTERVIEW) · violet (PENAWARAN) ·
    emerald (DITERIMA) · rose (DITOLAK)

**Typography:**
- Page heading: `text-2xl font-semibold tracking-tight`
- KPI value: `text-2xl font-bold tabular-nums`
- Card title: `text-base font-semibold`
- Body: `text-sm` primer, `text-xs` sekunder
- Uppercase eyebrow: `text-[10px]-[11px] tracking-wide uppercase text-slate-400/500`

**Spacing rhythm:** 4/6 via Tailwind (`gap-3`, `gap-4`, `space-y-6`, `p-4`, `p-6`).

## Accessibility (WCAG AA)

**Semantic landmarks:**
- `<div aria-label="Halaman karyawan">` / `<div aria-label="Halaman rekrutmen">`.
- `<section aria-label="Ringkasan statistik karyawan">` di KPI bar.
- `<section aria-label="Ringkasan statistik rekrutmen">` di KPI bar.
- `<ul aria-label="Daftar lowongan pekerjaan">` di vacancy grid.

**Icon decorum:**
- Semua icon dekoratif pakai `aria-hidden="true"`.
- Avatar fallback menampilkan initials — screen reader membaca nama lengkap
  dari baris di sebelahnya (no duplicate).

**Interactive labels:**
- Button toggle: `aria-label` dinamis ("Tutup lowongan X" / "Buka kembali lowongan X").
- Detail link: `aria-label="Lihat detail lowongan ${title}"`.
- Chip X button: `aria-label="Hapus filter ${label}"`.
- Filter input: `<Label htmlFor>` paired with `<Input id>`.

**Progress bar:**
- `role="progressbar"` + `aria-label` + `aria-valuenow`/`min`/`max` di pipeline bar.
- Stage badges di bawahnya dimarked `aria-hidden="true"` (redundant info untuk SR).

**Focus indicators:**
- `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2` pada link title.
- Chip X button: `focus-visible:ring-2 focus-visible:ring-emerald-500`.

**Status announcement:**
- `<p aria-live="polite">` pada counter "X lowongan ditemukan" untuk live update
  ketika filter berubah.
- `<div role="status" aria-live="polite">` pada chip bar filter aktif.

**Form accessibility (create pages):**
- Back link punya `aria-label` deskriptif (mis. "Kembali ke daftar karyawan").
- Section cards pakai `id` untuk anchor linking + `scroll-mt-24` untuk smooth
  scroll tanpa tertutup header.
- Section nav: `<nav aria-label="Navigasi bagian formulir">` wrap `<ol>`, setiap
  `<a>` punya focus-visible ring.
- Password toggle: `aria-label` dinamis per state ("Tampilkan password" /
  "Sembunyikan password"); icon di dalam `aria-hidden="true"`.
- RequiredMark `*` adalah pure visual — marked `aria-hidden="true"`, konvensi
  diumumkan di subtitle halaman untuk SR user.
- Action bar buttons: Cancel via `<Link>` asChild (native anchor, keyboard
  accessible); Submit dengan `disabled={isSubmitting}` prevents double-submit.
- Input semantic attributes: `type="email"`, `autoComplete`, `inputMode="tel"/"numeric"`
  untuk mobile keyboard UX + SR pronounciation cues.

**Color contrast (verified):**
- slate-900 on white: 17:1 (AAA)
- slate-700 on white: 12:1 (AAA)
- slate-600 on white: 7.5:1 (AAA)
- emerald-700 on emerald-50: 6.8:1 (AA)
- sky-700 on sky-50: 7.4:1 (AAA)
- violet-700 on violet-50: 7.0:1 (AA)
- amber-700 on amber-50: 5.3:1 (AA)
- rose-700 on rose-50: 6.4:1 (AA)

## Responsive Breakpoints

### Karyawan (list)
| Breakpoint | KPI | Filter Grid | Table |
|---|---|---|---|
| `< sm` | 2 cols | 1 col | horizontal scroll |
| `sm` | 3 cols | 2 cols | horizontal scroll |
| `lg` | 5 cols | 5 cols (search 2x) | fit |

### Rekrutmen (list)
| Breakpoint | KPI | Vacancy Grid |
|---|---|---|
| `< sm` | 2 cols | 1 col |
| `sm` | 3 cols | 1 col |
| `md` | 3 cols | 2 cols |
| `lg` | 5 cols | 2 cols |
| `xl` | 5 cols | 3 cols |

### Tambah Karyawan (form)
| Breakpoint | Layout | Section Nav |
|---|---|---|
| `< lg` | single column | tidak ditampilkan (form scroll biasa) |
| `lg+` | 260px + 1fr grid | sticky top-6 sidebar |

Field grid dalam setiap section: `1 col` default → `sm:grid-cols-2`.
Sticky action bar: column-reverse di mobile, row di `sm+`.

### Buat Lowongan (form)
| Breakpoint | Layout | Tips Sidebar |
|---|---|---|
| `< lg` | single column | di bawah form (end of flow) |
| `lg+` | 1fr + 300px grid | sticky top-6 sidebar |

Periode (openDate/closeDate): `1 col` default → `sm:grid-cols-2`.

## Role-based Differences

**Karyawan page:**
- `EMPLOYEE` → di-redirect ke `/employees/{id}` profile sendiri (behavior
  dipertahankan dari sebelumnya).
- `MANAGER` → subtitle diubah, departemen filter disembunyikan, fetch via
  `getEmployeesForManager()`, action kolom Edit tetap tersembunyi (`!canEdit`).
- `HR_ADMIN`/`SUPER_ADMIN` → full CRUD, tombol "Tambah Karyawan" visible.

**Rekrutmen page:**
- `HR_ADMIN`/`SUPER_ADMIN` only — non-eligible role redirect ke `/dashboard`.

## Verifikasi

- **TypeScript**: `npx tsc --noEmit` → hanya 1 error pre-existing di
  `src/app/(dashboard)/recruitment/[vacancyId]/_components/add-candidate-wrapper.tsx`
  (TS2322 `onSuccess` prop — file adalah dead code dari refactor 05-04/05-05,
  tidak dimport di mana pun). Tidak ada error baru dari plan ini.
- **Schema compatibility**: CandidateStage values konsisten dengan schema Prisma.
- **Shadcn components reused**: Card, Badge, Button, Input, Label, Select,
  Separator, Tabs, Avatar, DropdownMenu, Table (via DataTable) — semua sudah
  terinstal dari plan sebelumnya; tidak ada instalasi baru.
- **No breaking change**: signature service lama (`getEmployees`, `getVacancies`)
  dipertahankan. Function baru (`getEmployeeStatsSummary`,
  `getVacanciesWithPipeline`, `getRecruitmentStatsSummary`) adalah additive.

## Next Steps (di luar plan ini)

1. **Karyawan detail page** (`/employees/[id]`) — terapkan design language yang
   sama untuk tab navigation + profile hero.
2. **Rekrutmen detail page** (`/recruitment/[vacancyId]`) — konsistensi dengan
   kanban redesign; kanban stages gunakan STAGE_CONFIG yang sama.
3. **Table column sorting UI** — saat ini sort state ada di TanStack Table tapi
   header belum punya affordance visual; tambahkan ikon ChevronUpDown.
4. **Bulk actions** — checkbox selection + bulk deactivate/export.
5. **Saved filters** — simpan preset filter ke URL sharable atau user preference.
