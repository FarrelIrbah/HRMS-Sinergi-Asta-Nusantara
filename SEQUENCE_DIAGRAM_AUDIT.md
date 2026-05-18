# Audit Sequence Diagram — HRMS PT SAN

> Evaluasi terhadap 6 *sequence diagram* (SD) yang sudah disusun pada `bab4_4_5_milestone2_design.md`.
> Semua penilaian kompleksitas dihitung dari pembacaan langsung file `src/lib/actions/*.ts` dan `src/lib/services/*.ts`.

Metrik kompleksitas yang dipakai (per *use case*):
- **#step** = jumlah langkah linear pada *control flow* (validasi, query, branching, mutasi, audit, revalidate).
- **#branch** = jumlah cabang `if / alt` yang berpengaruh ke hasil akhir.
- **TX** = membuka `prisma.$transaction` (atomicity terlihat).
- **Cross-entity** = jumlah model Prisma yang ditulis/dimutasi dalam satu eksekusi.
- **Distinguished** = mengandung logika unik sistem (lokasi IP+GPS, 2-tier approval, pivot Excel import, dst.).

---

## 1. Evaluasi Per Modul

### Modul Auth / Umum

- **Use case terpilih**: UC-HRMS-01 *Login*
- **Kompleksitas**: SEDANG.
  Alasan: 1 query (`user.findUnique` di `src/lib/auth.ts:31`), 1 `bcrypt.compare`, 2 *callbacks* JWT/Session, 3 cabang alternatif (validasi, user-not-found, password-mismatch). Tidak ada transaksi, tidak ada audit log, tidak ada *cross-entity*.
- **Use case alternatif di modul yang sama**: UC-02 *Logout* (trivial, hanya `signOut()`), UC-03 *Melihat Dashboard* (mostly read-only, 4 fungsi `getXxxDashboardData` di `dashboard.service.ts` — 1365 LoC tetapi hampir semuanya *query aggregation*, jarang ada interaksi multi-objek yang menarik untuk SD).
- **Verdict**: **TEPAT**.
- **Alasan**: Login adalah *foundational use case* — wajib ada di setiap skripsi sistem informasi. Walaupun kompleksitasnya tidak setinggi UC-11 atau UC-27, alur callback NextAuth (`authorize` → `jwt` → `session`) memberi tampilan multi-objek yang khas autentikasi.

### Modul Employee Data Management

- **Use case terpilih**: UC-HRMS-11 *Menambah Data Karyawan*
- **Kompleksitas**: TINGGI.
  Alasan: `createEmployeeAction` (`employee.actions.ts:36`) → `createEmployee` (`employee.service.ts:147`). Membuka **`prisma.$transaction`**, di dalamnya: check email unik (`user.findUnique`) → `generateEmployeeNIK(tx)` (helper yang query `employee.findFirst` dengan prefix LIKE) → `bcrypt.hash` → `user.create` + `employee.create` (2 entity dalam 1 atomic op). Setelah TX, `createAuditLog`.
  #step ≈ 8, #branch = 3, TX = ✓, Cross-entity = 3 (User, Employee, AuditLog).
- **Use case alternatif**: UC-12 *Mengubah Profil* (3 server action terpisah, masing-masing trivial update + audit), UC-13 *Mengelola Dokumen* (upload-to-filesystem via REST route, lebih ke I/O ekstrasistem), UC-15 *Menonaktifkan Karyawan* (1 update + 1 audit, sederhana).
- **Verdict**: **TEPAT**.
- **Alasan**: UC-11 adalah satu-satunya UC di modul ini yang menggunakan `prisma.$transaction` dengan 2 entity. Distinguishing feature: NIK auto-generation dengan prefix-LIKE query di dalam TX.

### Modul Recruitment

- **Use case terpilih**: UC-HRMS-18 *Mengubah Tahap Kandidat*
- **Kompleksitas**: **RENDAH–SEDANG**.
  Alasan: `updateCandidateStageAction` (`recruitment.actions.ts:148`) hanya: guard → `safeParse` → 1 `candidate.update` (1 field) → audit → `revalidatePath`. Tidak ada transaksi, tidak ada *cross-entity* (hanya `Candidate` + `AuditLog`).
  Distinguished feature yang muncul di SD = optimistic UI + `@dnd-kit` event flow (UI/UX, bukan business logic).
- **Use case alternatif**:
  - **UC-21 *Mengonversi Kandidat menjadi Karyawan***: lebih kompleks. `convertCandidateToEmployeeAction` (`recruitment.actions.ts:256`) → `candidate.findUniqueOrThrow` (with include vacancy+department) → guard `stage === "DITERIMA"` → `candidate.update({ hiredAt })` → audit → return *prefill* untuk dialihkan ke `createEmployeeAction`. UC ini menjembatani 2 modul (Recruitment → Employee Data) dan menghasilkan User+Employee baru — fitur yang **tidak dimiliki** sistem HRMS generik.
  - UC-20 *Mengelola Penawaran*: trivial, hanya update 2 field.
  - UC-19 *Menjadwalkan Interview*: trivial, 1 `interview.create`.
- **Verdict**: **TEPAT, TAPI PERLU DITAMBAH SD-21**.
- **Alasan**: UC-18 patut dipertahankan karena visualisasinya menunjukkan pola unik (Kanban + `dnd-kit` + optimistic update + rollback on failure) yang tidak muncul di SD lain. Namun UC-21 *Convert Candidate* adalah *distinguishing feature* sistem ini (jembatan recruitment → employee data) yang tidak ter-cover oleh 6 SD manapun. **Rekomendasi: tambah SD-21**, jangan ganti SD-18.

### Modul Attendance

- **Use case terpilih**: UC-HRMS-22 *Mencatat Kehadiran* (clock-in)
- **Kompleksitas**: TINGGI.
  Alasan: `clockInAction` (`attendance.actions.ts:19`) → `auth()` → `headers()` baca `x-forwarded-for` / `x-real-ip` → `employee.findUnique` with `include: officeLocation` → 3 guard (no-profile, inactive, no-officeLocation) → `verifyLocation` (cek IP allowlist + Haversine distance terhadap radius) → konversi timezone Asia/Jakarta → `calculateAttendanceFlags` → `attendanceRecord.create` → tangani `P2002` (unique violation `[employeeId, date]`).
  #step ≈ 10, #branch = 5, TX = ✗ (single create, P2002 menjamin idempotensi), Cross-entity = 1 (AttendanceRecord). Distinguished: **IP allowlist + GPS-radius geofencing**, fitur yang membedakan sistem ini dari HRMS generik.
- **Use case alternatif**:
  - **UC-22 sebenarnya mencakup *clock-out* juga** (lihat tabel use case: SRS-F-24, F-25). Tapi SD yang dibuat hanya menunjukkan clock-in. Clock-out (`clockOutAction`, `attendance.actions.ts:93`) menambahkan: baca record hari ini → guard belum-clock-in / sudah-clock-out → `calculateAttendanceFlags(clockIn, clockOut, ...)` yang menghitung **isEarlyOut, earlyOutMinutes, overtimeMinutes, totalMinutes** → update record. Fitur perhitungan lembur ini distinguished tapi belum ter-visualisasi.
  - UC-24 *Koreksi Manual Absensi* (`manualOverrideAction`): kompleksitas tinggi (UTC↔WIB conversion manual, upsert pattern, 5 field flags), tapi lebih ke fitur admin biasa.
- **Verdict**: **TEPAT**.
- **Alasan**: Clock-in mencakup logika *verifyLocation* yang paling unik. Clock-out hanyalah lanjutan dengan logika perhitungan tambahan; jika ingin menampilkan lembur, cukup ditambahkan paragraf naratif di SD-22 (alur lanjutan), bukan SD terpisah. **Tidak perlu SD tambahan untuk attendance**.

### Modul Leave

- **Use case terpilih**: UC-HRMS-26 *Mengajukan Cuti*
- **Kompleksitas**: TINGGI.
  Alasan: `submitLeaveAction` (`leave.actions.ts:23`) → `submitLeaveRequest` (`leave.service.ts:102`). Step: `countWorkingDays` (filter weekend) → `ensureLeaveBalances` (upsert per LeaveType) → cek saldo (`allocatedDays - usedDays >= workingDays`) → **`resolveInitialStage`** (logika unik: skip PENDING_MANAGER kalau requester ADALAH manager atau dept tidak punya manager aktif) → `leaveRequest.create`.
  #step ≈ 7, #branch = 4, TX = ✗ (operasi-operasi independen), Cross-entity = 2 (LeaveBalance, LeaveRequest).
- **Use case alternatif**:
  - **UC-27 *Menyetujui / Menolak Cuti***: **JAUH LEBIH KOMPLEKS**. `approveLeaveRequest` (`leave.service.ts:155`) membuka **`prisma.$transaction`**, di dalamnya:
    1. Fetch request + employee.userId + departmentId.
    2. Self-approval guard (`request.employee.userId === approverUserId`).
    3. Branch berdasarkan `status` saat ini (`PENDING_MANAGER` vs `PENDING_HR`).
    4. Untuk PENDING_MANAGER: validate `approverRole === MANAGER`, validate `approver.departmentId === request.employee.departmentId` (manager hanya boleh approve dept-nya), update status → `PENDING_HR`.
    5. Untuk PENDING_HR: validate `role ∈ {HR_ADMIN, SUPER_ADMIN}`, **decrement saldo cuti** (`leaveBalance.update with increment`), update status → `APPROVED`.

    #step ≈ 10, #branch = 6, TX = ✓, Cross-entity = 2 (LeaveRequest, LeaveBalance). **Distinguished feature**: 2-tier approval workflow dengan dept-scoped manager + self-approval guard + atomic balance increment.
  - UC-28 *Membatalkan Cuti* (`cancelLeaveRequest`): sederhana, 1 update.
  - UC-29 *Melihat Laporan Cuti*: query-aggregation, kurang menarik sebagai SD.
- **Verdict**: **TEPAT, TAPI PERLU DITAMBAH SD-27**.
- **Alasan**: SD-26 menampilkan **separuh** alur cuti (submission). Alur 2-tahap approval — yang merupakan implementasi langsung dari SRS-HRMS-F-30 dan disebut eksplisit di proses bisnis aplikasi (`bab4_1_requirements.md:263`) — belum punya SD. UC-27 secara teknis adalah UC paling kompleks di seluruh sistem (TX + 6 cabang + self-approval guard + dept-scoped check + atomic balance increment). **Wajib ditambah**.

### Modul Payroll

- **Use case terpilih**: UC-HRMS-30 *Mengimpor Data Payroll*
- **Kompleksitas**: TINGGI.
  Alasan: `importPayrollAction` (`payroll.actions.ts:36`) → 4 fase: validasi schema → `parsePayrollWorkbook` (`payroll-import.service.ts`, 507 LoC — parsing struktural xlsx) → `matchRowsToEmployees` (`employee.findMany IN niks`, validasi aktif) → `persistImportedPayroll` (upsert PayrollRun + deleteMany lama + createMany entries; reject jika sudah FINALIZED).
  #step ≈ 8, #branch = 5, TX = ✗ (operasi sekuensial; idempotensi via upsert + deleteMany), Cross-entity = 3 (PayrollRun, PayrollEntry, AuditLog). Distinguished: **pivot Excel-import** (lihat `project_payroll_pivot.md` 2026-04-29).
- **Use case alternatif**:
  - UC-31 *Memfinalisasi Payroll* (`finalizePayrollAction`, `finalizePayroll`): sederhana — fetch run, guard `!= FINALIZED`, update status, audit. #step ≈ 4, #branch = 2.
  - UC-32 *Melihat dan Mengunduh Slip Gaji*: route handler `/api/payroll/payslip/[entryId]` + `payslip-pdf.tsx` render. Lebih ke aspek I/O (streaming PDF), bukan business logic.
- **Verdict**: **TEPAT**.
- **Alasan**: SD-30 mencakup *distinguished feature* utama modul (pivot import). UC-31 dan UC-32 walaupun penting secara fungsional, tidak memiliki business logic yang cukup untuk menghasilkan SD yang informatif. Tidak perlu SD tambahan untuk payroll.

---

## 2. Fitur Distinguished yang Belum Ter-cover

| Fitur | Status di 6 SD | Penting di-cover? | Catatan |
|---|---|---|---|
| **2-tier leave approval (Manager → HR)** | Tidak | **YA — KRITIS** | Implementasi langsung SRS-F-30. Logika di `leave.service.ts:155-232` adalah yang paling kompleks di seluruh sistem (TX + 6 cabang + self-approval guard + dept-scoped check + atomic balance increment). |
| **Convert Candidate → Employee** | Tidak | **YA** | Satu-satunya jembatan antar-modul (Recruitment ↔ Employee Data). Membuktikan integrasi sistem holistik, bukan modul-modul terpisah. |
| **Clock-out + overtime calculation** | Tidak (hanya clock-in) | Tidak | Alur sama dengan clock-in, hanya tambahan `calculateAttendanceFlags(in, out)` yang menghasilkan `overtimeMinutes`, `earlyOutMinutes`, `totalMinutes`. Cukup disebutkan naratif di SD-22. |
| **Generate Offer Letter PDF** | Tidak | Tidak | Route handler PDF — interaksi objek dangkal (controller → renderer). |
| **Download payroll template** | Tidak | Tidak | Statis: `buildPayrollTemplate` + stream `xlsx`. Tidak ada business logic. |
| **Role-based dashboard** | Tidak | Tidak | 4 fungsi `getXxxDashboardData` di `dashboard.service.ts` — semuanya read-only `findMany`/`count`. SD akan didominasi panggilan query, kurang informatif. |
| **Audit log mechanism** | Implisit di semua SD | Tidak | `createAuditLog` sudah muncul sebagai *control* di SD-11, SD-18, SD-26, SD-30. Tidak perlu SD sendiri. |
| **Finalize payroll** | Tidak | Tidak | Hanya state transition `DRAFT → FINALIZED` + guard. Terlalu sederhana. |
| **Generate payslip PDF** | Tidak | Tidak | Sama dengan offer letter — dominan I/O. |
| **Manual override absensi** | Tidak | Tidak | Fitur admin. Logika UTC↔WIB conversion menarik secara teknis tapi sudah ter-cover atribut `isManualOverride` di SD-22. |

---

## 3. Alur End-to-End yang Belum Lengkap

- **Alur Cuti**: SD-26 (submission) ✓ — SD untuk approval (UC-27) ✗ — SD untuk cancel (UC-28) ✗.
  Yang ada: hanya pintu masuk. Yang krusial: alur *Manager approves → status PENDING_HR → HR approves → balance decrement → status APPROVED*. Saat ini, pembaca skripsi yang melihat SD-26 tidak akan tahu bagaimana 2-tier approval direalisasikan. **Wajib tambah SD-27**.
- **Alur Recruitment → Employee Data**: SD-11 (create employee dari form kosong) ✓ — SD-18 (geser kartu) ✓ — namun bagaimana kandidat yang sudah DITERIMA berubah menjadi Employee? UC-21 `convertCandidateToEmployeeAction` yang mengisi *prefill* untuk form karyawan dan menetapkan `hiredAt` adalah jembatan. **Disarankan tambah SD-21** (opsional tapi sangat memperkaya skripsi).
- **Alur Attendance**: SD-22 (clock-in) ✓ — clock-out belum, tapi sufficiently dijelaskan via paragraf di body teks; tidak perlu SD terpisah.
- **Alur Payroll**: SD-30 (import) ✓ — finalize (UC-31) dan slip (UC-32) tidak punya SD, tetapi keduanya trivial sehingga tidak hilang nilai naratifnya jika hanya dijelaskan tekstual.

---

## 4. Ranking Kompleksitas Teknis (Top 10 Use Case)

Skor relatif berdasarkan: #step, #branch, TX, cross-entity, distinguished.

| Rank | UC-ID | Nama | Kompleksitas | Detail singkat | Sudah Ada SD? |
|------|-------|------|--------------|----------------|---------------|
| 1 | UC-HRMS-27 | Menyetujui / Menolak Cuti | **Sangat Tinggi** | TX, 6 cabang status×role, self-approval guard, dept-scoped, atomic balance increment | **TIDAK** |
| 2 | UC-HRMS-30 | Mengimpor Data Payroll | Tinggi | 4 fase pipeline (parse → match → upsert → audit), reject jika FINALIZED, 5 cabang error | Ya (SD-30) |
| 3 | UC-HRMS-11 | Menambah Data Karyawan | Tinggi | TX 3-entity (User+Employee+Audit), NIK auto-gen dengan prefix-LIKE, bcrypt | Ya (SD-11) |
| 4 | UC-HRMS-22 | Mencatat Kehadiran (Clock-in) | Tinggi | IP+GPS verify, timezone WIB, attendance flags, P2002 handling | Ya (SD-22) |
| 5 | UC-HRMS-26 | Mengajukan Cuti | Sedang-Tinggi | countWorkingDays, ensureBalances, resolveInitialStage (skip-manager logic) | Ya (SD-26) |
| 6 | UC-HRMS-24 | Koreksi Manual Absensi | Sedang-Tinggi | UTC↔WIB manual, upsert pattern, flags calc, audit | Tidak |
| 7 | UC-HRMS-21 | Konversi Kandidat → Karyawan | Sedang | Cross-modul (Recruitment→Employee), prefill flow, hiredAt timestamp | **TIDAK** |
| 8 | UC-HRMS-01 | Login | Sedang | NextAuth callback chain, bcrypt.compare, JWT/Session callbacks | Ya (SD-01) |
| 9 | UC-HRMS-15 | Menonaktifkan Karyawan | Sedang | Update + audit dengan old/new values, terminationDate+reason | Tidak |
| 10 | UC-HRMS-18 | Mengubah Tahap Kandidat | Rendah-Sedang | 1 update field, audit; nilai SD-nya dari optimistic UI + dnd-kit | Ya (SD-18) |

> Catatan: UC-31 *Finalize Payroll* (rank ≈ 12) dan UC-32 *Payslip PDF* (rank ≈ 14) sengaja tidak masuk Top 10 karena logikanya trivial / dominan I/O.

---

## 5. REKOMENDASI FINAL

- **Total sequence diagram saat ini**: 6
- **Rekomendasi total**: **8** (6 yang sudah ada + 2 tambahan)

### Sequence diagram yang perlu DITAMBAH

1. **SD-HRMS-27 — *Menyetujui / Menolak Cuti*** (modul Leave)
   - **WHY**:
     - UC paling kompleks di seluruh sistem (TX, 6 cabang status×role, self-approval guard, dept-scoped manager check, atomic balance increment).
     - Mencakup *distinguishing feature* sistem: **2-tier approval workflow** (PENDING_MANAGER → PENDING_HR → APPROVED) — disebut eksplisit di SRS-F-30 dan proses bisnis aplikasi.
     - Melengkapi alur leave end-to-end (saat ini SD-26 hanya menampilkan submission).
   - **Boundary/Control/Entity yang akan muncul**:
     - Boundary: `LeaveApprovalTable` + `ApproveRejectDialog` (`/leave/manage`).
     - Control: `approveLeaveAction` (`leave.actions.ts:79`), `approveLeaveRequest` service, `prisma.$transaction`, `createAuditLog`.
     - Entity: `LeaveRequest`, `LeaveBalance`, `Employee`, `User`, `AuditLog`.

2. **SD-HRMS-21 — *Mengonversi Kandidat menjadi Karyawan*** (modul Recruitment)
   - **WHY**:
     - Satu-satunya UC yang menjembatani 2 modul (Recruitment → Employee Data Management). Membuktikan sistem terintegrasi, bukan modul-modul terpisah.
     - Memiliki state guard unik (`stage === "DITERIMA"`), timestamp `hiredAt`, dan pola *prefill* form yang mengarahkan ke `createEmployeeAction` (UC-11). SD ini secara visual menunjukkan handoff antar-controller.
     - Tidak ada *distinguished feature recruitment* lain yang belum tercover.
   - **Boundary/Control/Entity yang akan muncul**:
     - Boundary: `CandidateDetailClient` (tombol "Konversi ke Karyawan"), kemudian redirect ke `Halaman /employees/new` dengan prefill.
     - Control: `convertCandidateToEmployeeAction` (`recruitment.actions.ts:256`), kemudian `createEmployeeAction` (referensi ke SD-11).
     - Entity: `Candidate`, `Vacancy`, `Department`, `AuditLog`, lalu (via SD-11) `User`+`Employee`.

### Sequence diagram yang perlu DIGANTI

- **Tidak ada**. Semua 6 SD yang sudah dibuat tetap relevan, masing-masing menutup minimal satu modul utama dan memiliki nilai naratif.
- Catatan opsional: SD-18 *Mengubah Tahap Kandidat* adalah yang paling sederhana secara business logic (1 update field). Namun **dipertahankan** karena dia satu-satunya SD yang menampilkan pola UI optimistic-update + `@dnd-kit` event flow, yang merupakan komponen UX khas modul recruitment.

### Sequence diagram yang TETAP (tidak berubah)

1. SD-HRMS-01 Login
2. SD-HRMS-11 Menambah Data Karyawan
3. SD-HRMS-18 Mengubah Tahap Kandidat
4. SD-HRMS-22 Mencatat Kehadiran
5. SD-HRMS-26 Mengajukan Cuti
6. SD-HRMS-30 Mengimpor Data Payroll

### Pertimbangan jumlah untuk skripsi

Target 6–10 SD masuk akal. 8 SD memberi *coverage* per modul yang baik:
- Auth/Umum: 1 (SD-01)
- Employee Data: 1 (SD-11)
- Recruitment: 2 (SD-18 untuk UX, SD-21 untuk integrasi antar-modul)
- Attendance: 1 (SD-22)
- Leave: 2 (SD-26 submission, SD-27 2-tier approval)
- Payroll: 1 (SD-30)

Distribusi seperti ini menghindari modul yang *over-represented* (3+ SD) maupun fitur distinguished yang belum tertangkap.
