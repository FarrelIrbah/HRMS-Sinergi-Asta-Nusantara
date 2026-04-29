# Phase 4 Pivot — Payroll: dari Auto-Calculation ke Excel Import

**Tanggal pivot:** 2026-04-29
**Status sebelum pivot:** Phase 4 complete & human-approved (2026-03-08)
**Pemilik keputusan:** Pengembang (mahasiswa)
**Motivasi:** Persiapan sidang skripsi — penulis tidak ingin dibedah pertanyaan teknis tentang regulasi PPh 21, BPJS Kesehatan, BPJS Ketenagakerjaan secara detail. Dengan menggeser kalkulasi ke spreadsheet eksternal milik pegawai PT SAN, lingkup tanggung jawab sistem (dan lingkup pertanyaan sidang) menjadi: ingest, validasi, persistensi, dan distribusi payslip — bukan kebenaran tarif.

---

## 1. Tujuan baru Phase 4

Sistem Penggajian **tidak lagi menghitung** komponen gaji apa pun. Sistem hanya:
1. Menyediakan **template Excel** dengan kolom standar (mengikuti format payslip Talenta).
2. Menerima **upload Excel/CSV** hasil perhitungan HR di luar sistem.
3. **Memvalidasi** struktur file dan memetakan baris ke karyawan aktif berdasarkan NIK.
4. Menyimpan hasil import sebagai `PayrollRun` berstatus `DRAFT` agar HR dapat **review** sebelum finalisasi.
5. Setelah finalisasi, karyawan dapat **mengunduh payslip PDF** dengan format Talenta-style.

## 2. Lingkup yang DIHAPUS

| File | Alasan |
|------|--------|
| `src/lib/services/bpjs.service.ts` | Semua kalkulasi BPJS dilakukan eksternal di Excel HR. |
| `src/lib/services/pph21.service.ts` | Semua kalkulasi PPh 21 (TER, annualization, biaya jabatan) dilakukan eksternal. |
| `src/lib/services/thr.service.ts` | THR dimasukkan sebagai baris di Excel jika ada. |
| `runPayroll()` di `payroll.service.ts` | Diganti `importPayrollFromExcel()`. |
| `runPayrollAction`, `addTHRToPayrollAction`, `updateEmployeeSalaryAction` | Diganti `importPayrollAction`. Salary management tidak relevan karena gaji dihitung eksternal. |
| `RunPayrollForm` | Diganti `ImportPayrollForm`. |
| Halaman `/payroll/thr/*` + komponennya | Tidak ada konsep "kalkulasi THR" — THR tinggal kolom di Excel. |
| Tab "Gaji & Tunjangan" di profil karyawan | Tidak ada lagi `baseSalary` & `EmployeeAllowance` (dihapus dari UI; field tetap di DB sementara untuk backward compatibility). |
| `decimal.js` math di service | Cukup `Number` karena tidak ada arithmetic chain. |

## 3. Lingkup yang DITAMBAH / DIUBAH

### 3.1 Schema (Prisma)

**`PayrollEntry` di-refactor besar.** Kolom typed BPJS lama dihapus, diganti kolom yang persis mengikuti format Talenta payslip.

```prisma
model PayrollEntry {
  id           String   @id @default(cuid())
  payrollRunId String
  employeeId   String

  // Employee snapshot (saat import — tahan terhadap perubahan profil di kemudian hari)
  employeeNik     String
  employeeName    String
  jobPosition     String   // e.g. "Kepala Departemen Business Unit"
  organization    String   // department name, e.g. "Property Management"
  gradeLevel      String   // e.g. "- / Manager"
  ptkpStatus      String   // e.g. "TK/0"
  npwp            String?  // optional

  // Earnings (semua Decimal)
  basicSalary           Decimal @db.Decimal(15, 2) @default(0)
  tunjanganKomunikasi   Decimal @db.Decimal(15, 2) @default(0)
  tunjanganKehadiran    Decimal @db.Decimal(15, 2) @default(0)
  tunjanganJabatan      Decimal @db.Decimal(15, 2) @default(0)
  tunjanganLainnya      Decimal @db.Decimal(15, 2) @default(0)
  taxAllowance          Decimal @db.Decimal(15, 2) @default(0)
  totalEarnings         Decimal @db.Decimal(15, 2)

  // Deductions
  bpjsKesehatanEmployee   Decimal @db.Decimal(15, 2) @default(0)
  jhtEmployee             Decimal @db.Decimal(15, 2) @default(0)
  jaminanPensiunEmployee  Decimal @db.Decimal(15, 2) @default(0)
  pph21                   Decimal @db.Decimal(15, 2) @default(0)
  potonganKeterlambatan   Decimal @db.Decimal(15, 2) @default(0)
  potonganKoperasi        Decimal @db.Decimal(15, 2) @default(0)
  potonganLainnya         Decimal @db.Decimal(15, 2) @default(0)
  totalDeductions         Decimal @db.Decimal(15, 2)

  // Take Home Pay
  takeHomePay   Decimal @db.Decimal(15, 2)

  // Benefits (informational — porsi perusahaan, tidak masuk THP)
  jkk                       Decimal @db.Decimal(15, 2) @default(0)
  jkm                       Decimal @db.Decimal(15, 2) @default(0)
  jhtCompany                Decimal @db.Decimal(15, 2) @default(0)
  jaminanPensiunCompany     Decimal @db.Decimal(15, 2) @default(0)
  bpjsKesehatanCompany      Decimal @db.Decimal(15, 2) @default(0)
  totalBenefits             Decimal @db.Decimal(15, 2)

  // Attendance summary
  actualWorkingDay    Int      @default(0)
  scheduleWorkingDay  Int      @default(0)
  dayoff              Int      @default(0)
  nationalHoliday     Int      @default(0)
  companyHoliday      Int      @default(0)
  specialHoliday      Int      @default(0)
  attendanceCodes     String   @default("")  // free text e.g. "H:15d CT:2d A:2d"

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  payrollRun PayrollRun @relation(fields: [payrollRunId], references: [id], onDelete: Cascade)
  employee   Employee   @relation(fields: [employeeId], references: [id])

  @@unique([payrollRunId, employeeId])
  @@index([payrollRunId])
  @@index([employeeId])
  @@map("payroll_entries")
}
```

**`PayrollRun`:** tidak berubah (id, month, year, status DRAFT/FINALIZED, createdBy).

**Strategi migrasi:** drop kolom typed lama (`baseSalary`, `totalAllowances`, `overtimePay`, `absenceDeduction`, `thrAmount`, `grossPay`, `bpjsKesEmp`, `bpjsKesEmpr`, `bpjsJhtEmp`, `bpjsJhtEmpr`, `bpjsJpEmp`, `bpjsJpEmpr`, `bpjsJkk`, `bpjsJkm`, `netPay`) — data Phase 4 lama tidak akan dipertahankan karena ini development phase. Migrasi destruktif via `prisma db push --accept-data-loss` di environment dev.

### 3.2 Kontrak Excel template

**Sheet 1: "Payroll"** (header di baris 1, data dari baris 2)

| # | Kolom | Tipe | Wajib | Catatan |
|---|-------|------|-------|---------|
| 1 | NIK | text | ✓ | Match ke Employee.nik (sistem reject jika NIK tidak ada / non-aktif) |
| 2 | Nama Karyawan | text | ✓ | Untuk verifikasi visual; sistem ambil dari DB |
| 3 | Job Position | text | ✓ | Snapshot — bebas diisi sesuai keinginan HR |
| 4 | Organization | text | ✓ | Snapshot |
| 5 | Grade / Level | text | ✓ | e.g. "- / Manager" |
| 6 | PTKP | text | ✓ | e.g. "TK/0" |
| 7 | NPWP | text | – | Boleh kosong |
| 8 | Basic Salary | number | ✓ | – |
| 9 | Tunjangan Komunikasi | number | – | Default 0 |
| 10 | Tunjangan Kehadiran | number | – | Default 0 |
| 11 | Tunjangan Jabatan | number | – | Default 0 |
| 12 | Tunjangan Lainnya | number | – | Catch-all tunjangan tidak terdaftar |
| 13 | Tax Allowance | number | – | Default 0 |
| 14 | BPJS Kesehatan Employee | number | – | Default 0 |
| 15 | JHT Employee | number | – | Default 0 |
| 16 | Jaminan Pensiun Employee | number | – | Default 0 |
| 17 | PPH 21 | number | – | Default 0 |
| 18 | Potongan Keterlambatan | number | – | Default 0 |
| 19 | Potongan Koperasi | number | – | Default 0 |
| 20 | Potongan Lainnya | number | – | Default 0 |
| 21 | JKK | number | – | Default 0 |
| 22 | JKM | number | – | Default 0 |
| 23 | JHT Company | number | – | Default 0 |
| 24 | Jaminan Pensiun Company | number | – | Default 0 |
| 25 | BPJS Kesehatan Company | number | – | Default 0 |
| 26 | Actual Working Day | int | – | Default 0 |
| 27 | Schedule Working Day | int | – | Default 0 |
| 28 | Dayoff | int | – | Default 0 |
| 29 | National Holiday | int | – | Default 0 |
| 30 | Company Holiday | int | – | Default 0 |
| 31 | Special Holiday | int | – | Default 0 |
| 32 | Attendance Codes | text | – | e.g. "H:15d CT:2d A:2d" |

Total Earnings, Total Deductions, Total Benefits, dan Take Home Pay **tidak diisi user** — sistem yang menghitung sebagai jumlah kolom 8–13, 14–20, 21–25, dan (Total Earnings − Total Deductions).

**Sheet 2: "Petunjuk"** — README singkat: arti kolom, catatan, contoh isi.

### 3.3 File baru

| File | Peran |
|------|-------|
| `src/lib/services/payroll-import.service.ts` | Parse xlsx/csv → array `ParsedPayrollRow` + `ValidationError[]`. |
| `src/lib/validations/payroll.ts` (rewrite) | Schema `importPayrollSchema` + `payrollRowSchema`. |
| `src/lib/actions/payroll.actions.ts` (rewrite) | `importPayrollAction(formData)` + `finalizePayrollAction` (kept). |
| `src/app/api/payroll/template/route.ts` | GET → blob xlsx template + sheet petunjuk. |
| `src/app/(dashboard)/payroll/_components/import-payroll-form.tsx` | Form upload (file input + period picker + dropzone) + validation toast. |
| `src/app/(dashboard)/payroll/[periodId]/_components/payroll-entry-table.tsx` (rewrite) | Tabel pakai kolom Talenta (Total Earnings, Total Deductions, Take Home Pay, plus drill-down link). |
| `src/lib/pdf/payslip-pdf.tsx` (rewrite) | Layout dua kolom Earnings vs Deductions, banner THP, Benefits (kiri-bawah), Attendance Summary (kanan-bawah), banner *CONFIDENTIAL*, disclaimer. |

### 3.4 File yang DIHAPUS

- `src/lib/services/bpjs.service.ts`
- `src/lib/services/pph21.service.ts`
- `src/lib/services/thr.service.ts`
- `src/app/(dashboard)/payroll/_components/run-payroll-form.tsx`
- `src/app/(dashboard)/payroll/thr/page.tsx` + folder `_components/`
- `src/app/api/payroll-report/route.ts` (di-rewrite mengikuti kolom baru)

### 3.5 File yang DIUBAH (non-rewrite)

- `prisma/schema.prisma` — model `PayrollEntry` di-refactor.
- `src/components/layout/sidebar.tsx` — hapus item nav "Hitung THR".
- `src/app/(dashboard)/payroll/page.tsx` — pakai `ImportPayrollForm`.
- `src/app/(dashboard)/payroll/[periodId]/page.tsx` — sesuaikan dengan struktur baru.
- `src/app/api/payroll/payslip/[entryId]/route.ts` — sesuaikan dengan field baru.
- `src/app/(dashboard)/payslip/page.tsx` — minor (hanya tampilan).
- `prisma/seed.ts` — hapus seed gaji & allowance (tidak relevan).

---

## 4. Format payslip baru (Talenta-style)

Mengikuti referensi `Payslip-04-2026.pdf`:

```
┌──────────────────────────────────────────────────────────────────┐
│  *CONFIDENTIAL                                                   │
│  PT. Sinergi Asta Nusantara                          PAYSLIP     │
│                                                                  │
│  Payroll cut off : 01 - 30 Apr 2026   Grade / Level : - / Mgr   │
│  ID / Name       : 8xxx / xxx          PTKP         : TK/0       │
│  Job position    : ...                 NPWP         : xxx        │
│  Organization    : ...                                           │
├─────────────────────────┬────────────────────────────────────────┤
│  Earnings               │  Deductions                            │
│  Basic Salary       xxx │  BPJS Kesehatan Employee     xxx       │
│  Tunjangan Komunikasi   │  JHT Employee                xxx       │
│  Tunjangan Kehadiran    │  Potongan Keterlambatan      xxx       │
│  Tunjangan Jabatan      │  Potongan Koperasi           xxx       │
│  Tunjangan Lainnya      │  Jaminan Pensiun Employee    xxx       │
│  Tax Allowance      xxx │  Potongan Lainnya            xxx       │
│                         │  PPH 21                      xxx       │
│  Total earnings     xxx │  Total deductions            xxx       │
├─────────────────────────┴────────────────────────────────────────┤
│                                       Take Home Pay   Rp xxx     │
├─────────────────────────┬────────────────────────────────────────┤
│  Benefits*              │  Attendance Summary                    │
│  JKK                xxx │  Actual Working Day             31d   │
│  JKM                xxx │  Schedule Working Day           31d   │
│  JHT Company        xxx │  Dayoff                          8d   │
│  Jaminan Pensiun Co xxx │  National Holiday                5d   │
│  BPJS Kes. Company  xxx │  Company Holiday                 0d   │
│  Total benefits     xxx │  Special Holiday                 0d   │
│                         │  Attendance/Time Off  H:15 CT:2 A:2   │
├──────────────────────────────────────────────────────────────────┤
│  *These are the benefits ... not included in your THP.           │
│  COMPUTER GENERATED — NO SIGNATURE REQUIRED                      │
│  KERAHASIAAN: ...                                                │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Strategi sidang

Setelah pivot, narasi yang dapat dipersiapkan:

> "Modul Penggajian dirancang berbasis import. PT SAN sudah punya proses perhitungan internal yang matang (spreadsheet HR). Sistem mengeliminasi kerja ganda — HR cukup upload hasil perhitungan, sistem menyimpan, mereview, dan mendistribusikan slip gaji yang seragam dan terkontrol audit-trail-nya. Pendekatan ini mengikuti pola industri dengan SaaS HRMS lain seperti Talenta."

Pertanyaan tipikal dan jawaban:

| Pertanyaan | Jawaban |
|------------|---------|
| "Kenapa tidak hitung otomatis?" | "Regulasi PPh 21 dan BPJS sering berubah. Logika kalkulasi yang hardcoded berisiko stale. Pendekatan import membuat HR bisa update perhitungan di Excel kapan pun tanpa menunggu deploy." |
| "Apa kontribusi sistem kalau hanya import?" | "Empat hal: (1) sentralisasi audit trail penggajian, (2) distribusi PDF payslip otomatis ke karyawan tanpa email manual, (3) preview & finalize workflow mencegah kesalahan, (4) snapshot data — payslip historical tetap valid meski profil karyawan berubah." |
| "Bagaimana validasi input?" | "Sistem cek (a) NIK harus terdaftar dan aktif, (b) kolom wajib tidak boleh kosong, (c) angka tidak negatif, (d) total kalkulasi konsisten." |
| "Bagaimana keamanan?" | "Upload hanya bisa oleh HR_ADMIN/SUPER_ADMIN. Payslip download otentikasi: HR bisa lihat semua, karyawan hanya miliknya. Status DRAFT/FINALIZED mencegah edit setelah dikirim." |

---

## 6. Step plan eksekusi

1. ✅ Tulis dokumen ini.
2. Migrasi schema PayrollEntry (destructive).
3. Tulis Excel parser & validator.
4. Endpoint download template.
5. Server action `importPayrollAction` + `finalizePayrollAction` (kept).
6. Halaman `/payroll` — `ImportPayrollForm`.
7. Halaman `/payroll/[periodId]` — preview tabel + finalize.
8. Redesign payslip PDF.
9. Update payslip API + halaman `/payslip`.
10. Cleanup file legacy + sidebar.
11. Verifikasi `tsc`, `lint`, `next build`, manual smoke test.

---

*Dokumen pivot dibuat: 2026-04-29*
