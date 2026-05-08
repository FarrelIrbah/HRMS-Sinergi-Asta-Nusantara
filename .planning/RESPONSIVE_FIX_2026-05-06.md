# Perbaikan Responsivitas HRMS PT. SAN — 2026-05-06

Lanjutan dari `RESPONSIVE_AUDIT_2026-05-03.md`. Audit pertama sudah membenahi
banyak komponen tabel & filter, tapi user lapor balik (2026-05-06) bahwa
hampir semua halaman dashboard masih memunculkan **horizontal overflow di
mobile** — konten meleset keluar viewport, hamburger/breadcrumb tampak miring,
dan pengguna bisa scroll ke samping.

## 1. Root Cause

Akar masalahnya bukan di komponen anak — melainkan **pola "full-bleed
background" yang dipakai di 23 file**:

```tsx
<div className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6">
```

Tujuan asli pola ini: membuat background `bg-slate-50` membentang penuh di
bawah `<main>` yang punya padding (`p-4 md:p-6`), dengan negative margin
`-m-4` untuk "menembus" padding parent.

### Kenapa pola ini bermasalah di mobile

1. **Negative margin + flex parent rentan overflow.** Layout dashboard punya
   struktur `<div class="flex h-screen overflow-hidden">` → flex child
   `<div class="flex flex-1 flex-col md:pl-64">` → `<main>`. Flex item
   default punya `min-width: auto` (bukan 0), artinya child tidak akan
   shrink di bawah intrinsic content width-nya. Saat ada konten yang
   sedikit lebih lebar (misal tabel `min-w-[760px]` di scroll container,
   atau tombol dengan teks panjang), child flex bisa "menahan" lebar dan
   memicu overflow horizontal yang menjalar ke `<main>`.

2. **`<main>` cuma punya `overflow-y-auto`**, tidak ada constraint sumbu-X.
   Jadi kalau konten anak overflow horizontal, `<main>` ikut scroll sumbu-X.

3. **Kombinasi `-m-4 + p-4`** di banyak browser (terutama Chromium mobile)
   ternyata bisa menyebabkan child div secara visual sedikit melebar dari
   parent content area karena rounding/sub-pixel + perilaku `box-sizing`
   yang berbeda saat ada negative margin di flex descendant. Hasilnya:
   konten meleset keluar viewport.

## 2. Solusi

Bukan tambal-sulam per halaman — **refactor layout supaya pola full-bleed
tidak lagi diperlukan**:

### 2.1 Layout dashboard (`src/app/(dashboard)/layout.tsx`)

```diff
- <div className="flex flex-1 flex-col md:pl-64">
+ <div className="flex min-w-0 flex-1 flex-col md:pl-64">
    <Header />
    <Breadcrumbs />
-   <main className="flex-1 overflow-y-auto p-4 md:p-6">
+   <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 md:p-6">
      {children}
    </main>
  </div>
```

Tiga perubahan kritis:

| Perubahan | Tujuan |
|-----------|--------|
| `min-w-0` di flex column | Reset default `min-width: auto` pada flex item — **inilah fix utama untuk overflow horizontal di flex container.** |
| `overflow-x-hidden` di `<main>` | Defensif: kalau ada element anak nakal yang masih overflow, di-clip di sini, tidak menjalar ke body. |
| `bg-slate-50` di `<main>` | Pindahkan warna background ke layout supaya halaman anak tidak butuh trik negative-margin. |

### 2.2 Halaman anak (28 occurrence di 23 file)

Pola lama:

```tsx
<div className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6">
```

Pola baru:

```tsx
<div className="space-y-6">
```

Dilakukan via search-and-replace global. File-file yang dimodifikasi:

```
src/app/(dashboard)/attendance/page.tsx (2)
src/app/(dashboard)/attendance-admin/page.tsx
src/app/(dashboard)/attendance-admin/[employeeId]/page.tsx
src/app/(dashboard)/audit-log/page.tsx
src/app/(dashboard)/audit-log/[id]/page.tsx
src/app/(dashboard)/dashboard/_components/employee-dashboard.tsx (2)
src/app/(dashboard)/dashboard/_components/hr-admin-dashboard.tsx
src/app/(dashboard)/dashboard/_components/manager-dashboard.tsx
src/app/(dashboard)/dashboard/_components/super-admin-dashboard.tsx
src/app/(dashboard)/employees/page.tsx
src/app/(dashboard)/employees/new/page.tsx
src/app/(dashboard)/employees/[id]/page.tsx
src/app/(dashboard)/leave/page.tsx (2)
src/app/(dashboard)/leave/manage/page.tsx
src/app/(dashboard)/leave/report/page.tsx
src/app/(dashboard)/master-data/page.tsx
src/app/(dashboard)/payroll/page.tsx
src/app/(dashboard)/payroll/[periodId]/page.tsx
src/app/(dashboard)/payslip/page.tsx (3)
src/app/(dashboard)/recruitment/page.tsx
src/app/(dashboard)/recruitment/new/page.tsx
src/app/(dashboard)/recruitment/[vacancyId]/page.tsx
src/app/(dashboard)/users/page.tsx
```

Total: **24 file (1 layout + 23 halaman), 28 substitusi className**.

## 3. Mengapa fix ini menyembuhkan semua keluhan user sekaligus

User melaporkan masalah identik di 11 halaman berbeda
(Karyawan, Absensi, Admin Absensi, Cuti, Kelola Cuti, Laporan Cuti,
Penggajian, Slip Gaji, Pengguna, Data Master, Log Audit). Pola gejala
sama → akar penyebab tunggal.

Audit pertama (2026-05-03) fokus ke komponen-komponen anak (tabel, filter,
sidebar). Itu memang membantu, tapi **gejala utama** (konten meleset keluar
viewport) tidak hilang karena akarnya ada di **layout tingkat atas**.

Setelah `min-w-0` ditambahkan dan negative margin dihapus:
- Flex children sekarang bisa shrink di bawah intrinsic content width.
- Tabel dengan `min-w-[760px]` tetap horizontal-scroll **di dalam container
  Card masing-masing** (tidak menjalar ke main).
- Header & deskripsi akan wrap normal sesuai viewport.
- Background `bg-slate-50` tetap full-bleed karena sekarang ada di `<main>`.

## 4. Verifikasi

- `tsc --noEmit` lulus (0 error).
- Tidak ada perubahan logic, API, atau struktur komponen — murni styling
  Tailwind class.

## 5. Yang TIDAK berubah

- Komponen Card, Sidebar, Header, Breadcrumb, DataTable, Form — semua tetap
  apa adanya.
- Audit hari sebelumnya (`min-w-` di tabel, breakpoint dashboard, mobile
  sidebar) tetap berlaku dan tetap berguna.
- Login page, layout autentikasi — tidak tersentuh (tidak punya pola yang
  bermasalah).

## 6. Aturan untuk maintainer

**Jangan pakai pola `-m-{n} + p-{n}` lagi** untuk efek full-bleed.
Letakkan warna background di parent yang memang sudah full-width
(`<main>`, layout container, dll).

**Setiap kali bikin flex column dengan child yang berisi konten dinamis
(tabel, kartu, dll), tambahkan `min-w-0`** di flex child untuk mencegah
overflow horizontal.

```tsx
// ✅ Benar
<div className="flex">
  <Sidebar />
  <div className="flex min-w-0 flex-1 flex-col">
    <main>{children}</main>
  </div>
</div>

// ❌ Salah — flex child default min-width: auto akan menahan lebar
<div className="flex">
  <Sidebar />
  <div className="flex flex-1 flex-col">
    <main>{children}</main>
  </div>
</div>
```
