# Testing Flow — Paket A Cleanup

Dokumen ini panduan langkah demi langkah untuk memverifikasi 4 fitur yang diimplementasi/dibetulkan dalam Paket A:

- **#6** — Auto-fill form karyawan baru saat convert candidate
- **#7** — Audit log untuk Payroll (import + finalize)
- **#8** — Audit log untuk update offer / create interview / cancel leave
- **#9** — Validasi delete master data (Position / Office Location / Leave Type)

---

## 0. Setup

### 0.1 Jalankan Dev Server

```powershell
npm run dev
```

Buka `http://localhost:3000` di browser.

### 0.2 Akun Login (semua password sama)

| Role | Email | Password |
|---|---|---|
| SUPER_ADMIN | `admin@ptsan.co.id` | `Admin123!` |
| HR_ADMIN | `dewi.hr@ptsan.co.id` | `Admin123!` |
| MANAGER | `budi.mgr@ptsan.co.id` | `Admin123!` |
| EMPLOYEE | `rina@ptsan.co.id` | `Admin123!` |
| Tambahan karyawan (5 orang) | `ahmad.p@ptsan.co.id`, `siti.n@ptsan.co.id`, `doni.s@ptsan.co.id`, `maya.r@ptsan.co.id`, `hendro.w@ptsan.co.id` | `Karyawan123!` |

### 0.3 Cek Data Sudah Ter-seed

Setelah `npm run dev` jalan, login sebagai SUPER_ADMIN dan cek:

| Halaman | Yang harus ada |
|---|---|
| `/dashboard` | Stat cards terisi (10 users, 8 employees, dst.) |
| `/employees` | 8 karyawan |
| `/attendance-admin` | 133 record absensi |
| `/leave/manage` | 14 pengajuan cuti |
| `/payroll` | 2 payroll runs (1 FINALIZED + 1 DRAFT) |
| `/recruitment` | 2 lowongan |
| `/recruitment/<vacancy>` | kandidat tersebar di 5 stage kanban |
| `/audit-log` | 36 entri historical |
| `/master-data` | 3 dept, 5 position, 2 location, 4 leave type |

Kalau ada yang kosong, jalankan ulang seed:

```powershell
npx prisma migrate reset --force
npx tsx prisma/seed-extras.ts
```

---

## #6 — Auto-fill Form Karyawan dari Convert Candidate

**Tujuan**: Verifikasi bahwa setelah HR klik "Convert to Employee" pada kandidat stage `DITERIMA`, form karyawan baru terisi otomatis dengan data candidate.

### Langkah

1. Login sebagai **HR_ADMIN** (`dewi.hr@ptsan.co.id` / `Admin123!`).
2. Buka `/recruitment` → klik lowongan **HR Specialist**.
3. Di kolom **DITERIMA**, klik kandidat **Dedi Kurniawan**.
4. Halaman detail kandidat terbuka. Scroll ke bawah, cari tombol **"Convert to Employee"** (atau sejenisnya).
5. Klik tombol tersebut.

### Hasil yang diharapkan ✅

- Browser redirect ke URL: `/employees/new?fullName=Dedi%20Kurniawan&email=dedi%40example.com&phone=&departmentId=<id>&candidateId=<id>`
- Form **/employees/new** terbuka dengan field-field sudah ter-prefill:
  - **Nama Lengkap**: Dedi Kurniawan
  - **Email**: dedi@example.com
  - **Departemen**: (sesuai dengan vacancy → SDM, atau tergantung dept HR Specialist)
  - **Nomor HP**: (kosong, karena candidate tidak punya phone)
- Field lain (password, jabatan, tipe kontrak, tanggal masuk, dll.) **tetap kosong** — HR perlu lengkapi manual.

### Hasil yang menandakan masalah ❌

- Form terbuka **kosong total** (Nama Lengkap, Email tidak terisi).
- Kalau ini terjadi, kemungkinan `useSearchParams` belum ke-import atau `defaultValues` tidak baca dari prefill.

### Langkah lanjutan (sekaligus uji audit log #8 untuk createInterview)

6. Sebelum convert, cek bahwa kandidat punya jejak interview:
   - Buka detail kandidat → harus ada minimum 2 interview log dari seed.

---

## #7 — Audit Log untuk Payroll Import + Finalize

**Tujuan**: Verifikasi bahwa setiap kali HR import file payroll dan/atau finalize, ada entri di tabel `audit_logs`.

### Pre-condition

Pastikan ada akses ke halaman audit log. Login sebagai **SUPER_ADMIN** (`admin@ptsan.co.id` / `Admin123!`).

### Test #7a: Audit log saat Import Payroll

#### Langkah

1. Login sebagai **HR_ADMIN** (`dewi.hr@ptsan.co.id` / `Admin123!`).
2. Buka `/payroll`.
3. Klik **"Download Template"** untuk dapatkan file Excel kosong.
4. Buka file Excel di Excel/LibreOffice, isi 1-2 baris dummy:
   - **NIK**: `EMP-2026-0001` (Dewi Lestari) atau NIK lain dari list karyawan
   - **Nama Karyawan**: Dewi Lestari
   - **Job Position**: Staff SDM
   - **Organization**: SDM
   - **Grade / Level**: Tetap
   - **PTKP**: K/1
   - **NPWP**: kosongin saja
   - **Basic Salary**: 8500000
   - kolom angka lain isi 0 atau angka kecil
   - **Actual Working Day**: 22, **Schedule Working Day**: 22
   - **Attendance Codes**: H:22d
5. Save Excel sebagai `.xlsx`.
6. Di `/payroll`, pilih bulan dan tahun yang **belum ada** payroll run-nya (misal: pilih bulan 6/2026 atau bulan masa depan).
7. Upload file Excel.
8. Kalau berhasil, halaman redirect ke `/payroll/<periodId>` dengan tabel preview.

#### Verifikasi audit log

9. Logout, login sebagai **SUPER_ADMIN**.
10. Buka `/audit-log`.
11. Filter: **Modul** = `Payroll`, **Action** = `CREATE`.
12. ✅ Harus ada entri baru dengan:
    - **Modul**: Payroll
    - **Action**: CREATE
    - **User**: Dewi Lestari (HR_ADMIN yang import)
    - **newValue**: `{ month: 6, year: 2026, entryCount: 1, status: "DRAFT" }`
13. Klik entri tersebut → halaman detail menunjukkan diff JSON.

### Test #7b: Audit log saat Finalize Payroll

#### Langkah

1. Login lagi sebagai **HR_ADMIN**.
2. Buka payroll run yang baru di-import (yang masih DRAFT).
3. Klik tombol **"Finalize"** → konfirmasi di dialog.
4. Status berubah jadi `FINALIZED`.

#### Verifikasi audit log

5. Sebagai SUPER_ADMIN, buka `/audit-log`.
6. Filter: **Modul** = `Payroll`, **Action** = `UPDATE`.
7. ✅ Harus ada entri baru dengan:
    - **Modul**: Payroll
    - **Action**: UPDATE
    - **oldValue**: `{ status: "DRAFT" }`
    - **newValue**: `{ status: "FINALIZED" }`

### Hasil yang menandakan masalah ❌

- Setelah import/finalize, **tidak ada** entri baru di `/audit-log` dengan modul `Payroll`.
- Kalau ini terjadi, cek apakah `createAuditLog` di-import dan dipanggil di `payroll.actions.ts`.

---

## #8 — Audit Log untuk updateOffer / createInterview / cancelLeave

**Tujuan**: Verifikasi 3 action yang sebelumnya tidak audit sekarang sudah audit.

### Test #8a: Update Offer Salary Kandidat

#### Langkah

1. Login sebagai **HR_ADMIN**.
2. Buka `/recruitment` → klik lowongan **Frontend Developer**.
3. Klik kandidat **Andi Wijaya** (yang sudah di stage PENAWARAN).
4. Cari section **Offer** atau **Penawaran**.
5. Edit `offerSalary` dari `8000000` jadi `9000000`. Tambahkan note.
6. Save.

#### Verifikasi

7. Sebagai SUPER_ADMIN → `/audit-log`.
8. Filter: **Modul** = `Kandidat`, **Action** = `UPDATE`.
9. ✅ Cari entri terbaru dengan `newValue: { offerSalary: 9000000, offerNotes: "..." }`.

### Test #8b: Create Interview

#### Langkah

1. Login sebagai **HR_ADMIN**.
2. Buka detail kandidat (misal **Sari Dewi** yang stage INTERVIEW).
3. Cari section **"Jadwalkan Wawancara"** atau **"Tambah Interview"**.
4. Isi:
   - **Tanggal & Jam**: pilih waktu di masa depan (misal: besok 10:00)
   - **Nama Interviewer**: "Pak Andi"
   - **Catatan**: "Technical interview round 2"
5. Submit.

#### Verifikasi

6. Sebagai SUPER_ADMIN → `/audit-log`.
7. Filter: **Modul** = `Wawancara`, **Action** = `CREATE`.
8. ✅ Cari entri dengan `newValue: { candidateId: "...", scheduledAt: "...", interviewerName: "Pak Andi" }`.

### Test #8c: Cancel Leave Request

#### Langkah

1. Login sebagai **EMPLOYEE** Rina (`rina@ptsan.co.id` / `Admin123!`).
2. Buka `/leave`.
3. Buat pengajuan cuti baru:
   - **Jenis Cuti**: Cuti Tahunan (atau yang ada saldo)
   - **Tanggal Mulai**: misal 3 hari dari sekarang
   - **Tanggal Akhir**: 3 hari dari sekarang (1 hari saja)
   - **Alasan**: "Test untuk cancel"
4. Submit. Pengajuan masuk ke history dengan status PENDING.
5. Di tabel history, klik tombol **"Batal"** atau **"Cancel"** pada pengajuan yang baru saja dibuat.
6. Konfirmasi cancel.

#### Verifikasi

7. Logout, login sebagai SUPER_ADMIN → `/audit-log`.
8. Filter: **Modul** = `Permintaan Cuti`, **Action** = `UPDATE`.
9. ✅ Cari entri terbaru dengan `newValue: { status: "CANCELLED" }`.

### Hasil yang menandakan masalah ❌

- Salah satu (atau semua) dari 3 test di atas tidak menghasilkan audit log entri.
- Solusi: cek `recruitment.actions.ts` (`updateOfferAction`, `createInterviewAction`) dan `leave.actions.ts` (`cancelLeaveAction`) — pastikan semua memanggil `createAuditLog` setelah operasi DB.

---

## #9 — Validasi Delete Master Data

**Tujuan**: Verifikasi bahwa Position / Office Location / Leave Type tidak bisa dihapus kalau masih dipakai karyawan / pengajuan cuti aktif.

Login sebagai **SUPER_ADMIN** (`admin@ptsan.co.id` / `Admin123!`). Master Data CRUD hanya bisa diakses Super Admin.

### Test #9a: Delete Position yang Masih Dipakai

#### Langkah

1. Buka `/master-data`.
2. Klik tab **Jabatan**.
3. Cari jabatan yang sudah pasti ada karyawannya — misal **Staff SDM** (Dewi Lestari pakai), **Kepala Penagihan** (Budi Santoso pakai), atau **Staff Keuangan** (Rina Wulandari pakai).
4. Klik tombol **Delete** / **Hapus** pada jabatan tersebut.
5. Konfirmasi delete.

#### Hasil yang diharapkan ✅

- Toast/dialog error muncul: **"Jabatan masih dipakai N karyawan aktif, tidak dapat dihapus"** (N = jumlah karyawan di jabatan itu, biasanya 1-2 untuk seed).
- Jabatan **TIDAK** terhapus dari list (masih kelihatan di tabel).

#### Hasil yang menandakan masalah ❌

- Jabatan menghilang dari list tanpa error → validasi tidak jalan.
- Jika begini, cek `master-data.service.ts` `deletePosition` — pastikan ada `_count.employees > 0` check.

### Test #9b: Delete Position yang Tidak Dipakai (Happy Path)

#### Langkah

1. Di tab **Jabatan**, klik **"Tambah Jabatan"** → buat jabatan baru "Test Position" di departemen mana saja.
2. Save.
3. Sekarang klik Delete pada "Test Position" yang baru saja dibuat (belum dipakai siapa-siapa).
4. Konfirmasi.

#### Hasil yang diharapkan ✅

- "Test Position" berhasil dihapus (soft-delete) → menghilang dari list.
- Audit log: ada entri DELETE module=Jabatan untuk position ini.

### Test #9c: Delete Office Location yang Masih Dipakai

#### Langkah

1. Di tab **Lokasi Kantor**, harus ada 2 lokasi seeded (`Kantor Pusat`, `Kantor Cabang Bandung` — tergantung seed).
2. Cek apakah karyawan ada yang assigned ke lokasi tersebut. Untuk memastikan, dari seed: `officeLocationAssigned to 7 employees`. Jadi default location dipakai 7 orang.
3. Klik Delete pada lokasi yang dipakai.

#### Hasil yang diharapkan ✅

- Error: **"Lokasi kantor masih dipakai N karyawan aktif, tidak dapat dihapus"** (N = jumlah karyawan).
- Lokasi tidak terhapus.

### Test #9d: Delete Leave Type yang Masih Dipakai

#### Langkah

1. Di tab **Jenis Cuti**, ada 4 jenis seeded.
2. Cek dulu pengajuan cuti aktif (`/leave/manage`): ada beberapa request dengan status PENDING_MANAGER, PENDING_HR, atau APPROVED.
3. Identifikasi `leaveTypeId` yang dipakai pengajuan aktif (paling mudah lewat seed: `Cuti Tahunan` paling sering dipakai).
4. Coba delete `Cuti Tahunan` di tab Jenis Cuti.

#### Hasil yang diharapkan ✅

- Error: **"Jenis cuti masih terkait N pengajuan aktif, tidak dapat dihapus"** (N = jumlah leave request dengan status non-final).
- Jenis cuti tidak terhapus.

### Test #9e: Delete Department yang Masih Punya Position (regresi-test)

Validasi `deleteDepartment` sudah ada sebelum Paket A. Tetap test untuk pastikan tidak ter-break.

#### Langkah

1. Tab **Departemen**, klik Delete pada **Penagihan** (yang punya position "Kepala Penagihan").
2. Konfirmasi.

#### Hasil yang diharapkan ✅

- Error: **"Departemen memiliki jabatan aktif, tidak dapat dihapus"**.

### Hasil yang menandakan masalah ❌

- Salah satu master data berhasil terhapus padahal masih dipakai → validasi tidak jalan.
- Periksa `master-data.service.ts` — pastikan semua 4 delete function (`deleteDepartment`, `deletePosition`, `deleteOfficeLocation`, `deleteLeaveType`) punya `_count` validation.

---

## Bonus: Cek Audit Log Setelah Semua Test

Setelah semua test #6, #7, #8, #9 selesai, login sebagai SUPER_ADMIN → `/audit-log`. Anda harus melihat:

- ~36 entri historical (dari seed)
- Plus entri-entri baru hasil testing:
  - Payroll CREATE (dari #7a)
  - Payroll UPDATE (dari #7b)
  - Kandidat UPDATE (dari #8a)
  - Wawancara CREATE (dari #8b)
  - Permintaan Cuti CREATE + UPDATE (dari #8c)
  - Karyawan CREATE (kalau Anda completing convert candidate flow)
  - Jabatan DELETE (dari #9b "Test Position")

Filter dengan dropdown Module dan Action untuk verifikasi cepat.

---

## Catatan Tambahan

### Re-seed kalau data rusak

```powershell
# 1. Reset DB + run seed utama (data karyawan, attendance, leave, recruitment dasar)
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="reset" npx prisma migrate reset --force

# 2. Run seed extras (payroll + audit log + interviews)
npx tsx prisma/seed-extras.ts
```

### Cek audit log via DB langsung (debugging)

Kalau audit log di UI tidak muncul tapi Anda yakin operasi sudah jalan, cek langsung:

```powershell
npx tsx -e "
import { PrismaClient } from './src/generated/prisma/client';
const p = new PrismaClient();
p.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }).then(rows => {
  console.log(rows);
  return p.\$disconnect();
});
"
```

### Memberi feedback kalau ada test yang gagal

Kalau salah satu test menghasilkan ❌:
1. Catat persis langkah mana yang gagal.
2. Cek di console browser (F12) untuk error JavaScript.
3. Cek di terminal `npm run dev` untuk error server-side.
4. Cek file source yang relevan:
   - #6 → `src/app/(dashboard)/employees/new/_components/create-employee-form.tsx`
   - #7 → `src/lib/actions/payroll.actions.ts`
   - #8 → `src/lib/actions/recruitment.actions.ts`, `src/lib/actions/leave.actions.ts`
   - #9 → `src/lib/services/master-data.service.ts`
