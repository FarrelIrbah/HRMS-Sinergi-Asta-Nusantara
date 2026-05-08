# Audit Responsivitas HRMS PT. SAN — 2026-05-03

Audit menyeluruh terhadap semua halaman, menu, dan dashboard untuk semua role
(SUPER_ADMIN, HR_ADMIN, MANAGER, EMPLOYEE) terhadap viewport mobile (≤640px),
tablet (≤1024px), dan desktop. Hasil audit + perbaikan yang sudah diterapkan
ada di dokumen ini.

---

## 1. Lingkup Audit

| Area | Path |
|------|------|
| Auth | `src/app/(auth)/login/page.tsx` |
| Layout dasar | `src/app/(dashboard)/layout.tsx`, `src/components/layout/*` |
| Komponen shared | `src/components/shared/*` |
| Dashboard | `src/app/(dashboard)/dashboard/_components/*-dashboard.tsx` (4 role) |
| Karyawan | `src/app/(dashboard)/employees/**` |
| Absensi | `src/app/(dashboard)/attendance/**`, `attendance-admin/**` |
| Cuti | `src/app/(dashboard)/leave/**` |
| Penggajian | `src/app/(dashboard)/payroll/**`, `payslip/**` |
| Rekrutmen | `src/app/(dashboard)/recruitment/**` |
| Sistem | `src/app/(dashboard)/users/**`, `master-data/**`, `audit-log/**` |

Total ±21 halaman + ±60 sub-komponen. Audit dilakukan oleh empat agent
paralel dengan pembagian per kelompok modul.

## 2. Breakpoint yang dipakai

Mengikuti Tailwind default:

| Token | Min-width | Target perangkat |
|-------|-----------|------------------|
| (default) | 0 | mobile portrait (≥320px) |
| `sm:` | 640px | mobile landscape / tablet kecil |
| `md:` | 768px | tablet |
| `lg:` | 1024px | laptop / desktop |
| `xl:` | 1280px | desktop besar |

## 3. Status sebelum audit

Sebagian besar halaman sudah responsif (header pakai `flex-col sm:flex-row`,
KPI grid pakai `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`, Sheet untuk
sidebar mobile). Yang masih bermasalah ada di lapisan komponen shared dan
beberapa tabel raw — saat fix di shared layer, banyak halaman ikut terbenahi.

## 4. Temuan kritis dan perbaikan

### 4.1 Komponen shared (efek lintas-modul)

| File | Masalah | Perbaikan |
|------|---------|-----------|
| `src/components/shared/data-table.tsx` | Tabel di-render dalam `<div className="rounded-md border">` tanpa min-width — kolom-kolom akan ter-compress di mobile (DataTable shadcn punya `overflow-auto` di komponen `Table`, tapi tanpa min-width tidak akan trigger horizontal scroll). | Tambah `<Table className="min-w-[640px]">` agar di mobile akan trigger horizontal scroll otomatis. Berdampak ke: employees, users, audit-log, master-data (semua tab), recruitment vacancy table. |
| `src/components/shared/data-table-pagination.tsx` | `flex justify-between` dengan label "Baris per halaman" + select + 2 button → overflow di mobile. | Refactor jadi `flex-col sm:flex-row`, label di-shorten (`Baris` di mobile, `Baris per halaman` di sm+), button text disembunyikan di mobile (cuma chevron). |
| `src/components/layout/sidebar.tsx` (MobileSidebar) | `w-64` fixed (256px), `h-[calc(100vh-4rem-3.25rem)]` hardcoded → tidak adaptif untuk perangkat sempit. | Ubah ke `w-72 max-w-[85vw] sm:max-w-sm` + flexbox column dengan `min-h-0 flex-1` untuk ScrollArea, footer pakai `shrink-0`. |

### 4.2 Tabel raw (bukan via DataTable)

Tabel-tabel ini langsung pakai `<Table>` shadcn tanpa `DataTable` wrapper.
Dibungkus dengan `overflow-hidden rounded-lg border` yang berisiko menahan
scroll horizontal di mobile. Diperbaiki dengan menambah `min-w-[…]` pada
`<Table>` dan mengganti `overflow-hidden` menjadi tanpa overflow (atau
sudah ada `overflow-x-auto` parent).

| File | min-w | Catatan |
|------|-------|---------|
| `attendance/_components/attendance-history.tsx` | `min-w-[640px] md:table-fixed` | `table-fixed` hanya di md+ agar di mobile tidak compress |
| `attendance-admin/_components/attendance-summary-table.tsx` | `min-w-[760px]` | 8 kolom; padding card juga diadaptasi `p-3 sm:p-6` |
| `attendance-admin/[employeeId]/page.tsx` | `min-w-[640px] md:table-fixed` | sama pola dengan attendance-history; padding card `p-3 sm:p-6` |
| `leave/_components/leave-history-table.tsx` | `min-w-[720px]` | 6 kolom |
| `leave/manage/_components/leave-approval-table.tsx` | `min-w-[820px]` | 7 kolom (Karyawan, Jenis, Periode, Hari, Status, Catatan, Aksi) |
| `leave/report/page.tsx` | `min-w-[760px]` | gabungan dengan style padding kustom |
| `employees/[id]/_components/documents-tab.tsx` | `min-w-[720px]` | 5 kolom dokumen + ikon |

### 4.3 Filter & toolbar

| File | Masalah | Perbaikan |
|------|---------|-----------|
| `audit-log/_components/audit-log-filters.tsx` | `min-w-[180px]` & `w-[160px]` fixed di select & date input → overflow di mobile sempit. | Layout berubah ke `grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap`. Date input `w-full lg:w-[160px]`, select `lg:min-w-[180px]`. Tombol Apply/Reset `flex-1 sm:flex-none` agar mengisi penuh di mobile. |

### 4.4 Dashboard grid breakpoint

KPI grid di 4 dashboard pakai `sm:grid-cols-2 xl:grid-cols-4` — antara 768px
dan 1280px (tablet & laptop kecil) tetap 2 kolom padahal cukup ruang untuk 4.
Diturunkan ke `lg:grid-cols-4` (1024px+).

| File | Sebelum | Sesudah |
|------|---------|---------|
| `super-admin-dashboard.tsx` | `sm:grid-cols-2 xl:grid-cols-4` | `sm:grid-cols-2 lg:grid-cols-4` |
| `hr-admin-dashboard.tsx` | sama | sama |
| `manager-dashboard.tsx` | sama | sama |
| `employee-dashboard.tsx` | sama | sama |

### 4.5 Recruitment — candidate detail

Halaman `recruitment/candidates/[candidateId]/page.tsx` sebelumnya pakai
`p-6 space-y-6` tanpa adaptasi mobile + sub-component `candidate-detail-client.tsx`
tidak responsif.

| File | Masalah | Perbaikan |
|------|---------|-----------|
| `candidates/[candidateId]/page.tsx` | `p-6` (padding besar tanpa adaptation), breadcrumb tidak wrap | Hapus `p-6` (parent layout sudah handle padding), breadcrumb pakai `flex-wrap gap-x-2 gap-y-1`, text ke `text-xs sm:text-sm` |
| `candidate-detail-client.tsx` (header) | `flex items-start justify-between` tanpa stack di mobile, action buttons pakai `flex items-center gap-2` tanpa wrap | Header: `flex flex-col gap-4 md:flex-row`. Actions: `flex flex-wrap`, button `flex-1 sm:flex-none` agar full di mobile |
| `candidate-detail-client.tsx` (forms) | `max-w-sm` saja | `w-full max-w-sm sm:max-w-md` |

### 4.6 Halaman/komponen yang sudah OK (no-op)

Berikut halaman yang sudah responsif sejak awal dan tidak perlu perubahan:
- `(auth)/login/page.tsx` — split-screen `lg:grid-cols-[1.05fr_1fr]` dengan brand panel hidden di mobile
- `(dashboard)/layout.tsx` — sidebar `md:pl-64`, main `p-4 md:p-6`, MobileSidebar via Sheet
- `components/layout/header.tsx`, `breadcrumbs.tsx` — flex layout, padding adaptif
- `components/shared/stat-card.tsx`, `summary-tile.tsx` — text adaptif, `min-w-0` truncate
- `dashboard/super-admin-dashboard.tsx` (selain grid breakpoint) — section grid sudah `lg:grid-cols-12` / `lg:grid-cols-3` dengan stack di mobile
- `employees/page.tsx`, `employees/new/page.tsx`, `employees/[id]/page.tsx` — header `flex-col sm:flex-row`, KPI grid responsif
- `employees/_components/employee-filters.tsx` — `grid-cols-1 sm:grid-cols-2 lg:grid-cols-5`
- `attendance/page.tsx`, `attendance-admin/page.tsx` — KPI & header responsif
- `leave/page.tsx`, `leave/_components/leave-balance-card.tsx`, `leave-request-section.tsx` — grid responsif
- `payroll/page.tsx`, `payroll/[periodId]/page.tsx` — KPI grid + tabel `min-w-[640px]` + `overflow-x-auto`
- `payslip/page.tsx` — tabel admin & employee view sudah punya wrapper `overflow-x-auto` + `min-w-[840px]`/`min-w-[560px]`
- `recruitment/page.tsx`, `[vacancyId]/page.tsx`, `kanban-board.tsx` — kanban grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- `recruitment/new/page.tsx`, `create-vacancy-form.tsx` — `lg:grid-cols-[1fr_300px]` dengan stack di mobile/tablet, sticky action bar `flex-col-reverse sm:flex-row`
- `users/page.tsx`, `_components/user-table.tsx`, `user-form-dialog.tsx` — Dialog `sm:max-w-[440px]`
- `master-data/page.tsx`, `master-data-tabs.tsx` — TabsList `flex-wrap` (wrap ke 2 baris di mobile, OK untuk 4 tab)
- `audit-log/page.tsx`, `audit-log-table.tsx`, `[id]/page.tsx` — DataTable + grid `sm:grid-cols-2 lg:grid-cols-3`
- Semua Dialog (`confirm-dialog.tsx`, `manual-record-dialog.tsx`, `add-candidate-dialog.tsx`, dll) — pakai `sm:max-w-[xxx]` yang full-width di mobile

## 5. Pola yang dipakai (panduan untuk maintainer)

### 5.1 Tabel data

Default ke pola berikut untuk semua tabel berisi data:
```tsx
<div className="rounded-md border">
  <Table className="min-w-[640px]">  {/* atau min-w sesuai jumlah kolom */}
    {/* ... */}
  </Table>
</div>
```

`Table` shadcn sudah membungkus dengan `<div className="relative w-full overflow-auto">`,
jadi `min-w-[…]` akan trigger horizontal scroll otomatis di mobile. Jangan
bungkus dengan `overflow-hidden` (akan menahan scroll); pakai `rounded-md border`
saja — radius sudut tetap terlihat berkat `Table` overflow internal.

Aturan min-w berdasarkan jumlah kolom:
- 4 kolom kecil → `min-w-[480px]`
- 5–6 kolom → `min-w-[640px]` (default)
- 7 kolom → `min-w-[760px]`
- 8 kolom → `min-w-[840px]`+

### 5.2 Header halaman

```tsx
<header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 className="text-2xl font-semibold">Judul</h1>
    <p className="mt-1 text-sm text-slate-600">Deskripsi.</p>
  </div>
  <Button>Aksi</Button>
</header>
```

### 5.3 KPI / stat grid

```tsx
<section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
  {/* untuk 5 stat — di mobile 2 kolom, tablet 3, desktop 5 */}
</section>
```

Untuk 4 stat: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`. Hindari pakai
`xl:grid-cols-4` — tablet 768–1280px terbuang ruangnya.

### 5.4 Filter bar

Bila lebih dari 3 field, pakai grid responsif:
```tsx
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap">
  {/* setiap field default w-full, di lg+ pakai min-w eksplisit */}
</div>
```

### 5.5 Action button row

Tombol di header: `flex flex-wrap gap-2`. Di mobile, kasih `flex-1 sm:flex-none`
agar tombol mengisi penuh:
```tsx
<div className="flex flex-wrap gap-2">
  <Button className="flex-1 sm:flex-none">Aksi</Button>
</div>
```

### 5.6 Form

- Field ganda: `grid grid-cols-1 sm:grid-cols-2 gap-4`
- Form dengan sidebar tips: `grid gap-6 lg:grid-cols-[1fr_300px]`
- Form panjang dengan width terbatas: `w-full max-w-sm sm:max-w-md`

### 5.7 Dialog

Default shadcn Dialog sudah `w-[calc(100%-2rem)]`. Pakai `sm:max-w-[440px]`
(atau ukuran sesuai konten) untuk batas atas.

### 5.8 Sheet (mobile drawer)

Pakai `w-72 max-w-[85vw] sm:max-w-sm` — pastikan tidak melebihi 85% viewport
agar overlay tetap terlihat.

## 6. Verifikasi

- `tsc --noEmit` lulus tanpa error.
- Tidak ada perubahan logic / API — murni styling Tailwind class.
- Setiap perubahan komponen shared (DataTable, Pagination, Sidebar) berpengaruh
  ke seluruh halaman yang memakainya.

## 7. Apa yang TIDAK dikerjakan (out of scope)

- Visual redesign / theming — hanya fix responsivitas struktural.
- Card-list alternatif untuk tabel di mobile — strategi sekarang adalah
  horizontal scroll (lebih hemat effort, semua data tetap terlihat). Jika
  nanti ingin card-list, tambah di shared `DataTable` dengan flag prop.
- A11y audit lengkap — sudah ada beberapa improvement (aria-label di pagination,
  breadcrumb separator aria-hidden), tapi tidak menyeluruh.

## 8. Daftar file yang dimodifikasi

```
src/components/shared/data-table.tsx
src/components/shared/data-table-pagination.tsx
src/components/layout/sidebar.tsx
src/app/(dashboard)/attendance/_components/attendance-history.tsx
src/app/(dashboard)/attendance-admin/_components/attendance-summary-table.tsx
src/app/(dashboard)/attendance-admin/[employeeId]/page.tsx
src/app/(dashboard)/leave/_components/leave-history-table.tsx
src/app/(dashboard)/leave/manage/_components/leave-approval-table.tsx
src/app/(dashboard)/leave/report/page.tsx
src/app/(dashboard)/employees/[id]/_components/documents-tab.tsx
src/app/(dashboard)/audit-log/_components/audit-log-filters.tsx
src/app/(dashboard)/dashboard/_components/super-admin-dashboard.tsx
src/app/(dashboard)/dashboard/_components/hr-admin-dashboard.tsx
src/app/(dashboard)/dashboard/_components/manager-dashboard.tsx
src/app/(dashboard)/dashboard/_components/employee-dashboard.tsx
src/app/(dashboard)/recruitment/candidates/[candidateId]/page.tsx
src/app/(dashboard)/recruitment/candidates/[candidateId]/_components/candidate-detail-client.tsx
```

Total: **17 file** dimodifikasi.
