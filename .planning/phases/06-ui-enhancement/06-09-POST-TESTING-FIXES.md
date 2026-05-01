# 06-09 — Post-Testing Fixes (Round 1)

**Status:** ✅ Selesai (2026-05-02)
**Tipe:** Hotfix UI/UX dari hasil testing manual

---

## Konteks

Setelah ronde testing manual oleh user pada 2026-05-02, ditemukan 4 issue yang perlu
diperbaiki. Fokus utama: konsistensi tema design (emerald-themed) di seluruh dialog,
UX filter yang sebelumnya butuh hard-refresh, dan masalah truncation pada
`SummaryTile` ketika value berupa string panjang.

---

## Issue & Fix

### 1. Dialog "Tambah Kandidat" pakai design lama

**File:** `src/app/(dashboard)/recruitment/[vacancyId]/_components/add-candidate-dialog.tsx`

**Sebelum:**
- Header dialog plain (hanya `DialogTitle`, tanpa icon badge / description).
- Tombol "Tambah" pakai default Button (slate hitam) → tidak match emerald theme.
- Input field tanpa border slate-200 + bg-white khas project.
- Trigger button "Tambah Kandidat" tanpa explicit emerald class.

**Sesudah:**
- Header dialog mengikuti pola `master-data/_components/department-form-dialog.tsx`:
  emerald icon badge (`UserPlus`) + title + description.
- Field email & phone dapat icon-prefix (`Mail`, `Phone`) untuk affordance.
- Field opsional ditandai dengan label "(opsional)" warna slate-400.
- Tombol submit "Tambah Kandidat" + `Save` icon, kelas
  `bg-emerald-600 hover:bg-emerald-700`.
- Spinner `Loader2` saat pending.
- Trigger button juga dipaksa emerald primary supaya match header lain.

### 2. Dialog "Input / Koreksi Data Absensi" pakai design lama

**File:** `src/app/(dashboard)/attendance-admin/_components/manual-record-dialog.tsx`

**Sebelum:**
- Header tanpa icon badge / description.
- Tombol "Simpan" default (slate hitam).
- Trigger button hanya `outline + sm` di mana-mana — tidak ada perbedaan
  visual antara header (primary action) dan inline-row (secondary action).
- Calendar tidak disable future dates → user bisa salah input absensi
  ke masa depan.

**Sesudah:**
- Header dialog dengan icon badge `ClipboardEdit` emerald + description yang
  menjelaskan setiap perubahan tercatat di audit log.
- Trigger menerima prop `compact?: boolean`:
  - `false` (default) → primary emerald button → dipakai di page header.
  - `true` → ghost button kecil + hover emerald → dipakai di per-row table.
- `attendance-summary-table.tsx` sekarang pass `compact` saat render dialog di row.
- Field karyawan + tanggal dapat icon prefix (`User`, `CalendarIcon`).
- Calendar di-disable untuk tanggal di masa depan (`date > new Date()`).
- Tombol "Simpan" emerald primary + `Save` icon + `Loader2` spinner.
- Saat dialog success, form di-reset dengan `defaultEmployeeId` jika ada (sebelumnya
  reset blank → bug minor saat dialog dibuka lagi dari row context).

### 3. Filter Admin Absensi butuh hard-refresh

**File:** `src/app/(dashboard)/attendance-admin/_components/attendance-filters.tsx`

**Root cause:**
`useQueryState` dari `nuqs` secara default berjalan dalam mode `shallow: true`
yang hanya update URL bar tanpa trigger Next.js Server Component re-render.
Page (`attendance-admin/page.tsx`) adalah Server Component yang baca
`searchParams` untuk fetch data, jadi tanpa server re-render datanya tetap stale.

**Decision: auto-refresh, bukan tombol "Terapkan".**
Pilihan ini diambil karena:
- Filter month/year hanya 2 select, dampak query ringan, tidak perlu batching.
- UX lebih cepat & flawless — user tidak perlu klik tambahan.
- React `useTransition` dipakai supaya UI tidak freeze saat refetch.

**Fix:**
```ts
const [isPending, startTransition] = useTransition();

const [month, setMonth] = useQueryState("month", {
  defaultValue: String(new Date().getMonth() + 1),
  shallow: false,        // trigger RSC refetch
  startTransition,       // non-blocking + expose pending flag
});
```

Bonus polish:
- `CalendarRange` icon di-swap menjadi `Loader2` spinner saat `isPending`.
- Select di-disable saat pending → cegah double-click.
- `aria-busy` + `aria-live="polite"` untuk screen reader.

### 4. Card "Hari Ini" terpotong ("Belum Ab...")

**File:** `src/components/shared/summary-tile.tsx`

**Root cause:**
Class Tailwind `truncate` = `overflow-hidden text-ellipsis whitespace-nowrap`.
Untuk value berupa string panjang multi-kata seperti `"Belum Absen"` atau
`"Sedang Kerja"`, `whitespace-nowrap` mencegah wrap → ellipsis dipasang di
tengah-kata. Pada layout `grid-cols-5` (header dashboard) lebar card jadi
sempit dan teks ke-clip.

**Diagnosis: page lain dengan issue serupa?**
Audit semua usage `SummaryTile`:
- `attendance/page.tsx` (employee dashboard) — "Hari Ini": "Belum Absen", "Sedang Kerja", "Selesai" → **terdampak**
- `attendance-admin/page.tsx` — "Pernah Terlambat": `"${n} (${m}x)"` → potensi clip pada n besar
- Sisanya (audit-log, dashboards, master-data, users) — value numerik atau string ≤ 4 char → aman

Karena `SummaryTile` adalah komponen shared, perbaikan dilakukan di sumber
sehingga semua page otomatis benefit (universal fix).

**Fix:**
```tsx
className={cn(
  "font-bold tabular-nums leading-[1.15] tracking-tight text-slate-900",
  typeof value === "number"
    ? "truncate text-2xl"                                   // angka: tetap 1 baris
    : (value as string).length > 8
      ? "line-clamp-2 [overflow-wrap:anywhere] text-xl"     // string panjang: 2 baris + scale-down
      : "line-clamp-2 [overflow-wrap:anywhere] text-2xl"    // string pendek: 2 baris, ukuran asli
)}
```

Strategi:
- **Tidak menurunkan font** untuk string pendek (≤ 8 char) — masih `text-2xl`.
- **Menurunkan ke `text-xl`** hanya untuk string panjang seperti
  `"Belum Absen"` (11 char) supaya tidak pecah ke 3 baris.
- **`line-clamp-2`** memberikan safety net: kalau pun overflow, ada ellipsis
  multi-baris, bukan terpotong di tengah.
- **`[overflow-wrap:anywhere]`** mencegah single long word break layout.
- **`leading-[1.15]`** memberi sedikit napas saat 2 baris.
- Number tetap pakai `truncate` lama supaya digit besar tidak wrap awkward.

---

## Files Changed

| File | Tipe perubahan |
|---|---|
| `src/components/shared/summary-tile.tsx` | Class value: branching by type, line-clamp-2 |
| `src/app/(dashboard)/attendance-admin/_components/attendance-filters.tsx` | `shallow: false` + `useTransition` + pending UI |
| `src/app/(dashboard)/attendance-admin/_components/manual-record-dialog.tsx` | Full redesign + `compact` prop |
| `src/app/(dashboard)/attendance-admin/_components/attendance-summary-table.tsx` | Pass `compact` di row context |
| `src/app/(dashboard)/recruitment/[vacancyId]/_components/add-candidate-dialog.tsx` | Full redesign |

## Verifikasi

- ✅ `tsc --noEmit` lolos.
- ⏸ Manual UI test pending dari user (re-test 4 skenario di atas).

## Skill yang Dipakai

`/frontend-design`, `/ui-ux-pro-max`, `/shadcn-ui`, `/web-accessibility`,
`/web-design-guidelines` — diterapkan via konsistensi pola
`master-data/*-form-dialog.tsx` yang sudah lebih dulu mengikuti panduan tersebut.
