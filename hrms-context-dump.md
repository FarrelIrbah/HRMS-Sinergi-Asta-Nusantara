# HRMS PT. SAN — Context Dump

Dokumen ini adalah **single source of truth** seluruh sistem HRMS PT. Sinergi Asta Nusantara, dirancang sebagai referensi penulisan BAB 4 & 5 skripsi. Berisi 13 bagian:

1. Prisma Schema Lengkap
2. API Routes & Server Actions
3. Pages / Routes
4. Role & Access Control
5. Alur Proses Bisnis Setiap Fitur
6. Pemetaan Kelas / File
7. Detail Method / Fungsi Setiap Controller
8. Detail Setiap Tabel Database
9. Validasi Form
10. Tech Stack & Dependencies
11. Middleware & Auth Mechanism
12. Komponen UI Reusable
13. Library / Utility Khusus

Stack: Next.js 14 App Router, Prisma 6 + PostgreSQL, NextAuth.js 5, TypeScript, Tailwind + shadcn/ui, Zod, react-hook-form, Server Actions sebagai controller utama.

---

## 0. Changelog: Paket A Cleanup (2026-05-07)

> **Konteks**: Sebelum tanggal ini, dump-mu memuat sejumlah klaim yang menyebut fitur "ada" padahal kenyataannya hanya peninggalan setengah-jadi atau dead code dari pivot Phase 4 (2026-04-29). Semua issue tersebut **sudah dibereskan** dalam commit cleanup Paket A. Section 1-13 sekarang mencerminkan kode aktual setelah cleanup.
>
> Section 0 ini berfungsi sebagai **catatan perubahan**: apa yang berubah, dan kenapa. Berguna untuk skripsi kalau dosen tanya "apa yang ditambahkan setelah pivot Phase 4".

### 0.1 Fitur yang DIIMPLEMENTASI (sebelumnya tidak / setengah-jadi)

#### a) Auto-fill form karyawan baru saat convert candidate ✅

**Sebelum**: Saat HR klik "Convert to Employee" pada kandidat stage `DITERIMA`, system membuat URL `/employees/new?fullName=...&email=...&phone=...&departmentId=...&candidateId=...`, tapi `CreateEmployeeForm` tidak membaca query string sehingga form tetap kosong. HR harus mengetik ulang.

**Sesudah**: `CreateEmployeeForm` membaca `useSearchParams()` dan mengisi `defaultValues` untuk `namaLengkap`, `email`, `nomorHp` (dari `phone`), dan `departmentId`. HR sekarang membuka form ter-prefill, hanya perlu lengkapi password awal, jabatan, kontrak, NIK KTP, tanggal lahir, dll.

**File**: `src/app/(dashboard)/employees/new/_components/create-employee-form.tsx`

#### b) Audit log untuk Payroll Import + Finalize ✅

**Sebelum**: `importPayrollAction` dan `finalizePayrollAction` tidak memanggil `createAuditLog`. Aktivitas payroll tidak terekam.

**Sesudah**: Kedua action sekarang memanggil `createAuditLog` dengan module="Payroll":
- Import: `action=CREATE`, `newValue={ month, year, entryCount, status: "DRAFT" }`
- Finalize: `action=UPDATE`, `oldValue={ status: "DRAFT" }`, `newValue={ status: "FINALIZED" }`

**File**: `src/lib/actions/payroll.actions.ts`

#### c) Audit log untuk updateOffer / createInterview / cancelLeave ✅

**Sebelum**: Tiga action ini tidak memanggil `createAuditLog`.

**Sesudah**: Sekarang ketiganya audit:
- `updateOfferAction` → module="Kandidat", action=UPDATE, newValue={ offerSalary, offerNotes }
- `createInterviewAction` → module="Wawancara", action=CREATE, newValue={ candidateId, scheduledAt, interviewerName }
- `cancelLeaveAction` → module="Permintaan Cuti", action=UPDATE, newValue={ status: "CANCELLED" }

**File**: `src/lib/actions/recruitment.actions.ts`, `src/lib/actions/leave.actions.ts`

#### d) Validasi delete master data lengkap untuk semua entity ✅

**Sebelum**: Hanya `deleteDepartment` yang punya guardrail (cek `_count.positions > 0`). `deletePosition`, `deleteOfficeLocation`, `deleteLeaveType` soft-delete tanpa cek penggunaan, berisiko membuat orphan reference.

**Sesudah**: Semua 4 service delete punya validasi pre-condition:

| Service | Cek | Pesan error jika dilanggar |
|---|---|---|
| `deleteDepartment` | `_count.positions > 0` (Position aktif) | "Departemen memiliki jabatan aktif, tidak dapat dihapus" |
| `deletePosition` | `_count.employees > 0` (Employee aktif memakai jabatan) | "Jabatan masih dipakai N karyawan aktif, tidak dapat dihapus" |
| `deleteOfficeLocation` | `_count.employees > 0` (Employee aktif memakai lokasi) | "Lokasi kantor masih dipakai N karyawan aktif, tidak dapat dihapus" |
| `deleteLeaveType` | `_count.leaveRequests > 0` (status PENDING_MANAGER/PENDING_HR/APPROVED) | "Jenis cuti masih terkait N pengajuan aktif, tidak dapat dihapus" |

**File**: `src/lib/services/master-data.service.ts`

### 0.2 Schema Field & Model yang DIHAPUS

Migration: `prisma/migrations/20260507120000_cleanup_dead_fields_and_payroll_pivot/migration.sql`.

| Item | Sebelum | Sesudah | Alasan |
|---|---|---|---|
| `Employee.baseSalary` (Decimal 15,2) | Kolom DB ada, default 0, tidak pernah di-set | Kolom dihapus | Setelah pivot, gaji pokok diisi HR langsung di Excel payroll → kolom redundant. |
| `LeaveRequest.attachmentPath`, `attachmentName` | Kolom DB ada, selalu `null` | Kolom dihapus | Form pengajuan cuti tidak menyediakan input file upload. Schema bersih dari fitur yang tidak diimplementasi. |
| `EmployeeAllowance` model + `Employee.allowances` relation | Tabel `employee_allowances` ada, tidak ada CRUD UI | Tabel dihapus, relasi dihapus | Tunjangan ditangani via Excel import; tidak butuh master tunjangan per karyawan. |
| `payroll_entries` legacy columns (`baseSalary`, `bpjsJhtEmp`, `bpjsKesEmp`, `grossPay`, `netPay`, `overtimePay`, `thrAmount`, `totalAllowances`, `absenceDeduction`, `bpjsJpEmp`, `bpjsJpEmpr`, `bpjsJhtEmpr`, `bpjsKesEmpr`, `bpjsJkk`, `bpjsJkm`) | Kolom DB ada (sisa Phase 4 awal) | Kolom dihapus, replaced dengan kolom pivot baru | Migration formal untuk payroll pivot belum pernah dibuat sebelum cleanup ini — drift terdeteksi & disinkronkan. |

### 0.3 Constants & Function yang DIHAPUS dari `constants.ts` & `leave.service.ts`

| Item | Lokasi sebelumnya | Alasan |
|---|---|---|
| `BPJS_RATES` const | `lib/constants.ts` | Engine kalkulasi BPJS dihapus saat pivot Phase 4 → konstanta tidak di-import di mana pun |
| `PTKP_ANNUAL` const | `lib/constants.ts` | Sda |
| `TER_CATEGORY`, `TER_TABLE_A/B/C` const | `lib/constants.ts` | Engine PPh21 TER dihapus |
| `PPH21_PROGRESSIVE_BRACKETS` const | `lib/constants.ts` | Engine PPh21 progresif dihapus |
| `BIAYA_JABATAN_RATE`, `BIAYA_JABATAN_MAX` const | `lib/constants.ts` | Engine biaya jabatan dihapus |
| `import Decimal from "decimal.js"` | `lib/constants.ts` | Tidak ada konstanta lagi yang butuh; `decimal.js` masih dipakai untuk Prisma generated types (kolom DB `Decimal`). |
| `MODULES.AUTH = "Autentikasi"` | `lib/constants.ts` | Login event tidak di-audit; label dummy dihapus |
| `getPendingLeaveCount(options)` function | `lib/services/leave.service.ts` | Tidak pernah dipanggil; dashboard service pakai `prisma.leaveRequest.count` langsung |
| `attachmentPath?` / `attachmentName?` parameter | `submitLeaveRequest()` di `lib/services/leave.service.ts` | Schema field-nya juga sudah dihapus (lihat 0.2) |

### 0.4 Modul yang Sekarang Tercatat di Audit Log

Setelah Paket A, daftar modul yang menghasilkan entri `AuditLog` saat dimutasi:

- **Karyawan** (`MODULES.EMPLOYEE`) — create, update personal/employment/tax-bpjs, deactivate
- **Dokumen Karyawan** (`MODULES.EMPLOYEE_DOCUMENT`) — upload, delete
- **Kontak Darurat** (`MODULES.EMERGENCY_CONTACT`) — create, update, delete
- **Absensi** — manual override (clock-in/out reguler tidak di-audit)
- **Permintaan Cuti** — submit, approve, reject, **cancel** (baru ditambahkan Paket A)
- **Payroll** (baru ditambahkan Paket A) — import (CREATE), finalize (UPDATE)
- **Lowongan** — create, update, toggle status
- **Kandidat** — create, update stage, convert to employee, **update offer** (baru Paket A)
- **Wawancara** (baru ditambahkan Paket A) — create
- **User** (`MODULES.USER`) — create, update, toggle active
- **Departemen, Jabatan, Lokasi Kantor, Jenis Cuti** — create, update, delete

### 0.5 Yang Tetap Out-of-Scope (sesuai keputusan)

- **Lampiran cuti**: tidak diimplementasi (kolom schema dihapus). Skripsi sebut sebagai future work jika perlu.
- **Login audit**: tidak ada entri audit untuk login sukses/gagal. Kalau ingin di skripsi, sebut sebagai limitation atau implement minor (tambah `createAuditLog` di NextAuth callback).

---

## 1. Prisma Schema Lengkap

```prisma
// HRMS PT. Sinergi Asta Nusantara - Database Schema

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ───────────────────────────────────────────────────────────

enum Role {
  SUPER_ADMIN
  HR_ADMIN
  MANAGER
  EMPLOYEE
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
}

enum Gender {
  MALE
  FEMALE
}

enum Religion {
  ISLAM
  KRISTEN
  KATOLIK
  HINDU
  BUDDHA
  KONGHUCU
}

enum MaritalStatus {
  TK
  K
}

enum ContractType {
  PKWT
  PKWTT
}

enum PTKPStatus {
  TK_0
  TK_1
  TK_2
  TK_3
  K_0
  K_1
  K_2
  K_3
}

enum DocumentType {
  KTP
  NPWP
  BPJS_KESEHATAN
  BPJS_KETENAGAKERJAAN
  KONTRAK
  FOTO
  LAINNYA
}

enum AttendanceStatus {
  ON_TIME
  LATE
  EARLY_OUT
  OVERTIME
  LATE_AND_EARLY_OUT
  LATE_AND_OVERTIME
}

enum LeaveStatus {
  PENDING_MANAGER
  PENDING_HR
  APPROVED
  REJECTED
  CANCELLED
}

enum PayrollStatus {
  DRAFT
  FINALIZED
}

enum VacancyStatus {
  OPEN
  CLOSED
}

enum CandidateStage {
  MELAMAR
  SELEKSI_BERKAS
  INTERVIEW
  PENAWARAN
  DITERIMA
  DITOLAK
}

// ─── Models ──────────────────────────────────────────────────────────

model User {
  id             String   @id @default(cuid())
  name           String
  email          String   @unique
  hashedPassword String
  role           Role     @default(EMPLOYEE)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  auditLogs            AuditLog[]
  employee             Employee?
  attendanceOverrides  AttendanceRecord[] @relation("AttendanceOverrides")
  leaveManagerApprovals LeaveRequest[]    @relation("LeaveManagerApprovals")
  leaveHRApprovals      LeaveRequest[]    @relation("LeaveHRApprovals")

  @@map("users")
}

model Department {
  id          String    @id @default(cuid())
  name        String
  description String?
  deletedAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  positions  Position[]
  employees  Employee[]
  vacancies  Vacancy[]

  @@map("departments")
}

model Position {
  id           String    @id @default(cuid())
  name         String
  departmentId String
  deletedAt    DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  department Department @relation(fields: [departmentId], references: [id])
  employees  Employee[]

  @@map("positions")
}

model OfficeLocation {
  id            String    @id @default(cuid())
  name          String
  address       String?
  allowedIPs    String[]
  latitude      Float?
  longitude     Float?
  radiusMeters  Int?
  workStartTime String?
  workEndTime   String?
  deletedAt     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  employees   Employee[]
  attendances AttendanceRecord[]

  @@map("office_locations")
}

model LeaveType {
  id                String    @id @default(cuid())
  name              String
  annualQuota       Int
  isPaid            Boolean   @default(true)
  genderRestriction String?
  deletedAt         DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  leaveRequests LeaveRequest[]
  leaveBalances LeaveBalance[]

  @@map("leave_types")
}

model AuditLog {
  id        String      @id @default(cuid())
  userId    String
  action    AuditAction
  module    String
  targetId  String
  oldValue  Json?
  newValue  Json?
  createdAt DateTime    @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId, module, createdAt])
  @@map("audit_logs")
}

model Employee {
  id                     String         @id @default(cuid())
  nik                    String         @unique
  userId                 String         @unique
  namaLengkap            String
  nikKtp                 String?
  tempatLahir            String?
  tanggalLahir           DateTime?
  jenisKelamin           Gender?
  statusPernikahan       MaritalStatus?
  agama                  Religion?
  alamat                 String?
  nomorHp                String?
  email                  String
  departmentId           String
  positionId             String
  officeLocationId       String?
  contractType           ContractType
  joinDate               DateTime
  isActive               Boolean        @default(true)
  terminationDate        DateTime?
  terminationReason      String?
  npwp                   String?
  ptkpStatus             PTKPStatus?
  bpjsKesehatanNo        String?
  bpjsKetenagakerjaanNo  String?
  isTaxBorneByCompany    Boolean        @default(false)
  createdAt              DateTime       @default(now())
  updatedAt              DateTime       @updatedAt

  user              User               @relation(fields: [userId], references: [id])
  department        Department         @relation(fields: [departmentId], references: [id])
  position          Position           @relation(fields: [positionId], references: [id])
  officeLocation    OfficeLocation?    @relation(fields: [officeLocationId], references: [id])
  documents         EmployeeDocument[]
  emergencyContacts EmergencyContact[]
  attendances       AttendanceRecord[]
  leaveRequests     LeaveRequest[]
  leaveBalances     LeaveBalance[]
  payrollEntries    PayrollEntry[]

  @@map("employees")
}

model EmployeeDocument {
  id           String       @id @default(cuid())
  employeeId   String
  documentType DocumentType
  fileName     String
  filePath     String
  fileSize     Int
  mimeType     String
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  employee Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@map("employee_documents")
}

model EmergencyContact {
  id           String   @id @default(cuid())
  employeeId   String
  name         String
  relationship String
  phone        String
  address      String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  employee Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@map("emergency_contacts")
}

model AttendanceRecord {
  id               String  @id @default(cuid())
  employeeId       String
  officeLocationId String
  date             DateTime @db.Date
  clockIn          DateTime?
  clockOut         DateTime?
  clockInIp        String?
  clockOutIp       String?
  clockInLat       Float?
  clockInLon       Float?
  isLate           Boolean  @default(false)
  lateMinutes      Int      @default(0)
  isEarlyOut       Boolean  @default(false)
  earlyOutMinutes  Int      @default(0)
  overtimeMinutes  Int      @default(0)
  totalMinutes     Int      @default(0)
  isManualOverride Boolean  @default(false)
  overrideById     String?
  overrideReason   String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  employee       Employee       @relation(fields: [employeeId], references: [id])
  officeLocation OfficeLocation @relation(fields: [officeLocationId], references: [id])
  overrideBy     User?          @relation("AttendanceOverrides", fields: [overrideById], references: [id])

  @@unique([employeeId, date])
  @@index([employeeId, date])
  @@map("attendance_records")
}

model LeaveRequest {
  id                  String      @id @default(cuid())
  employeeId          String
  leaveTypeId         String
  startDate           DateTime    @db.Date
  endDate             DateTime    @db.Date
  workingDays         Int
  reason              String
  status              LeaveStatus @default(PENDING_MANAGER)
  managerApprovedById String?
  managerNotes        String?
  managerApprovedAt   DateTime?
  hrApprovedById      String?
  hrNotes             String?
  hrApprovedAt        DateTime?
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  employee          Employee  @relation(fields: [employeeId], references: [id])
  leaveType         LeaveType @relation(fields: [leaveTypeId], references: [id])
  managerApprovedBy User?     @relation("LeaveManagerApprovals", fields: [managerApprovedById], references: [id])
  hrApprovedBy      User?     @relation("LeaveHRApprovals", fields: [hrApprovedById], references: [id])

  @@index([employeeId, status])
  @@index([status, createdAt])
  @@map("leave_requests")
}

model LeaveBalance {
  id            String   @id @default(cuid())
  employeeId    String
  leaveTypeId   String
  year          Int
  allocatedDays Int
  usedDays      Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  employee  Employee  @relation(fields: [employeeId], references: [id])
  leaveType LeaveType @relation(fields: [leaveTypeId], references: [id])

  @@unique([employeeId, leaveTypeId, year])
  @@map("leave_balances")
}

model PayrollRun {
  id        String        @id @default(cuid())
  month     Int
  year      Int
  status    PayrollStatus @default(DRAFT)
  createdBy String
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  entries PayrollEntry[]

  @@unique([month, year])
  @@map("payroll_runs")
}

model PayrollEntry {
  id           String @id @default(cuid())
  payrollRunId String
  employeeId   String

  // Employee snapshot (saat import)
  employeeNik  String
  employeeName String
  jobPosition  String  @default("")
  organization String  @default("")
  gradeLevel   String  @default("")
  ptkpStatus   String  @default("")
  npwp         String?

  // Earnings
  basicSalary         Decimal @db.Decimal(15, 2) @default(0)
  tunjanganKomunikasi Decimal @db.Decimal(15, 2) @default(0)
  tunjanganKehadiran  Decimal @db.Decimal(15, 2) @default(0)
  tunjanganJabatan    Decimal @db.Decimal(15, 2) @default(0)
  tunjanganLainnya    Decimal @db.Decimal(15, 2) @default(0)
  taxAllowance        Decimal @db.Decimal(15, 2) @default(0)
  thr                 Decimal @db.Decimal(15, 2) @default(0)
  totalEarnings       Decimal @db.Decimal(15, 2)

  // Deductions
  bpjsKesehatanEmployee  Decimal @db.Decimal(15, 2) @default(0)
  jhtEmployee            Decimal @db.Decimal(15, 2) @default(0)
  jaminanPensiunEmployee Decimal @db.Decimal(15, 2) @default(0)
  pph21                  Decimal @db.Decimal(15, 2) @default(0)
  potonganKeterlambatan  Decimal @db.Decimal(15, 2) @default(0)
  potonganKoperasi       Decimal @db.Decimal(15, 2) @default(0)
  potonganLainnya        Decimal @db.Decimal(15, 2) @default(0)
  totalDeductions        Decimal @db.Decimal(15, 2)

  takeHomePay Decimal @db.Decimal(15, 2)

  // Benefits (informational — porsi perusahaan, tidak masuk THP)
  jkk                   Decimal @db.Decimal(15, 2) @default(0)
  jkm                   Decimal @db.Decimal(15, 2) @default(0)
  jhtCompany            Decimal @db.Decimal(15, 2) @default(0)
  jaminanPensiunCompany Decimal @db.Decimal(15, 2) @default(0)
  bpjsKesehatanCompany  Decimal @db.Decimal(15, 2) @default(0)
  totalBenefits         Decimal @db.Decimal(15, 2)

  // Attendance summary
  actualWorkingDay   Int    @default(0)
  scheduleWorkingDay Int    @default(0)
  dayoff             Int    @default(0)
  nationalHoliday    Int    @default(0)
  companyHoliday     Int    @default(0)
  specialHoliday     Int    @default(0)
  attendanceCodes    String @default("")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  payrollRun PayrollRun @relation(fields: [payrollRunId], references: [id], onDelete: Cascade)
  employee   Employee   @relation(fields: [employeeId], references: [id])

  @@unique([payrollRunId, employeeId])
  @@index([payrollRunId])
  @@index([employeeId])
  @@map("payroll_entries")
}

// ─── Recruitment Models ───────────────────────────────────────────────

model Vacancy {
  id           String        @id @default(cuid())
  title        String
  department   Department    @relation(fields: [departmentId], references: [id])
  departmentId String
  description  String        @db.Text
  requirements String        @db.Text
  status       VacancyStatus @default(OPEN)
  openDate     DateTime
  closeDate    DateTime?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  candidates   Candidate[]

  @@map("vacancies")
}

model Candidate {
  id          String         @id @default(cuid())
  vacancy     Vacancy        @relation(fields: [vacancyId], references: [id])
  vacancyId   String
  name        String
  email       String
  phone       String?
  stage       CandidateStage @default(MELAMAR)
  cvPath      String?
  notes       String?        @db.Text
  offerSalary Decimal?       @db.Decimal(15, 2)
  offerNotes  String?        @db.Text
  hiredAt     DateTime?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  interviews  Interview[]

  @@map("candidates")
}

model Interview {
  id              String    @id @default(cuid())
  candidate       Candidate @relation(fields: [candidateId], references: [id])
  candidateId     String
  scheduledAt     DateTime
  interviewerName String?
  notes           String?   @db.Text
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@map("interviews")
}
```

---


---

## 2. API Routes & Server Actions

### Bagian A — REST API Routes (`src/app/api/`)

REST API hanya digunakan untuk skenario yang tidak cocok dengan Server Actions: NextAuth callback, upload file binary multipart, dan generator/export PDF & Excel yang harus mengembalikan stream binary.

#### A.1 NextAuth Handler

- **File**: `src/app/api/auth/[...nextauth]/route.ts`
- **HTTP Method**: GET, POST (semua method NextAuth)
- **Path**: `/api/auth/[...nextauth]` (catch-all NextAuth, e.g. `/api/auth/signin`, `/api/auth/callback/credentials`, `/api/auth/session`, `/api/auth/csrf`, `/api/auth/signout`)
- **Deskripsi**: Endpoint NextAuth v5 (Auth.js) untuk login dengan provider Credentials, callback, session retrieval, CSRF token, sign-out.
- **Handler**: Re-export `handlers.GET` dan `handlers.POST` dari `@/lib/auth`.
- **Parameter/Body**: Dikelola NextAuth (untuk login: `email`, `password`, `csrfToken`).
- **Response**: Cookie session JWT, JSON `{ user, expires }`, redirect.

#### A.2 Attendance Export

- **File**: `src/app/api/attendance/export/route.ts`
- **HTTP Method**: GET
- **Path**: `/api/attendance/export`
- **Deskripsi**: Export rekap absensi bulanan ke Excel atau PDF.
- **Handler**: `GET(request: Request)`
- **Parameter (query string)**:
  - `month` (number, default = bulan sekarang)
  - `year` (number, default = tahun sekarang)
  - `format` (`"xlsx"` | `"pdf"`, default `xlsx`)
  - `departmentId` (optional, filter per departemen)
- **Response**:
  - Format `xlsx`: `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, header `Content-Disposition: attachment; filename="absensi-{year}-{MM}.xlsx"`.
  - Format `pdf`: `Content-Type: application/pdf` dengan filename `absensi-{year}-{MM}.pdf`.
  - Error: 401 "Unauthorized" jika role bukan HR_ADMIN/SUPER_ADMIN.

#### A.3 Employee Documents — List & Upload

- **File**: `src/app/api/employees/[id]/documents/route.ts`
- **HTTP Method**: POST (upload baru)
- **Path**: `/api/employees/[id]/documents`
- **Deskripsi**: Upload dokumen karyawan (KTP, NPWP, BPJS, Kontrak, Foto, dll.). Disimpan di `uploads/employees/{employeeId}/`.
- **Handler**: `POST(request, { params })`
- **Parameter**:
  - Path: `id` = employeeId
  - Body multipart/form-data: `file` (PDF/JPEG/PNG, max 5MB), `documentType` (enum DocumentType)
- **Response**: `{ success: true, data: { id, employeeId, documentType, fileName, filePath, ... } }`. Error: 401, 403, 400, 500.

#### A.4 Employee Document — Download & Delete

- **File**: `src/app/api/employees/[id]/documents/[docId]/route.ts`
- **HTTP Methods**: GET, DELETE
- **Path**: `/api/employees/[id]/documents/[docId]`
- **Deskripsi**:
  - GET = download file dokumen.
  - DELETE = hapus dokumen (DB record + file di disk).
- **Handler**: `GET(request, { params })`, `DELETE(request, { params })`
- **Parameter**: Path `id` (employeeId), `docId` (document id).
- **Response**:
  - GET: stream file dengan `Content-Type` sesuai mimeType, header `Content-Disposition: attachment; filename="..."`.
  - DELETE: `{ success: true }`. Error: 401, 403, 404, 500.

#### A.5 Payslip PDF

- **File**: `src/app/api/payroll/payslip/[entryId]/route.ts`
- **HTTP Method**: GET
- **Path**: `/api/payroll/payslip/[entryId]`
- **Deskripsi**: Generate dan download payslip PDF untuk satu PayrollEntry yang sudah finalized.
- **Handler**: `GET(_request, { params })`
- **Parameter**: Path `entryId` = id PayrollEntry.
- **Response**: PDF dengan filename `Payslip-{YYYY-MM}-{NIK}.pdf`. Error: 401, 403, 404, 400 (jika belum finalized), 500.

#### A.6 Payroll Template

- **File**: `src/app/api/payroll/template/route.ts`
- **HTTP Method**: GET
- **Path**: `/api/payroll/template`
- **Deskripsi**: Download template Excel kosong untuk import payroll bulanan.
- **Handler**: `GET(request: NextRequest)`
- **Parameter**: Query `month` (1–12), `year` (2024–2099). Default = bulan/tahun sekarang.
- **Response**: File xlsx dengan dua sheet (`Payroll`, `Petunjuk`). Filename `template-penggajian-{Bulan}-{Tahun}.xlsx`.

#### A.7 Payroll Report (Rekap)

- **File**: `src/app/api/payroll-report/route.ts`
- **HTTP Method**: GET
- **Path**: `/api/payroll-report`
- **Deskripsi**: Export rekap penggajian satu PayrollRun ke Excel.
- **Handler**: `GET(request: NextRequest)`
- **Parameter**: Query `runId` (id PayrollRun, wajib).
- **Response**: File xlsx berisi seluruh PayrollEntry + baris TOTAL. Filename `rekap-penggajian-{Bulan}-{Tahun}.xlsx`. Error: 401, 403, 400, 404.

#### A.8 Recruitment CV Upload

- **File**: `src/app/api/recruitment/cv/route.ts`
- **HTTP Method**: POST
- **Path**: `/api/recruitment/cv`
- **Deskripsi**: Upload CV kandidat (PDF/JPEG/PNG, max 5MB). File disimpan ke `uploads/cv/{candidateId}-cv.{ext}` dan path-nya disimpan ke `Candidate.cvPath`.
- **Handler**: `POST(request: NextRequest)`
- **Parameter**: Body multipart/form-data: `file`, `candidateId`.
- **Response**: `{ success: true, cvPath: "/uploads/cv/..." }`. Error: 401, 403, 400, 404, 500.

#### A.9 Recruitment Offer Letter

- **File**: `src/app/api/recruitment/offer-letter/[candidateId]/route.ts`
- **HTTP Method**: GET
- **Path**: `/api/recruitment/offer-letter/[candidateId]`
- **Deskripsi**: Generate dan download surat penawaran (offer letter) PDF untuk kandidat dengan stage `DITERIMA` dan `offerSalary` terisi.
- **Handler**: `GET(_request, { params })`
- **Parameter**: Path `candidateId`.
- **Response**: PDF `surat-penawaran-{nama-kandidat}.pdf`. Error: 401 (Unauthorized), 403 (Forbidden — bukan HR), 404 (kandidat tidak ada), 400 (stage bukan DITERIMA atau offerSalary kosong), 500.

---

### Bagian B — Server Actions (`src/lib/actions/*.actions.ts`)

Semua file di bawah memiliki direktif `"use server"` di baris pertama. Tiap fungsi yang diekspor adalah Server Action yang dapat dipanggil dari Client Component menggunakan `useTransition()` atau `<form action={...}>`.

#### B.1 `user.actions.ts` — Manajemen User

| Action | Parameter | Operasi | Tabel | Return | Permission |
|--------|-----------|---------|-------|--------|------------|
| `createUserAction(formData)` | `unknown` divalidasi `createUserSchema` (name, email, password, role) | CREATE User + audit log | `User`, `AuditLog` | `ServiceResult<null>` | SUPER_ADMIN |
| `updateUserAction(id, formData)` | `id`, `unknown` divalidasi `updateUserSchema` | UPDATE User (name/email/role) + audit | `User`, `AuditLog` | `ServiceResult<null>` | SUPER_ADMIN |
| `toggleUserActiveAction(id)` | `id` | UPDATE `isActive` (toggle) + audit. Cegah self-deactivation. | `User`, `AuditLog` | `ServiceResult<null>` | SUPER_ADMIN |

#### B.2 `master-data.actions.ts` — Master Data

Semua action di file ini hanya boleh dijalankan oleh SUPER_ADMIN (cek `getAuthenticatedSuperAdmin()`).

**Department**:
| Action | Parameter | Operasi | Tabel |
|--------|-----------|---------|-------|
| `getDepartmentsAction()` | — | List berpaginasi (default page 1, soft-delete aware) | `Department` |
| `getAllDepartmentsAction()` | — | Daftar id+name aktif | `Department` |
| `createDepartmentAction(formData)` | `departmentSchema` (name, description?) | CREATE + audit | `Department`, `AuditLog` |
| `updateDepartmentAction(id, formData)` | `departmentSchema` | UPDATE + audit | `Department`, `AuditLog` |
| `deleteDepartmentAction(id)` | `id` | Soft delete (`deletedAt = now`); guard jika masih ada Position aktif | `Department`, `AuditLog` |

**Position**:
| Action | Parameter | Operasi | Tabel |
|--------|-----------|---------|-------|
| `getPositionsAction()` | — | List berpaginasi | `Position` |
| `getAllPositionsAction(departmentId?)` | filter optional | Daftar id+name+departmentId | `Position` |
| `createPositionAction(formData)` | `positionSchema` (name, departmentId) | CREATE + audit | `Position`, `AuditLog` |
| `updatePositionAction(id, formData)` | `positionSchema` | UPDATE + audit | `Position`, `AuditLog` |
| `deletePositionAction(id)` | `id` | Soft delete | `Position`, `AuditLog` |

**OfficeLocation**:
| Action | Parameter | Operasi | Tabel |
|--------|-----------|---------|-------|
| `getOfficeLocationsAction()` | — | List berpaginasi | `OfficeLocation` |
| `createOfficeLocationAction(formData)` | `officeLocationSchema` (name, address, allowedIPs[], lat, lng, radiusMeters) | CREATE + audit | `OfficeLocation`, `AuditLog` |
| `updateOfficeLocationAction(id, formData)` | `officeLocationSchema` | UPDATE + audit | `OfficeLocation`, `AuditLog` |
| `deleteOfficeLocationAction(id)` | `id` | Soft delete | `OfficeLocation`, `AuditLog` |

**LeaveType**:
| Action | Parameter | Operasi | Tabel |
|--------|-----------|---------|-------|
| `getLeaveTypesAction()` | — | List berpaginasi | `LeaveType` |
| `createLeaveTypeAction(formData)` | `leaveTypeSchema` (name, annualQuota, isPaid, genderRestriction?) | CREATE + audit | `LeaveType`, `AuditLog` |
| `updateLeaveTypeAction(id, formData)` | `leaveTypeSchema` | UPDATE + audit | `LeaveType`, `AuditLog` |
| `deleteLeaveTypeAction(id)` | `id` | Soft delete | `LeaveType`, `AuditLog` |

#### B.3 `employee.actions.ts` — Karyawan

Semua action butuh role HR_ADMIN atau SUPER_ADMIN (`requireHRAdmin()`).

| Action | Parameter | Operasi | Tabel |
|--------|-----------|---------|-------|
| `createEmployeeAction(formData)` | `createEmployeeSchema` (data lengkap personal+employment+initialPassword) | Transaksi: cek email unik, generate NIK `EMP-YYYY-XXXX`, hash password, CREATE User (role EMPLOYEE), CREATE Employee linked. Audit log. | `User`, `Employee`, `AuditLog` |
| `updatePersonalInfoAction(employeeId, formData)` | `updatePersonalInfoSchema` | UPDATE Employee bagian data pribadi (namaLengkap, nikKtp, tempatLahir, tanggalLahir, jenisKelamin, statusPernikahan, agama, alamat, nomorHp) + audit | `Employee`, `AuditLog` |
| `updateEmploymentAction(employeeId, formData)` | `updateEmploymentSchema` | UPDATE departmentId, positionId, contractType, joinDate, officeLocationId + audit | `Employee`, `AuditLog` |
| `updateTaxBpjsAction(employeeId, formData)` | `updateTaxBpjsSchema` | UPDATE npwp, ptkpStatus, bpjsKesehatanNo, bpjsKetenagakerjaanNo, isTaxBorneByCompany + audit | `Employee`, `AuditLog` |
| `deactivateEmployeeAction(employeeId, formData)` | `deactivateEmployeeSchema` (terminationDate, terminationReason) | Transaksi: set `isActive=false`, terminationDate, reason; juga set `User.isActive=false`. Audit log. | `Employee`, `User`, `AuditLog` |

#### B.4 `employee-document.actions.ts` — Kontak Darurat

Permission: HR_ADMIN/SUPER_ADMIN.

| Action | Parameter | Operasi | Tabel |
|--------|-----------|---------|-------|
| `createEmergencyContactAction(employeeId, data)` | `emergencyContactSchema` | Cap maksimal 3 kontak per karyawan. CREATE + audit. | `EmergencyContact`, `AuditLog` |
| `updateEmergencyContactAction(contactId, employeeId, data)` | `emergencyContactSchema` | Verifikasi ownership lalu UPDATE + audit | `EmergencyContact`, `AuditLog` |
| `deleteEmergencyContactAction(contactId, employeeId)` | — | Verifikasi ownership lalu DELETE + audit | `EmergencyContact`, `AuditLog` |

(Catatan: meskipun nama file `employee-document.actions.ts`, isinya khusus kontak darurat. Upload dokumen file karyawan dilakukan via REST endpoint A.3/A.4 di atas.)

#### B.5 `attendance.actions.ts` — Absensi

| Action | Parameter | Operasi | Tabel | Permission |
|--------|-----------|---------|-------|------------|
| `clockInAction(coords?)` | `{ latitude, longitude }` opsional | Resolve client IP dari header, verifikasi lokasi (GPS dulu, fallback IP), hitung `isLate`/`lateMinutes`, CREATE AttendanceRecord (unique constraint `[employeeId, date]` mencegah double clock-in) | `AttendanceRecord` | EMPLOYEE (atau siapapun yang punya Employee row aktif) |
| `clockOutAction(coords?)` | `{ latitude, longitude }` opsional | Verifikasi lokasi, find record hari ini, hitung `isEarlyOut`/`earlyOut/overtime/totalMinutes`, UPDATE clockOut. | `AttendanceRecord` | EMPLOYEE |
| `manualOverrideAction(input)` | `manualAttendanceSchema` (employeeId, date, clockIn "HH:MM", clockOut?, overrideReason) | Konversi WIB→UTC, UPSERT AttendanceRecord dengan `isManualOverride=true`, `overrideById`, `overrideReason`. Audit log. | `AttendanceRecord`, `OfficeLocation` (resolve), `AuditLog` | HR_ADMIN/SUPER_ADMIN |

#### B.6 `leave.actions.ts` — Cuti

| Action | Parameter | Operasi | Tabel | Permission |
|--------|-----------|---------|-------|------------|
| `submitLeaveAction(formData)` | `submitLeaveSchema` (leaveTypeId, startDate, endDate, reason) | Resolve employee dari session, hitung working days (skip weekend), ensure LeaveBalance, cek saldo cukup, resolve initial stage (PENDING_MANAGER atau PENDING_HR jika requester sendiri Manager/dept tidak ada Manager), CREATE LeaveRequest, audit. | `LeaveRequest`, `LeaveBalance`, `LeaveType`, `Employee`, `AuditLog` | EMPLOYEE aktif |
| `approveLeaveAction(input)` | `approveLeaveSchema` (leaveRequestId, notes?) | Atomic transaksi: jika `PENDING_MANAGER` → `PENDING_HR` (Manager same-dept only); jika `PENDING_HR` → `APPROVED` + decrement quota (LeaveBalance.usedDays += workingDays). Self-approval guard. Audit log. | `LeaveRequest`, `LeaveBalance`, `Employee`, `AuditLog` | MANAGER, HR_ADMIN, SUPER_ADMIN |
| `rejectLeaveAction(input)` | `rejectLeaveSchema` (leaveRequestId, notes wajib) | Update status ke `REJECTED` di stage manapun (Manager/HR sesuai perannya), tanpa touch LeaveBalance. Audit log. | `LeaveRequest`, `Employee`, `AuditLog` | MANAGER, HR_ADMIN, SUPER_ADMIN |
| `cancelLeaveAction(leaveRequestId)` | `id` | Verifikasi ownership; hanya boleh cancel jika `PENDING_*`. Set `CANCELLED`. | `LeaveRequest` | EMPLOYEE pemilik request |

#### B.7 `payroll.actions.ts` — Penggajian

| Action | Parameter | Operasi | Tabel | Permission |
|--------|-----------|---------|-------|------------|
| `importPayrollAction(formData)` | FormData: `month`, `year`, `file` (.xlsx/.xls/.csv) | (1) validasi periode + tipe file; (2) `parsePayrollWorkbook` (struktural — header, required text, numeric/int validation, no-negative, no-duplicate-NIK, hitung totals); (3) `matchRowsToEmployees` (NIK→Employee, exclude inactive); (4) `persistImportedPayroll` UPSERT PayrollRun (DRAFT) + replace entries. Throws jika periode FINALIZED. | `PayrollRun`, `PayrollEntry`, `Employee` | HR_ADMIN/SUPER_ADMIN |
| `finalizePayrollAction(input)` | `finalizePayrollSchema` (`payrollRunId`) | Transisi DRAFT → FINALIZED. Throw jika sudah finalized. | `PayrollRun` | HR_ADMIN/SUPER_ADMIN |

#### B.8 `recruitment.actions.ts` — Rekrutmen

Permission: HR_ADMIN/SUPER_ADMIN untuk SEMUA action.

| Action | Parameter | Operasi | Tabel |
|--------|-----------|---------|-------|
| `createVacancyAction(data)` | `createVacancySchema` (title, departmentId, description, requirements, openDate, closeDate?) | CREATE Vacancy + audit | `Vacancy`, `AuditLog` |
| `updateVacancyAction(id, data)` | `updateVacancySchema` | UPDATE Vacancy + audit | `Vacancy`, `AuditLog` |
| `toggleVacancyStatusAction(id)` | id | Toggle OPEN ↔ CLOSED + audit | `Vacancy`, `AuditLog` |
| `createCandidateAction(vacancyId, data)` | `createCandidateSchema` (name, email, phone?, notes?) | CREATE Candidate (stage default `MELAMAR`) + audit | `Candidate`, `AuditLog` |
| `updateCandidateStageAction(candidateId, data)` | `updateCandidateStageSchema` (stage) | UPDATE stage + audit | `Candidate`, `AuditLog` |
| `updateOfferAction(candidateId, data)` | `updateOfferSchema` (offerSalary?, offerNotes?) | UPDATE penawaran. (Tidak ada audit log di action ini — by design.) | `Candidate` |
| `createInterviewAction(candidateId, data)` | `createInterviewSchema` (scheduledAt, interviewerName?, notes?) | CREATE Interview row | `Interview`, `Candidate` (read) |
| `convertCandidateToEmployeeAction(candidateId)` | id | Validasi stage `DITERIMA`, set `hiredAt = now`, audit. Kembalikan `prefill` (fullName, email, phone, departmentId, cvPath, candidateId) — payload ini di-pack ke URL params saat redirect, dan `CreateEmployeeForm` membaca `useSearchParams()` untuk prefill `defaultValues` (Paket A). Konversi sebenarnya ke Employee dilakukan via `createEmployeeAction` setelah HR submit form. | `Candidate`, `AuditLog` |

---


---

## 3. Pages/Routes

Aplikasi menggunakan **Next.js App Router** dengan dua route group: `(auth)` untuk halaman publik (login) dan `(dashboard)` untuk halaman terproteksi yang memerlukan autentikasi. Route group dengan tanda kurung `(...)` tidak ikut menjadi bagian dari URL path — hanya berfungsi untuk mengelompokkan layout.

### 3.1 Root & Auth Group

#### 3.1.1 `/` — Root Redirect

| Aspek | Nilai |
|---|---|
| URL Path | `/` |
| Nama File | `src/app/page.tsx` |
| Komponen Utama | `redirect` dari `next/navigation` |
| Akses Role | (semua — non-authenticated juga) |
| Tipe | Server Component |

Halaman root tidak merender UI apa pun; hanya memanggil `redirect("/login")` untuk mengarahkan pengguna ke halaman login. Ini adalah halaman entry-point sederhana yang memastikan setiap akses ke domain tanpa path akan dipindahkan ke `/login`.

#### 3.1.2 Root Layout (`src/app/layout.tsx`)

| Aspek | Nilai |
|---|---|
| Nama File | `src/app/layout.tsx` |
| Komponen Utama | `AuthSessionProvider`, `NuqsAdapter`, `Toaster` |
| Tipe | Server Component (membungkus client provider) |

Root layout meng-define:
- Font lokal `GeistVF` dan `GeistMonoVF` via `next/font/local`.
- Metadata `title` = "HRMS PT. Sinergi Asta Nusantara", `description` = "Sistem Manajemen Sumber Daya Manusia".
- Bahasa HTML `id` (Indonesia).
- Wrapper urutan: `<AuthSessionProvider>` (NextAuth client-side session) → `<NuqsAdapter>` (URL state management) → children + `<Toaster />` (sonner notifications).

#### 3.1.3 Auth Layout (`src/app/(auth)/layout.tsx`)

| Aspek | Nilai |
|---|---|
| URL Path | (berlaku untuk semua child di group `(auth)`) |
| Nama File | `src/app/(auth)/layout.tsx` |
| Komponen Utama | div wrapper minimal |
| Akses Role | Public (tidak ada auth check) |
| Tipe | Server Component |

Layout sangat tipis: hanya `<div className="min-h-dvh bg-white">{children}</div>`. Tidak ada sidebar, header, atau auth gate — sesuai untuk halaman login yang harus dapat diakses tanpa session.

#### 3.1.4 `/login` — Halaman Login

| Aspek | Nilai |
|---|---|
| URL Path | `/login` |
| Nama File | `src/app/(auth)/login/page.tsx` |
| Komponen Utama | `Form`, `FormField`, `FormControl`, `FormMessage` (shadcn/react-hook-form), `Input`, `BrandPanel`, `MobileBrand`, `FeatureItem` |
| Library | `react-hook-form` + `@hookform/resolvers/zod`, `next-auth/react` (`signIn`), `lucide-react` icons |
| Akses Role | Public |
| Tipe | **Client Component** (`"use client"`) |

Halaman login menggunakan layout split-screen dua kolom (`grid lg:grid-cols-[1.05fr_1fr]`):
- Kolom kiri (`BrandPanel`): branding hijau emerald dengan gradient, daftar fitur (Absensi, Cuti, Slip Gaji), hanya tampil di `lg`.
- Kolom kanan: form login dengan field email + password (toggle show/hide), tombol submit dengan loading state.

Form di-validate via Zod schema `loginSchema` (dari `@/lib/validations/auth`). Submit memanggil `signIn("credentials", { email, password, redirect: false })` dari NextAuth, lalu pada sukses memanggil `router.push("/dashboard")` + `router.refresh()`. Error dikomunikasikan dengan banner role=alert "Email atau password salah".

### 3.2 Dashboard Group

#### 3.2.1 Dashboard Layout (`src/app/(dashboard)/layout.tsx`)

| Aspek | Nilai |
|---|---|
| Nama File | `src/app/(dashboard)/layout.tsx` |
| Komponen Utama | `Sidebar`, `Header`, `Breadcrumbs`, `SessionProvider` (wrapper) |
| Akses Role | Authenticated only (semua role) |
| Tipe | Server Component (async) — memanggil `auth()` |

Layout ini adalah **gerbang autentikasi tingkat dua** (selain middleware). Logikanya:

```ts
const session = await auth();
if (!session) {
  redirect("/login");
}
```

Struktur DOM: `<SessionProvider>` (client wrapper untuk `useSession`) → flex container fullscreen → `<Sidebar />` (fixed kiri di md+) → kolom kanan dengan `<Header />`, `<Breadcrumbs />`, dan `<main>` scrollable berisi `{children}`. Semua halaman di group `(dashboard)/` mewarisi struktur ini.

#### 3.2.2 `/dashboard` — Dashboard

| Aspek | Nilai |
|---|---|
| URL Path | `/dashboard` |
| Nama File | `src/app/(dashboard)/dashboard/page.tsx` |
| Komponen Utama | `SuperAdminDashboard`, `HRAdminDashboard`, `ManagerDashboard`, `EmployeeDashboard` (di-render kondisional per role) |
| Service | `getSuperAdminDashboardData`, `getHrAdminDashboardData`, `getManagerDashboardData`, `getEmployeeDashboardData` (dari `@/lib/services/dashboard.service`) |
| Akses Role | SUPER_ADMIN, HR_ADMIN, MANAGER, EMPLOYEE (semua) |
| Tipe | Server Component (async) |

Page-level check: `if (!session?.user) redirect("/login")`. Lalu switch berdasarkan `session.user.role` untuk merender komponen dashboard yang berbeda — masing-masing menerima data yang sudah dipre-fetch di server.

#### 3.2.3 `/attendance` — Absensi (self-service)

| Aspek | Nilai |
|---|---|
| URL Path | `/attendance` |
| Nama File | `src/app/(dashboard)/attendance/page.tsx` |
| Komponen Utama | `SummaryTile`, `AttendanceToday`, `AttendanceHistory` |
| Service | `getTodayRecord`, `getWeeklySummary`, `getEmployeeAttendance` (`@/lib/services/attendance.service`) |
| Akses Role | Semua role yang ber-Employee profile (SUPER_ADMIN, HR_ADMIN, MANAGER, EMPLOYEE) |
| Tipe | Server Component (async) |

Page-level check: `if (!session?.user) redirect("/login")`. Selanjutnya mencari `prisma.employee.findUnique({ where: { userId: session.user.id }})`. Jika tidak ada profil employee, ditampilkan empty state (tetap render, tidak redirect). Halaman menampilkan 5 KPI tile (status hari ini, hadir minggu ini, terlambat, rata-rata jam, lembur), card clock-in/out hari ini + kalender mingguan, dan tabel riwayat 7 hari terakhir.

#### 3.2.4 `/attendance-admin` — Admin Absensi

| Aspek | Nilai |
|---|---|
| URL Path | `/attendance-admin` |
| Nama File | `src/app/(dashboard)/attendance-admin/page.tsx` |
| Komponen Utama | `AttendanceFilters`, `AttendanceSummaryTable`, `ManualRecordDialog`, `ExportButtons`, `SummaryTile` |
| Service | `getMonthlyAttendanceRecap` |
| Akses Role | SUPER_ADMIN, HR_ADMIN, MANAGER |
| Tipe | Server Component (async) |

Page-level role check yang jelas:

```ts
if (!["HR_ADMIN", "SUPER_ADMIN", "MANAGER"].includes(role)) {
  redirect("/attendance");
}
```

Untuk MANAGER, query ditambahkan filter `departmentId` dari profil employee si manager — sehingga manager hanya melihat data departemen sendiri. Untuk HR/Super-Admin, melihat seluruh perusahaan dan mendapat tombol tambahan: `ManualRecordDialog` (input absensi manual) dan `ExportButtons` (Excel/CSV). Variabel `isHRAdmin = ["HR_ADMIN", "SUPER_ADMIN"].includes(role)` mengontrol kemunculan tombol-tombol tersebut.

#### 3.2.5 `/attendance-admin/[employeeId]` — Detail Absensi Karyawan

| Aspek | Nilai |
|---|---|
| URL Path | `/attendance-admin/[employeeId]` |
| Nama File | `src/app/(dashboard)/attendance-admin/[employeeId]/page.tsx` |
| Komponen Utama | `SummaryTile`, `AttendanceStatusBadges`, `AttendanceFilters`, `Table`, `Card`, `Badge`, `Button` |
| Service | `getMonthlyAttendanceRecap` |
| Akses Role | SUPER_ADMIN, HR_ADMIN, MANAGER (manager hanya departemen sendiri) |
| Tipe | Server Component (async) |

Selain role check umum yang sama dengan parent, halaman ini menambahkan **scope check khusus untuk MANAGER**: jika `managerEmployee.departmentId !== employee.departmentId`, redirect ke `/attendance-admin`. Halaman menampilkan rekap bulanan satu karyawan dengan KPI tiles (hari hadir, terlambat, rata-rata, total lembur) dan tabel detail per tanggal.

#### 3.2.6 `/audit-log` — Log Audit

| Aspek | Nilai |
|---|---|
| URL Path | `/audit-log` |
| Nama File | `src/app/(dashboard)/audit-log/page.tsx` |
| Komponen Utama | `SummaryTile`, `AuditLogFilters`, `AuditLogTable` |
| Service | `getAuditLogs`, `getAuditLogUsers`, `getAuditLogModules` |
| Akses Role | **SUPER_ADMIN only** |
| Tipe | Server Component (async) |

Page-level guard:

```ts
if (session.user.role !== "SUPER_ADMIN") {
  redirect("/dashboard");
}
```

Mendukung filter via search params (`userId`, `module`, `dateFrom`, `dateTo`, `page`, `pageSize`). Menghitung KPI: total entri, jumlah aksi CREATE/UPDATE/DELETE.

#### 3.2.7 `/audit-log/[id]` — Detail Log Audit

| Aspek | Nilai |
|---|---|
| URL Path | `/audit-log/[id]` |
| Nama File | `src/app/(dashboard)/audit-log/[id]/page.tsx` |
| Komponen Utama | `Card`, `DiffView` (lokal), badges, ikon Lucide |
| Service | `getAuditLogById` |
| Akses Role | **SUPER_ADMIN only** |
| Tipe | Server Component (async) |

Sama dengan parent, hanya Super Admin yang bisa akses. Menampilkan diff `oldValue` vs `newValue` dengan status per-field: added/removed/changed/unchanged. Aksi (CREATE/UPDATE/DELETE) ditandai dengan warna khusus (emerald/sky/rose).

#### 3.2.8 `/employees` — Daftar Karyawan

| Aspek | Nilai |
|---|---|
| URL Path | `/employees` |
| Nama File | `src/app/(dashboard)/employees/page.tsx` |
| Komponen Utama | `EmployeeTable`, `EmployeeFilters`, `SummaryTile`, `Button` (Tambah Karyawan) |
| Service | `getEmployees`, `getEmployeesForManager`, `getEmployeeStatsSummary`, `getEmployeeByUserId`, `getAllDepartments`, `getAllPositions` |
| Akses Role | SUPER_ADMIN, HR_ADMIN, MANAGER, EMPLOYEE (logika berbeda) |
| Tipe | Server Component (async) |

Akses kompleks per-role:
- **EMPLOYEE**: tidak melihat list. Halaman langsung redirect ke `/employees/{ownEmployeeId}` jika punya profil; jika tidak, tampilkan pesan "Profil karyawan tidak ditemukan."
- **MANAGER**: data di-filter via `getEmployeesForManager(userId)` (hanya departemen manager). Filter `departmentId` di-disable di UI (`isManager={true}` dilewatkan ke `EmployeeFilters`). Filter posisi di-scope ke posisi-posisi di departemen manager saja.
- **HR_ADMIN, SUPER_ADMIN**: pakai `getEmployees()` tanpa scope, dan tombol "Tambah Karyawan" muncul (`canCreate = role === "HR_ADMIN" || role === "SUPER_ADMIN"`).

Filter via searchParams: `page`, `search`, `departmentId`, `positionId`, `isActive`, `contractType`. KPI tiles: aktif, PKWT, PKWTT, baru bulan ini, nonaktif.

#### 3.2.9 `/employees/new` — Tambah Karyawan

| Aspek | Nilai |
|---|---|
| URL Path | `/employees/new` |
| Nama File | `src/app/(dashboard)/employees/new/page.tsx` |
| Komponen Utama | `CreateEmployeeForm`, `Button` |
| Service | `getAllDepartments`, `getAllPositions` |
| Akses Role | SUPER_ADMIN, HR_ADMIN |
| Tipe | Server Component (async) |

Page-level check: `if (role !== "HR_ADMIN" && role !== "SUPER_ADMIN") redirect("/employees")`. Memuat list departemen + posisi untuk dropdown form. `CreateEmployeeForm` adalah client component (mengandung server action submit).

#### 3.2.10 `/employees/[id]` — Detail/Edit Karyawan

| Aspek | Nilai |
|---|---|
| URL Path | `/employees/[id]` |
| Nama File | `src/app/(dashboard)/employees/[id]/page.tsx` |
| Komponen Utama | `EmployeeProfileTabs`, `DeactivateEmployeeDialog`, `Avatar`, `Badge`, `Card`, `Separator` |
| Service | `getEmployeeById`, `getEmployeeByUserId`, `canManagerAccessEmployee`, `getAllDepartments`, `getAllPositions` |
| Akses Role | Bertingkat per role (lihat di bawah) |
| Tipe | Server Component (async) |

Logika akses sangat granular:
- **EMPLOYEE**: hanya boleh melihat profilnya sendiri. Mengambil `getEmployeeByUserId(session.user.id)`; jika `ownEmployee.id !== id` → redirect `/dashboard`. Mode = `readonly`.
- **MANAGER**: pakai `canManagerAccessEmployee(userId, employeeId)` — boleh akses jika employee target ada di departemennya. Jika tidak, redirect `/employees`. Mode = `readonly`.
- **HR_ADMIN, SUPER_ADMIN**: bebas akses semua karyawan. Mode = `edit` (form-form di tab dapat di-edit + tombol Deactivate muncul jika employee aktif).

Tab UI (`EmployeeProfileTabs`) menampilkan beberapa tab: profil/identitas, kontrak, dokumen, kontak darurat. Property `mode` ("edit" | "readonly") diteruskan ke tabs dan menentukan apakah field input enabled.

#### 3.2.11 `/leave` — Cuti (self-service)

| Aspek | Nilai |
|---|---|
| URL Path | `/leave` |
| Nama File | `src/app/(dashboard)/leave/page.tsx` |
| Komponen Utama | `LeaveBalanceCard`, `LeaveRequestSection`, `LeaveHistoryTable`, `SummaryTile` |
| Service | `getLeaveBalances`, `getLeaveRequests`, `ensureLeaveBalances` |
| Akses Role | Semua role yang punya Employee profile |
| Tipe | Server Component (async) |

Hanya `if (!session?.user) redirect("/login")` di level halaman. Lalu cari `prisma.employee` by `userId` — jika tidak ada, tampilkan empty state. Memanggil `ensureLeaveBalances(employee.id)` (idempotent) untuk memastikan saldo cuti tahun berjalan sudah dibuat. Lalu fetch balances + requests tahun berjalan. KPI: sisa cuti, terpakai, menunggu approval, total alokasi.

#### 3.2.12 `/leave/manage` — Kelola Cuti (approval)

| Aspek | Nilai |
|---|---|
| URL Path | `/leave/manage` |
| Nama File | `src/app/(dashboard)/leave/manage/page.tsx` |
| Komponen Utama | `LeaveApprovalTable`, `SummaryTile` |
| Service | `getLeaveRequests` |
| Akses Role | SUPER_ADMIN, HR_ADMIN, MANAGER |
| Tipe | Server Component (async) |

Page-level check: `if (!["HR_ADMIN", "SUPER_ADMIN", "MANAGER"].includes(role)) redirect("/leave")`. Default filter berbeda per-role:
- MANAGER: default status `PENDING_MANAGER` (queue manager).
- HR_ADMIN/SUPER_ADMIN: default status `PENDING_HR` (queue HR).

Untuk MANAGER, request di-scope by `departmentId` (dari profile employee). KPI: menunggu (aktor), disetujui, ditolak, dibatalkan.

#### 3.2.13 `/leave/report` — Laporan Cuti

| Aspek | Nilai |
|---|---|
| URL Path | `/leave/report` |
| Nama File | `src/app/(dashboard)/leave/report/page.tsx` |
| Komponen Utama | `LeaveReportKpiCards`, `LeaveReportFilters`, `LeaveReportTrendChart`, `Table` (summary per karyawan) |
| Service | `getLeaveRequests` (current year + prior year), `prisma.department.findMany` |
| Akses Role | SUPER_ADMIN, HR_ADMIN |
| Tipe | Server Component (async) |

Page-level check: `if (!["HR_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) redirect("/leave")`. Filter via searchParams: `year`, `departmentId`. Menghitung KPI (jumlah employee yang cuti, hari approved, pending, rejected) untuk tahun current dan tahun prior (untuk perbandingan). Tren bulanan disusun ke buckets `MONTH_LABELS` (12 bulan). Tabel ringkasan per karyawan dengan inline bar untuk visualisasi hari yang disetujui.

#### 3.2.14 `/master-data` — Data Master

| Aspek | Nilai |
|---|---|
| URL Path | `/master-data` |
| Nama File | `src/app/(dashboard)/master-data/page.tsx` |
| Komponen Utama | `MasterDataTabs` (tabs: Departemen, Jabatan, Lokasi Kantor, Jenis Cuti) |
| Akses Role | **SUPER_ADMIN only** |
| Tipe | Server Component (async) |

Page-level guard:

```ts
if (session.user.role !== "SUPER_ADMIN") {
  redirect("/dashboard");
}
```

Hanya Super Admin yang dapat mengelola data master inti sistem (CRUD departemen, jabatan, lokasi kantor + workhours, jenis cuti).

#### 3.2.15 `/payroll` — Penggajian

| Aspek | Nilai |
|---|---|
| URL Path | `/payroll` |
| Nama File | `src/app/(dashboard)/payroll/page.tsx` |
| Komponen Utama | `ImportPayrollForm`, `SummaryTile`, `Table` (riwayat run), `Badge` |
| Service | `getPayrollRuns` |
| Akses Role | SUPER_ADMIN, HR_ADMIN |
| Tipe | Server Component (async) |

Page-level check: `if (!["HR_ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/dashboard")`. Halaman ini adalah hub untuk pivot penggajian Excel-import:
- Form di atas (`ImportPayrollForm`) untuk upload Excel/CSV penggajian baru.
- Tabel riwayat semua `PayrollRun` (status DRAFT atau FINALIZED).

KPI: total periode, difinalisasi, draft, periode terbaru.

#### 3.2.16 `/payroll/[periodId]` — Detail Periode Penggajian

| Aspek | Nilai |
|---|---|
| URL Path | `/payroll/[periodId]` |
| Nama File | `src/app/(dashboard)/payroll/[periodId]/page.tsx` |
| Komponen Utama | `PayrollEntryTable`, `FinalizeButton`, `SummaryTile`, `Badge` |
| Service | `getPayrollRunDetail` |
| Akses Role | SUPER_ADMIN, HR_ADMIN |
| Tipe | Server Component (async) |

Page-level check sama dengan parent. Data `PayrollEntry` (Prisma Decimal fields) di-serialize ke Number untuk client component. KPI: jumlah karyawan, total earnings, total deductions, total take home pay (dengan format Rupiah compact). Tombol `FinalizeButton` muncul hanya jika `run.status === "DRAFT"`.

#### 3.2.17 `/payslip` — Slip Gaji

| Aspek | Nilai |
|---|---|
| URL Path | `/payslip` |
| Nama File | `src/app/(dashboard)/payslip/page.tsx` |
| Komponen Utama | `SummaryTile`, `Table`, `Badge`, `<a>` link ke API `/api/payroll/payslip/{entryId}` |
| Akses Role | SUPER_ADMIN, HR_ADMIN, MANAGER, EMPLOYEE (split logic) |
| Tipe | Server Component (async) |

Memiliki **dua mode tampilan**:

1. **Admin view (HR_ADMIN / SUPER_ADMIN)**: query semua `PayrollEntry` di periode FINALIZED, tampilkan tabel lengkap dengan kolom Periode/NIK/Nama/Status/Aksi (Unduh PDF). KPI: Total slip, Periode (count distinct), Karyawan (count distinct), Periode terbaru.
2. **Self view (EMPLOYEE / MANAGER)**: query `PayrollEntry` hanya milik sendiri (filter `employeeId`). KPI: total slip tersedia, periode terbaru, periode terlama. Tampilan tabel disederhanakan (tanpa kolom NIK/Nama).

Untuk download, link ke endpoint API route `/api/payroll/payslip/{entryId}` (PDF generation).

#### 3.2.18 `/recruitment` — Rekrutmen

| Aspek | Nilai |
|---|---|
| URL Path | `/recruitment` |
| Nama File | `src/app/(dashboard)/recruitment/page.tsx` |
| Komponen Utama | `VacancyTable`, `SummaryTile`, `Button` (Buat Lowongan) |
| Service | `getVacanciesWithPipeline`, `getRecruitmentStatsSummary` |
| Akses Role | SUPER_ADMIN, HR_ADMIN |
| Tipe | Server Component (async) |

Page-level check: `if (role !== "HR_ADMIN" && role !== "SUPER_ADMIN") redirect("/dashboard")`. Filter via searchParams: `status` (OPEN/CLOSED). KPI: lowongan aktif, ditutup, total kandidat, interview terjadwal, hired bulan ini.

#### 3.2.19 `/recruitment/new` — Buat Lowongan

| Aspek | Nilai |
|---|---|
| URL Path | `/recruitment/new` |
| Nama File | `src/app/(dashboard)/recruitment/new/page.tsx` |
| Komponen Utama | `CreateVacancyForm`, `Button` |
| Service | `prisma.department.findMany` |
| Akses Role | SUPER_ADMIN, HR_ADMIN |
| Tipe | Server Component (async) |

Sama dengan parent, role check 2-tier (auth + role), lalu render form pembuatan vacancy.

#### 3.2.20 `/recruitment/[vacancyId]` — Detail Lowongan + Pipeline Kanban

| Aspek | Nilai |
|---|---|
| URL Path | `/recruitment/[vacancyId]` |
| Nama File | `src/app/(dashboard)/recruitment/[vacancyId]/page.tsx` |
| Komponen Utama | `KanbanBoard`, `AddCandidateDialog`, `Card`, `Badge`, `Separator`, `MetaItem` (lokal) |
| Service | `getVacancyById` |
| Akses Role | SUPER_ADMIN, HR_ADMIN |
| Tipe | Server Component (async) |

Kanban dengan 6 stage: MELAMAR, SELEKSI_BERKAS, INTERVIEW, PENAWARAN, DITERIMA, DITOLAK. Pipeline summary menampilkan 4 stage aktif (kecuali DITERIMA & DITOLAK). Kanban interaktif (drag-and-drop) di-implement di `KanbanBoard` (client).

#### 3.2.21 `/recruitment/candidates/[candidateId]` — Detail Kandidat

| Aspek | Nilai |
|---|---|
| URL Path | `/recruitment/candidates/[candidateId]` |
| Nama File | `src/app/(dashboard)/recruitment/candidates/[candidateId]/page.tsx` |
| Komponen Utama | `CandidateDetailClient` (client wrapper) |
| Service | `getCandidateById` |
| Akses Role | SUPER_ADMIN, HR_ADMIN |
| Tipe | Server Component (async) |

Page server-only mengambil data, men-serialize Date dan Decimal (`offerSalary`) ke string, lalu pass ke `CandidateDetailClient` yang menangani interaksi (pindah stage, schedule interview, hire).

#### 3.2.22 `/users` — Manajemen Pengguna

| Aspek | Nilai |
|---|---|
| URL Path | `/users` |
| Nama File | `src/app/(dashboard)/users/page.tsx` |
| Komponen Utama | `UserTable`, `UserPageHeader` |
| Service | `getUsers` |
| Akses Role | **SUPER_ADMIN only** |
| Tipe | Server Component (async) |

Page-level guard: `if (session.user.role !== "SUPER_ADMIN") redirect("/dashboard")`. Hanya Super Admin yang dapat mengelola user account (create, change role, deactivate). `UserPageHeader` mengandung dialog "Tambah Pengguna".

### 3.3 Ringkasan Karakteristik Halaman

- **Total halaman page.tsx**: 22 (1 root + 1 login + 20 dashboard).
- **Total layout.tsx**: 3 (root, auth group, dashboard group).
- **Hampir semua halaman dashboard adalah Server Components** (async function, panggil `auth()` dan service Prisma langsung). Hanya `/login` yang explicit `"use client"`.
- **Pattern role check** seragam: panggil `auth()` → cek `session?.user` → cek `session.user.role` → redirect target sesuai role yang seharusnya bisa akses.
- **Dynamic routes** menggunakan `params: Promise<{ ... }>` dan `searchParams: Promise<{ ... }>` (Next.js 15 async params).

---


---

## 4. Role & Access Control

### 4.1 Definisi Role

Sistem memiliki 4 role yang didefinisikan di Prisma schema (`prisma/schema.prisma`):

```prisma
enum Role {
  SUPER_ADMIN
  HR_ADMIN
  MANAGER
  EMPLOYEE
}
```

Versi client-safe ada di `src/types/enums.ts`:

```ts
export const Role = {
  SUPER_ADMIN: "SUPER_ADMIN",
  HR_ADMIN: "HR_ADMIN",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
} as const;
export type Role = (typeof Role)[keyof typeof Role];
```

Konvensi: enum literal **harus dalam UPPER_SNAKE_CASE** (sesuai Prisma).

### 4.2 Profil Setiap Role

#### 4.2.1 SUPER_ADMIN

Role tertinggi dengan akses ke semua modul, termasuk modul administratif yang khusus untuk dirinya saja.

**Halaman yang bisa diakses (dari sidebar.tsx):**
- Dashboard
- Karyawan (list + detail + create + edit)
- Rekrutmen + Buat Lowongan + Detail Vacancy + Detail Kandidat
- Absensi (self) + Admin Absensi + Detail Karyawan Absensi
- Cuti (self) + Kelola Cuti + Laporan Cuti
- Penggajian + Detail Periode
- Slip Gaji (admin view, semua karyawan)
- **Pengguna** (eksklusif)
- **Data Master** (eksklusif)
- **Log Audit** + Detail Log Audit (eksklusif)

**Aksi yang bisa dilakukan:**
- Employee: CRUD + deactivate, akses semua data tanpa scope.
- Attendance: lihat semua, manual record, export, edit.
- Leave: lihat semua, approve/reject di stage HR.
- Payroll: import Excel, lihat semua periode, finalize.
- Recruitment: CRUD vacancy, kelola kandidat, hire.
- Master Data: CRUD departemen, jabatan, lokasi, jenis cuti.
- User Management: CRUD user, ubah role.
- Audit Log: read-only, semua entri.

#### 4.2.2 HR_ADMIN

Role administratif HR — akses operasional ke semua modul SDM kecuali yang eksklusif Super Admin.

**Halaman yang bisa diakses:**
- Dashboard
- Karyawan (list + detail + create + edit)
- Rekrutmen + semua sub-page
- Absensi (self) + Admin Absensi + Detail
- Cuti (self) + Kelola Cuti + Laporan Cuti
- Penggajian + Detail
- Slip Gaji (admin view)

**Tidak bisa akses:** Pengguna, Data Master, Log Audit.

**Aksi yang bisa dilakukan:**
- Employee: CRUD + deactivate (sama dengan SUPER_ADMIN).
- Attendance: sama dengan SUPER_ADMIN (manual record, export).
- Leave: lihat semua, approve di stage HR (PENDING_HR).
- Payroll: import Excel, finalize.
- Recruitment: CRUD vacancy, kelola kandidat.

#### 4.2.3 MANAGER

Role middle-management — terbatas pada departemennya sendiri.

**Halaman yang bisa diakses:**
- Dashboard
- Karyawan (list di-scope ke departemennya, detail readonly)
- Absensi (self) + Admin Absensi (di-scope departemen) + Detail (hanya karyawan di departemennya)
- Cuti (self) + Kelola Cuti (queue PENDING_MANAGER, scope departemen)
- Slip Gaji (self only, sama dengan EMPLOYEE)

**Tidak bisa akses:** Rekrutmen, Laporan Cuti, Penggajian (admin), Pengguna, Data Master, Log Audit.

**Aksi yang bisa dilakukan:**
- Employee: read-only di departemen sendiri, tidak bisa edit/create.
- Attendance: lihat departemen, tidak bisa manual record / export.
- Leave: approve/reject di stage `PENDING_MANAGER` untuk karyawan departemennya. Setelah approve, status jadi `PENDING_HR`.
- Slip Gaji: download milik sendiri.

#### 4.2.4 EMPLOYEE

Role end-user (karyawan biasa) — akses self-service.

**Halaman yang bisa diakses:**
- Dashboard
- Karyawan: hanya redirect ke `/employees/{ownId}` (detail readonly profil sendiri)
- Absensi (self): clock-in, clock-out, lihat history sendiri
- Cuti (self): ajukan cuti, lihat saldo, lihat history
- Slip Gaji (self): download slip sendiri

**Tidak bisa akses:** Admin Absensi, Kelola Cuti, Laporan Cuti, Rekrutmen, Penggajian (admin), Pengguna, Data Master, Log Audit.

**Aksi yang bisa dilakukan:**
- Lihat profil sendiri (read-only).
- Clock-in / Clock-out (jika lokasi kantor & waktu valid).
- Submit leave request.
- Cancel leave request sendiri yang masih PENDING.
- Download slip gaji sendiri (periode FINALIZED).

### 4.3 Mekanisme Pengecekan Role

Sistem menerapkan **defense in depth** dengan 4 lapis pengecekan:

#### Lapis 1 — `middleware.ts` (Edge Runtime)

```ts
import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

export default NextAuth(authConfig).auth

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
```

Middleware berjalan di **Edge Runtime** untuk setiap request kecuali `api/auth/*`, asset Next, favicon. Callback `authorized` di `auth.config.ts` memutuskan:

```ts
authorized({ auth, request: { nextUrl } }) {
  const isLoggedIn = !!auth?.user
  const isPublicPath =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/api/auth")

  if (isPublicPath) return true
  if (isLoggedIn) return true

  // Redirect unauthenticated users to /login
  return false
}
```

Logic-nya: path publik (`/login`, `/api/auth/*`) selalu lolos; path lain butuh user login. Jika tidak login, return `false` → NextAuth otomatis redirect ke `pages.signIn` = `/login`. **Catatan**: middleware **TIDAK mengecek role** — hanya autentikasi.

#### Lapis 2 — Layout Auth Gate (`(dashboard)/layout.tsx`)

```ts
const session = await auth();
if (!session) {
  redirect("/login");
}
```

Layout dashboard adalah server component yang memastikan setiap render halaman dashboard memiliki session valid. Backup safety net di atas middleware.

#### Lapis 3 — Page-level Role Check

Hampir semua page server component melakukan dua check:

```ts
const session = await auth();
if (!session?.user) redirect("/login");

const role = session.user.role;
if (!["HR_ADMIN", "SUPER_ADMIN"].includes(role)) {
  redirect("/dashboard");
}
```

Ini memastikan pengguna dengan role yang tidak punya hak akses akan dilempar ke halaman yang sesuai (dashboard / login / fallback). Lihat contoh granular di `/employees/[id]/page.tsx` yang membedakan mode "edit" vs "readonly" berdasarkan role.

#### Lapis 4 — Server Action / Service Layer

Server actions dan service functions di `src/lib/services/*` melakukan pengecekan role/scope sebelum mengeksekusi operasi DB. Contoh (`canManagerAccessEmployee(userId, employeeId)`) mem-validate bahwa manager hanya boleh akses employee di departemennya.

#### Lapis 5 — Sidebar Filter (UI)

Di `src/components/layout/sidebar.tsx`, fungsi `getFilteredGroups(role)` memfilter item navigasi berdasarkan property `roles: Role[]` per item. Ini bukan security boundary (bisa di-bypass dengan langsung type URL), tapi memastikan UX bersih: user hanya melihat menu yang relevan.

Contoh definisi item:

```ts
{
  label: "Log Audit",
  href: "/audit-log",
  icon: FileText,
  roles: ["SUPER_ADMIN"],
},
```

### 4.4 Matrix Role × Modul

Notasi:
- **R** = Read (lihat)
- **W** = Write (create/update)
- **D** = Delete / Deactivate
- **A** = Approve (untuk workflow approval)
- **S** = Self-service only (terbatas data sendiri)
- **Sd** = Scoped to department
- **—** = Tidak ada akses

| Modul | SUPER_ADMIN | HR_ADMIN | MANAGER | EMPLOYEE |
|---|---|---|---|---|
| **Dashboard** | R (super-admin view) | R (hr view) | R (manager view) | R (employee view) |
| **Employee — list** | R, W, D | R, W, D | R (Sd) | — (redirect ke profil sendiri) |
| **Employee — detail** | R, W (edit) | R, W (edit) | R (Sd, readonly) | R (S, readonly) |
| **Employee — create** | W | W | — | — |
| **Employee — deactivate** | D | D | — | — |
| **Attendance — self (clock in/out, history)** | R, W (S) | R, W (S) | R, W (S) | R, W (S) |
| **Attendance — admin (rekap bulanan)** | R | R | R (Sd) | — |
| **Attendance — manual record** | W | W | — | — |
| **Attendance — export** | R (export) | R (export) | — | — |
| **Attendance — detail karyawan** | R | R | R (Sd) | — |
| **Leave — self (ajukan, lihat saldo, history)** | R, W (S) | R, W (S) | R, W (S) | R, W (S) |
| **Leave — manage (approve/reject)** | A (stage HR) | A (stage HR) | A (stage Manager, Sd) | — |
| **Leave — cancel own request** | W (S) | W (S) | W (S) | W (S) |
| **Leave — report** | R | R | — | — |
| **Payroll — import Excel** | W | W | — | — |
| **Payroll — list runs** | R | R | — | — |
| **Payroll — finalize** | W | W | — | — |
| **Payroll — detail entries** | R | R | — | — |
| **Payslip — admin view (semua karyawan)** | R (download) | R (download) | — | — |
| **Payslip — self download** | R (S) | R (S) | R (S) | R (S) |
| **Recruitment — vacancies** | R, W, D | R, W, D | — | — |
| **Recruitment — candidates** | R, W, D | R, W, D | — | — |
| **Recruitment — kanban / change stage** | W | W | — | — |
| **Master Data — departemen** | R, W, D | — | — | — |
| **Master Data — jabatan** | R, W, D | — | — | — |
| **Master Data — lokasi kantor** | R, W, D | — | — | — |
| **Master Data — jenis cuti** | R, W, D | — | — | — |
| **User Management — list, create, role** | R, W, D | — | — | — |
| **Audit Log — list & detail** | R | — | — | — |

### 4.5 Catatan Implementasi

- **Sidebar items** untuk MANAGER tidak menampilkan: Rekrutmen, Laporan Cuti, Penggajian, Pengguna, Data Master, Log Audit (mengacu `roles` array di setiap NavItem).
- **Sidebar items** untuk EMPLOYEE tidak menampilkan: Admin Absensi, Kelola Cuti, Laporan Cuti, Rekrutmen, Penggajian, Pengguna, Data Master, Log Audit.
- Halaman `/employees` untuk EMPLOYEE bersifat unik: bukan menampilkan list, melainkan auto-redirect ke `/employees/{ownId}` agar UX konsisten dari sidebar.
- Halaman `/payslip` mendeteksi role di runtime dan men-render dua tampilan berbeda (admin / self) dalam satu file.
- Untuk MANAGER, scope ke departemen di-derive dari `prisma.employee.findUnique({ where: { userId: session.user.id }})` di setiap halaman (tidak di-cache di session).

---


---

## 5. Alur Proses Bisnis Setiap Fitur

Catatan global: hampir semua mutation di sistem mengikuti pola berikut:

1. Client (form/dialog) memanggil **Server Action** (`src/lib/actions/*.actions.ts`).
2. Action panggil `auth()` → ambil session NextAuth → cek role.
3. Action validasi input via Zod schema (`src/lib/validations/*.ts`).
4. Action delegasi ke **Service** (`src/lib/services/*.ts`) yang berinteraksi dengan Prisma.
5. Setelah mutasi sukses → `createAuditLog(...)` dipanggil untuk simpan jejak audit.
6. `revalidatePath(...)` dipanggil agar Next.js refresh data di halaman terkait.
7. Action mengembalikan `{ success: true }` atau `{ success: false, error: "…" }` ke client.

Setiap modul di bawah mengikuti pola ini kecuali disebutkan eksplisit.

---

### 5.1 Authentication & Login

**Aktor**: Semua user (SUPER_ADMIN, HR_ADMIN, MANAGER, EMPLOYEE).

**Step-by-step**:

1. User buka URL aplikasi (`/`).
2. `src/app/page.tsx` redirect ke `/login` jika tidak ada session, atau ke `/dashboard` jika sudah login.
3. Halaman `/login` (route group `(auth)`) menampilkan form 2-pane (login form + branding).
4. User isi email + password → submit form di `src/app/(auth)/login/page.tsx`.
5. Submit memanggil `signIn("credentials", { email, password, redirect: false })` dari `next-auth/react`.
6. NextAuth memanggil `authorize()` callback di `src/lib/auth.ts`:
   - `prisma.user.findUnique({ where: { email } })`.
   - Jika user tidak ada atau `isActive === false` → return `null` (gagal).
   - `bcrypt.compare(password, user.hashedPassword)` → jika gagal return `null`.
   - Jika sukses, return `{ id, name, email, role }`.
7. JWT callback meng-attach `role` & `id` ke token.
8. Session callback meng-attach `role` & `id` ke session.user.
9. Client menerima response sukses → redirect ke `/dashboard`.

**Decision points**:
- Email tidak terdaftar / password salah → toast error "Email atau password salah".
- User non-aktif → toast error "Akun tidak aktif, hubungi admin".

**Validasi**:
- Client-side: Zod `loginSchema` (email format + password min length).
- Server-side: bcrypt compare.

**Status flow**: tidak ada (single transaction).

**Logout**: Tombol di header → `signOut({ callbackUrl: "/login" })` → cookie session di-clear.

---

### 5.2 Employee Management

**Aktor**: HR_ADMIN, SUPER_ADMIN (CRUD penuh); MANAGER (read-only di departemennya); EMPLOYEE (lihat profil sendiri).

#### 5.2.1 Create Employee
1. HR klik "Tambah Karyawan" di `/employees` → navigate ke `/employees/new`.
2. Form `CreateEmployeeForm` ditampilkan (multi-section: Personal, Employment, Tax/BPJS, Initial Password).
3. Submit form memanggil `createEmployeeAction(formData)`.
4. Action cek role HR_ADMIN/SUPER_ADMIN.
5. Validasi via `createEmployeeSchema` (Zod).
6. Service `createEmployee()`:
   - Buka `prisma.$transaction`.
   - Cek email unique di table `users`.
   - **Generate NIK**: format `EMP-{YYYY}-{4-digit seq}`, ambil terakhir dengan prefix tahun ini, increment.
   - Hash password dengan `bcrypt.hash(password, 12)`.
   - Buat `User` dengan role EMPLOYEE.
   - Buat `Employee` linked ke User.
7. AuditLog action=CREATE module="Karyawan" disimpan.
8. `revalidatePath("/employees")` → list refresh.
9. Redirect ke `/employees/[id]` (detail page baru).

**Validasi penting**:
- Email harus unique global.
- NIK auto-generated (tidak bisa diisi user).
- `joinDate` ≤ hari ini.
- Department & Position harus valid (refer ke master data).

#### 5.2.2 Update Employee (4 tabs)
Halaman `/employees/[id]` menampilkan `EmployeeProfileTabs` dengan 5 tab: Personal Info, Employment, Tax/BPJS, Documents, Emergency Contacts.

- **Personal Info Tab** → `updatePersonalInfoAction(employeeId, formData)` → update nama, NIK KTP, tempat/tanggal lahir, jenis kelamin, status pernikahan, agama, alamat, HP.
- **Employment Tab** → `updateEmploymentAction(employeeId, formData)` → update departmentId, positionId, contractType (PKWT/PKWTT), joinDate, officeLocationId.
- **Tax/BPJS Tab** → `updateTaxBpjsAction(employeeId, formData)` → update NPWP, ptkpStatus, BPJS Kesehatan No, BPJS Ketenagakerjaan No, isTaxBorneByCompany flag.

Setiap update:
1. Service load `old` data terlebih dahulu untuk `oldValue` di audit log.
2. `prisma.employee.update(...)`.
3. `createAuditLog` dengan oldValue + newValue (bisa lihat diff di audit log detail).
4. `revalidatePath("/employees")`.

#### 5.2.3 Documents Tab
- Upload via `EmployeeDocumentForm` → POST `/api/employees/[id]/documents` (multipart) → simpan ke local filesystem (`<projectRoot>/uploads/employees/<employeeId>/<timestamp>-<sanitized-filename>`) via `fs/promises.writeFile`, lalu insert `EmployeeDocument` row dengan `filePath` berupa relative path.
- Delete via DELETE `/api/employees/[id]/documents/[docId]` → `fs/promises.unlink` file di disk + delete row (best-effort: kalau file sudah hilang dari disk, DB tetap dibersihkan).
- Lihat detail di section 7 dump-part1.

#### 5.2.4 Emergency Contacts
- Max 3 kontak per karyawan (validasi di `createEmergencyContactAction`).
- CRUD di tab terpisah → action `createEmergencyContactAction`, `updateEmergencyContactAction`, `deleteEmergencyContactAction`.

#### 5.2.5 Deactivate Employee
1. HR klik "Nonaktifkan" → buka dialog dengan input `terminationDate` + `terminationReason`.
2. Submit panggil `deactivateEmployeeAction(employeeId, formData)`.
3. Service `deactivateEmployee()`:
   - Validasi karyawan masih aktif (`isActive=true`), error "Karyawan sudah tidak aktif" jika tidak.
   - Transaction: set `Employee.isActive=false`, `terminationDate`, `terminationReason`. Set juga `User.isActive=false` agar tidak bisa login.
4. AuditLog action=UPDATE.
5. `revalidatePath("/employees")`.

**Status flow Employee**:
```
ACTIVE (isActive=true) → INACTIVE (isActive=false, terminationDate, terminationReason)
```
Tidak bisa kembali ke ACTIVE setelah dinonaktifkan (one-way).

---

### 5.3 Attendance

**Aktor**: EMPLOYEE (clock-in/clock-out dirinya), HR_ADMIN/SUPER_ADMIN (manual override).

#### 5.3.1 Clock-In
1. Karyawan buka `/attendance` → `AttendanceToday` tampilkan tombol Clock-In jika belum absen.
2. Klik tombol → browser request `geolocation.getCurrentPosition()`.
3. Browser kirim `coords` ke `clockInAction(coords)`.
4. Action `auth()` → cek session.
5. Ambil IP client dari header `x-forwarded-for` atau `x-real-ip`.
6. Load `Employee` include `officeLocation`.
7. **Validasi**:
   - Jika tidak ada profile karyawan → "Profil karyawan tidak ditemukan".
   - Jika `isActive=false` → "Akun karyawan tidak aktif".
   - Jika `officeLocation === null` → "Lokasi kantor belum dikonfigurasi".
8. **`verifyLocation(clientIp, coords, officeLocation)`** di `location.service.ts`:
   - Jika `officeLocation.allowedIPs.length > 0` → cek IP via `ip-range-check` (CIDR match). Jika gagal → return `{ allowed: false, reason: "IP tidak terdaftar" }`.
   - Jika `officeLocation.latitude/longitude` ada → hitung haversine distance ke `coords`. Jika > `radiusMeters` → return gagal.
   - Jika kedua null/empty → langsung allowed (development mode).
9. Hitung `nowJkt` = UTC + 7 hours via `toZonedTime(nowUtc, "Asia/Jakarta")`.
10. **`calculateAttendanceFlags`** di `attendance.service.ts`:
    - Hitung `isLate` (clockIn > scheduleStart? difference > 0?), `lateMinutes`.
11. `prisma.attendanceRecord.create({ employeeId, officeLocationId, date, clockIn, clockInIp, clockInLat, clockInLon, isLate, lateMinutes })`.
12. Jika P2002 (unique constraint `[employeeId, date]`) → "Anda sudah melakukan absen masuk hari ini".
13. `revalidatePath("/attendance")` → UI refresh menampilkan status sudah absen.

#### 5.3.2 Clock-Out
1. Sama validasi: session, employee, IP, location.
2. Cari `AttendanceRecord` untuk hari ini via `findUnique({ employeeId_date })`.
3. Jika tidak ada → "Absen masuk belum tercatat hari ini".
4. Jika `record.clockOut` sudah ada → "Anda sudah melakukan absen pulang".
5. Re-hitung `calculateAttendanceFlags(record.clockIn, nowUtc, scheduleStart, scheduleEnd)` → dapatkan `isEarlyOut`, `earlyOutMinutes`, `overtimeMinutes`, `totalMinutes`.
6. `prisma.attendanceRecord.update({ id: record.id }, data: { clockOut, clockOutIp, isEarlyOut, ... })`.

**Status flow Attendance per hari**:
```
NO_RECORD → CLOCKED_IN (clockIn set, clockOut null) → COMPLETED (clockIn + clockOut keduanya set)
```

Status enum (derivable, untuk display):
- `ON_TIME` — !isLate && !isEarlyOut && overtime=0
- `LATE` — isLate
- `EARLY_OUT` — isEarlyOut
- `OVERTIME` — overtimeMinutes ≥ threshold
- `LATE_AND_EARLY_OUT`, `LATE_AND_OVERTIME` — kombinasi

#### 5.3.3 Manual Override (HR Admin)
1. HR buka `/attendance-admin/[employeeId]` → table per-tanggal.
2. Klik "Manual Record" → dialog dengan field: tanggal, clock-in time (HH:mm WIB), clock-out time, override reason.
3. Submit panggil `manualOverrideAction(input)`.
4. Action validasi role HR_ADMIN/SUPER_ADMIN, `manualAttendanceSchema`.
5. Konversi WIB ke UTC: `clockInUtc.setUTCHours(inH - 7, inM, 0, 0)`.
6. Recalculate flags.
7. **Upsert** `AttendanceRecord` — create kalau belum ada, update kalau sudah ada. Set `isManualOverride=true`, `overrideById=session.user.id`, `overrideReason`.
8. AuditLog action=UPDATE module="Absensi".
9. `revalidatePath("/attendance-admin")`.

#### 5.3.4 Export Attendance
- Tombol export di `/attendance-admin` → POST `/api/attendance/export` dengan body `{ month, year, departmentId? }`.
- Endpoint render PDF via `@react-pdf/renderer` → `attendance-pdf.tsx`.
- Response `Content-Type: application/pdf` → browser download.

---

### 5.4 Leave Management

**Aktor**: EMPLOYEE (submit, cancel), MANAGER (approve/reject stage 1), HR_ADMIN/SUPER_ADMIN (approve/reject stage 2).

**Status flow**:
```
PENDING_MANAGER ─approve─→ PENDING_HR ─approve─→ APPROVED
       │                          │
       └─reject──→ REJECTED       └─reject──→ REJECTED
       │                          
       └─cancel (employee)──→ CANCELLED
```

Catatan: Jika requester sendiri adalah MANAGER, atau departemennya tidak punya manager aktif, status awal = `PENDING_HR` (skip stage 1).

#### 5.4.1 Submit Leave Request
1. Employee buka `/leave` → `LeaveRequestSection` menampilkan form + saldo cuti.
2. Form: leaveTypeId, startDate, endDate, reason. (Fitur lampiran tidak diimplementasi — kolom schema attachment dihapus saat Paket A cleanup, lihat Section 0.2.)
3. Submit panggil `submitLeaveAction(formData)`.
4. Action cek session, validasi `submitLeaveSchema`.
5. Cek `employee.isActive=true`.
6. Service `submitLeaveRequest()`:
   - Hitung `workingDays = countWorkingDays(start, end)` (exclude weekend).
   - Jika `workingDays === 0` → error "Rentang tanggal tidak mencakup hari kerja".
   - `ensureLeaveBalances(employeeId, year)` → upsert balance untuk tiap leaveType aktif (allocated = annualQuota, used = 0).
   - Cek `balance.allocatedDays - balance.usedDays >= workingDays`. Jika tidak → error "Saldo cuti tidak mencukupi. Sisa: X, dibutuhkan: Y".
   - **`resolveInitialStage(employeeId)`**:
     - Jika requester user.role = MANAGER → `PENDING_HR`.
     - Jika departemen requester punya 0 manager aktif → `PENDING_HR`.
     - Else → `PENDING_MANAGER`.
   - `prisma.leaveRequest.create(...)` dengan status hasil resolve.
7. AuditLog action=CREATE module="Permintaan Cuti".
8. `revalidatePath("/leave")`.

#### 5.4.2 Approve (2-stage atomic)
1. Manager / HR buka `/leave/manage` → list pending requests, filter by stage.
2. Klik "Approve" → dialog konfirmasi + optional notes.
3. Submit panggil `approveLeaveAction({ leaveRequestId, notes })`.
4. Action validasi role harus MANAGER, HR_ADMIN, atau SUPER_ADMIN.
5. Service `approveLeaveRequest()` di dalam `prisma.$transaction`:
   - Load request include employee.userId, employee.departmentId.
   - **Self-approval guard**: jika `request.employee.userId === approverUserId` → error "Anda tidak dapat menyetujui pengajuan Anda sendiri".
   - Jika status `PENDING_MANAGER`:
     - Cek role harus MANAGER (HR/SuperAdmin tidak bisa skip stage).
     - Cek `approver.departmentId === request.employee.departmentId` (cross-department blocked).
     - Update: status=`PENDING_HR`, managerApprovedById, managerNotes, managerApprovedAt=now.
   - Jika status `PENDING_HR`:
     - Cek role harus HR_ADMIN atau SUPER_ADMIN.
     - **Decrement balance**: `leaveBalance.usedDays += workingDays`.
     - Update: status=`APPROVED`, hrApprovedById, hrNotes, hrApprovedAt=now.
   - Else → error "Permintaan sudah diproses sebelumnya".
6. AuditLog action=UPDATE.
7. `revalidatePath("/leave/manage")` + `/leave`.

#### 5.4.3 Reject (any stage)
- `rejectLeaveAction({ leaveRequestId, notes })` (notes wajib).
- Sama-sama cek role + department scope (untuk MANAGER).
- Tidak ada decrement balance (request tidak pernah APPROVED).
- Status langsung jadi `REJECTED`.

#### 5.4.4 Cancel (employee self)
- `cancelLeaveAction(leaveRequestId)`.
- Cek `request.employeeId === employee.id`.
- Cek status hanya bisa cancel jika `PENDING_MANAGER` atau `PENDING_HR`.
- Update status `CANCELLED`.

#### 5.4.5 Leave Report
- Halaman `/leave/report` (HR_ADMIN/SUPER_ADMIN only) — KPI cards (total approved, rejected, pending) + trend chart per bulan + breakdown per leave type.

---

### 5.5 Payroll

**Aktor**: HR_ADMIN, SUPER_ADMIN (import & finalize); EMPLOYEE (lihat payslip sendiri di `/payslip`).

**Catatan penting**: Phase 4 sudah PIVOT (2026-04-29) dari auto-calculation jadi **Excel import**. HR menghitung BPJS/PPh21/THR di spreadsheet eksternal, lalu upload file ke sistem. Sistem hanya **persist** snapshot — tidak ada engine kalkulasi.

**Status flow PayrollRun**:
```
(no run) → DRAFT (create via import) ─finalize─→ FINALIZED (immutable)
```
Re-import periode yang sama saat masih DRAFT akan **replace** entries lama. FINALIZED tidak bisa di-re-import.

#### 5.5.1 Import Payroll (Excel/CSV)
1. HR buka `/payroll` → klik "Import Payroll" → form pilih bulan, tahun, file (.xlsx/.xls/.csv).
2. Bisa juga klik "Download Template" → GET `/api/payroll/template?period=2026-05` → download template Excel dengan kolom prefilled.
3. Submit panggil `importPayrollAction(formData)`.
4. Action: `requireHRAdmin()`, validasi `importPayrollSchema` (month 1-12, year ≥ 2020).
5. Validasi file: harus `.xlsx`, `.xls`, atau `.csv`, file size > 0.
6. Buffer dari `file.arrayBuffer()`.
7. **Step 1 - Structural Parse**: `parsePayrollWorkbook(buffer)` di `payroll-import.service.ts` → return `{ rows: ParsedPayrollRow[], errors: PayrollImportError[] }`. Cek header sesuai template, parse setiap baris ke object dengan field NIK, name, basic salary, allowances, deductions, dst. Errors dikumpulkan per-baris (validasi tipe, missing kolom, NaN).
8. Jika `errors.length > 0` → return `success: false` dengan summary "Validasi gagal: Baris X (kolom Y): pesan | …".
9. **Step 2 - Match NIK → Employee**: `matchRowsToEmployees(rows)`:
   - `prisma.employee.findMany({ where: { nik: { in: niks } } })`.
   - Untuk tiap row, cek NIK ada di DB & employee aktif.
   - Error per baris jika NIK tidak ditemukan atau employee inactive.
10. Jika `matchErrors.length > 0` → return `success: false` summary.
11. **Step 3 - Persist as DRAFT**: `persistImportedPayroll({ month, year, rows, createdBy })`:
    - Cek `existingRun = payrollRun.findUnique({ month_year })`.
    - Jika `existingRun.status === FINALIZED` → throw "Payroll periode ini sudah difinalisasi dan tidak dapat diubah".
    - `payrollRun.upsert(month_year)` create/update DRAFT.
    - Jika existing DRAFT → `payrollEntry.deleteMany({ payrollRunId })` (replace strategy).
    - `payrollEntry.createMany(...)` snapshot semua field dari Excel ke DB:
      - Employee snapshot: nik, name, jobPosition, organization, gradeLevel, ptkpStatus, npwp.
      - Earnings: basicSalary, tunjanganKomunikasi, tunjanganKehadiran, tunjanganJabatan, tunjanganLainnya, taxAllowance, thr, totalEarnings.
      - Deductions: bpjsKesehatanEmployee, jhtEmployee, jaminanPensiunEmployee, pph21, potonganKeterlambatan, potonganKoperasi, potonganLainnya, totalDeductions.
      - takeHomePay.
      - Benefits (informational, porsi perusahaan): jkk, jkm, jhtCompany, jaminanPensiunCompany, bpjsKesehatanCompany, totalBenefits.
      - Attendance summary: actualWorkingDay, scheduleWorkingDay, dayoff, nationalHoliday, companyHoliday, specialHoliday, attendanceCodes.
12. **Audit log**: `createAuditLog({ action: "CREATE", module: "Payroll", targetId: payrollRunId, newValue: { month, year, entryCount, status: "DRAFT" } })`.
13. Return `{ success: true, data: { payrollRunId, entryCount, warnings: [] } }`.
14. Client redirect ke `/payroll/[periodId]` untuk preview.

#### 5.5.2 Review Payroll
- `/payroll/[periodId]` menampilkan tabel `PayrollEntryTable` dengan semua karyawan + breakdown earning/deduction/take-home pay.
- Status badge DRAFT/FINALIZED.
- Tombol "Download Payslip" per row → GET `/api/payroll/payslip/[entryId]` → render PDF via `payslip-pdf.tsx` → download.

#### 5.5.3 Finalize Payroll
1. HR klik "Finalize" → dialog konfirmasi.
2. Submit `finalizePayrollAction({ payrollRunId })`.
3. Action `requireHRAdmin()`, validasi `finalizePayrollSchema`.
4. Service `finalizePayroll(id)`:
   - Cek run exists, status === DRAFT.
   - Update `status = FINALIZED`.
5. Setelah finalize, run tidak bisa di-edit/import lagi.
6. `revalidatePath("/payroll")` + `/payroll/[id]`.

#### 5.5.4 Employee View — Payslip
- `/payslip` (employee role) → list payroll entries milik diri sendiri (filter `payrollRun.status=FINALIZED` dan `entry.employeeId === self`).
- Klik "Download" → GET `/api/payroll/payslip/[entryId]` (auth check: entry harus milik requester) → PDF.

#### 5.5.5 Payroll Report
- GET `/api/payroll-report?month=&year=&format=pdf|xlsx` → laporan rekap untuk akunting.

---

### 5.6 Recruitment

**Aktor**: HR_ADMIN, SUPER_ADMIN (CRUD vacancy, manage candidates).

#### 5.6.1 Create Vacancy
1. HR buka `/recruitment` → klik "Tambah Lowongan" → `/recruitment/new`.
2. Form `CreateVacancyForm`: title, departmentId, description (textarea), requirements (textarea), openDate, closeDate (optional).
3. Submit panggil `createVacancyAction(data)`.
4. Action `requireHRAdmin()`, validasi `createVacancySchema`.
5. `prisma.vacancy.create({ data })` dengan status default OPEN.
6. AuditLog action=CREATE module="Lowongan".
7. `revalidatePath("/recruitment")` → redirect ke list.

**Status flow Vacancy**: `OPEN ↔ CLOSED` (toggle via `toggleVacancyStatusAction(id)`).

#### 5.6.2 Add Candidate
1. HR buka `/recruitment/[vacancyId]` → tampilkan kanban + button "Tambah Kandidat".
2. Dialog `AddCandidateDialog`: nama, email, phone (optional), CV upload.
3. CV upload: client POST file ke `/api/recruitment/cv` (multipart) → server `fs/promises.writeFile` ke `<projectRoot>/uploads/cv/<candidateId>-cv.<ext>`, lalu update `Candidate.cvPath` di DB. Response `{ cvPath }` berupa relative path lokal (mis. `/uploads/cv/<candidateId>-cv.pdf`).
4. Submit form panggil `createCandidateAction(vacancyId, { name, email, phone, cvPath })`.
5. Validasi `createCandidateSchema`, role check.
6. `prisma.candidate.create({ data: { ...input, vacancyId, stage: MELAMAR } })`.
7. AuditLog CREATE module="Kandidat".

#### 5.6.3 Move Candidate Through Pipeline (Kanban)
- Halaman `/recruitment/[vacancyId]` pakai `KanbanBoard` dengan @dnd-kit.
- Drag candidate dari kolom MELAMAR → SELEKSI_BERKAS → INTERVIEW → PENAWARAN → DITERIMA / DITOLAK.
- onDragEnd panggil `updateCandidateStageAction(candidateId, { stage })`.
- Service update `candidate.stage`. AuditLog UPDATE.

**Status flow Candidate**:
```
MELAMAR → SELEKSI_BERKAS → INTERVIEW → PENAWARAN → DITERIMA → (convert to Employee, hiredAt)
                                                  └─→ DITOLAK
```

#### 5.6.4 Schedule Interview
- Buka `/recruitment/candidates/[candidateId]` → `CandidateDetailClient`.
- Form jadwal interview: scheduledAt (DateTime), interviewerName (optional), notes.
- `createInterviewAction(candidateId, data)` → `prisma.interview.create(...)`.
- Banyak interview per kandidat dimungkinkan.

#### 5.6.5 Update Offer
- Pada stage PENAWARAN, HR isi form offer: offerSalary (Decimal), offerNotes.
- `updateOfferAction(candidateId, { offerSalary, offerNotes })`.
- Tombol "Generate Offer Letter" → GET `/api/recruitment/offer-letter/[candidateId]` → PDF via `offer-letter-pdf.tsx`.

#### 5.6.6 Convert to Employee
1. Setelah stage `DITERIMA`, HR klik "Convert to Employee".
2. `convertCandidateToEmployeeAction(candidateId)`:
   - Cek role HR.
   - Load candidate include vacancy.department.
   - Guard: `candidate.stage === DITERIMA`, else error.
   - `prisma.candidate.update({ hiredAt: new Date() })`.
   - AuditLog UPDATE Kandidat newValue: { hiredAt, converted: true }.
   - Return `{ success: true, prefill: { fullName, email, phone, departmentId, cvPath, candidateId } }`.
3. Client redirect ke `/employees/new?fullName=...&email=...&phone=...&departmentId=...&candidateId=...` (5 query param).
4. `CreateEmployeeForm` membaca `useSearchParams()` dan mengisi `defaultValues`: `namaLengkap`, `email`, `nomorHp` (dari `phone`), `departmentId`. Form sudah ter-prefill — HR hanya tinggal pilih jabatan, kontrak, set tanggal, isi password awal, dst.
5. HR submit form → `createEmployeeAction` jalankan flow biasa (User + Employee + NIK generation).

---

### 5.7 Master Data

**Aktor**: SUPER_ADMIN only (CRUD penuh). HR/MANAGER/EMPLOYEE hanya read via dropdown di form lain.

Halaman `/master-data` pakai `MasterDataTabs` dengan 4 tab:
- Department, Position, Office Location, Leave Type.

#### Pola CRUD universal (untuk semua 4 tab):
1. Tab tampilkan tabel dengan kolom Nama + Action (Edit/Delete).
2. Klik "Tambah" → dialog form (e.g. `DepartmentFormDialog`).
3. Submit panggil action: `create<Entity>Action(data)`.
4. Action `getAuthenticatedSuperAdmin()` (throw jika bukan SUPER_ADMIN).
5. Validasi via Zod schema (`departmentSchema`, dst.).
6. Service `create<Entity>(data, actorId)`:
   - Cek nama unique (untuk department/position/leaveType).
   - `prisma.<entity>.create(...)`.
   - `createAuditLog` action=CREATE.
7. `revalidatePath("/master-data")`.

#### Soft Delete
- Department, Position, OfficeLocation, LeaveType pakai field `deletedAt`.
- Delete action set `deletedAt = new Date()` (tidak benar-benar hapus row).
- Query default filter `deletedAt: null`.
- **Validasi delete** (semua entity master data dilindungi setelah Paket A — lihat Section 0.1d):
  - `deleteDepartment` cek `_count.positions > 0` (Position aktif) → throw "Departemen memiliki jabatan aktif, tidak dapat dihapus".
  - `deletePosition` cek `_count.employees > 0` (Employee aktif memakai jabatan) → throw "Jabatan masih dipakai N karyawan aktif, tidak dapat dihapus".
  - `deleteOfficeLocation` cek `_count.employees > 0` (Employee aktif memakai lokasi) → throw "Lokasi kantor masih dipakai N karyawan aktif, tidak dapat dihapus".
  - `deleteLeaveType` cek `_count.leaveRequests > 0` (status PENDING_MANAGER/PENDING_HR/APPROVED) → throw "Jenis cuti masih terkait N pengajuan aktif, tidak dapat dihapus".

#### OfficeLocation specifics
- Field: name, address, allowedIPs (String[] CIDR), latitude, longitude, radiusMeters, workStartTime ("HH:mm"), workEndTime ("HH:mm").
- Seed default: `allowedIPs=[]`, lat/lng=null untuk dev mode (allow clock-in tanpa GPS/IP).

#### LeaveType specifics
- Field: name, annualQuota, isPaid (default true), genderRestriction ("MALE" | "FEMALE" | null).
- `genderRestriction` filter saat employee request (e.g. cuti melahirkan hanya FEMALE).

---

### 5.8 User Management

**Aktor**: SUPER_ADMIN only.

Halaman `/users` tampilkan list semua User dengan kolom: name, email, role, isActive, createdAt.

#### Create User
1. Klik "Tambah User" → `UserFormDialog` (mode=create).
2. Form: name, email, password, confirmPassword, role.
3. Submit panggil `createUserAction(formData)`.
4. Action `requireSuperAdmin()`.
5. Validasi `createUserSchema`.
6. Service `createUser`:
   - Cek email unique.
   - bcrypt hash password.
   - `prisma.user.create({ data: { ..., role, isActive: true } })`.
   - AuditLog CREATE module="User".

#### Update User (role assignment)
- `updateUserAction(id, formData)` → update name, email, role, password (optional - jika di-isi, hash ulang).
- Khusus untuk role: SUPER_ADMIN bisa promote/demote user di sini.

#### Toggle Active
- `toggleUserActiveAction(id)` → flip `isActive`.
- User non-aktif tidak bisa login (cek di NextAuth `authorize()`).
- AuditLog UPDATE.

**Catatan**: User yang dibuat via `/users` (oleh SUPER_ADMIN) **tidak punya** `Employee` record secara otomatis. Untuk role MANAGER/EMPLOYEE, biasanya alur sebaliknya: Employee dibuat di `/employees/new` → otomatis create User. Penggunaan `/users` standalone biasanya untuk SUPER_ADMIN/HR_ADMIN yang tidak butuh Employee record.

---

### 5.9 Audit Log

**Aktor**: SUPER_ADMIN only (read-only).

Halaman `/audit-log` (server component) tampilkan tabel paginated audit logs:
- Filter: userId (dropdown unique users), module (Karyawan/Absensi/Cuti/Lowongan/Kandidat/User/dst.), action (CREATE/UPDATE/DELETE), date range.
- Service `getAuditLogs(filters)` di `audit.service.ts` → pagination dengan skip/take 25 default.
- Klik row → navigate ke `/audit-log/[id]` detail page → tampilkan oldValue & newValue dalam JSON pretty-print + diff highlighting.
- Audit log **tidak bisa di-edit/delete** dari UI (tidak ada DELETE action).

**Apa yang dicatat**:
- userId (siapa yang lakukan), action (CREATE/UPDATE/DELETE), module (string label modul), targetId (id entity yang dimutasi), oldValue (JSON snapshot before), newValue (JSON snapshot after), createdAt.

**Modul yang dicatat** (lihat `MODULES` constant di `lib/constants.ts`): EMPLOYEE, EMERGENCY_CONTACT, ATTENDANCE, LEAVE, PAYROLL, VACANCY, CANDIDATE, USER, DEPARTMENT, POSITION, OFFICE_LOCATION, LEAVE_TYPE.

---

### 5.10 Dashboard per Role

Halaman `/dashboard` (server component) load session → render salah satu komponen:
- `SuperAdminDashboard` jika role SUPER_ADMIN.
- `HrAdminDashboard` jika role HR_ADMIN.
- `ManagerDashboard` jika role MANAGER.
- `EmployeeDashboard` jika role EMPLOYEE (default).

Setiap dashboard panggil service di `dashboard.service.ts`:

#### SuperAdmin Dashboard
- `getSuperAdminDashboardData()`: total users per role, total employees aktif/non-aktif, audit log count 7 hari terakhir, pending leave count global, total payroll runs DRAFT.

#### HR Admin Dashboard
- `getHrAdminDashboardData()`: stats karyawan (total active, PKWT, PKWTT, joined this month), pending leave count (global), payroll DRAFT, kontrak PKWT yang akan jatuh tempo (joinDate + contract expiry calculation), ulang tahun mendatang (7 hari ke depan), trend kehadiran 7 hari (line chart).

#### Manager Dashboard
- `getManagerDashboardData(userId)`: scope departemen manager (`getEmployeesForManager`), pending leave PENDING_MANAGER di departemennya, attendance trend 7 hari di departemen, employee birthdays di departemen.

#### Employee Dashboard
- `getEmployeeDashboardData(userId)`: status absen hari ini (sudah/belum clock-in/out), saldo cuti per leave type, pending leave requests milik diri sendiri, payslip terbaru (link ke /payslip).

---


---

## 6. Pemetaan Kelas / File

Sistem Next.js App Router; tidak ada "kelas" formal, tetapi file dapat dikategorikan ke 4 lapisan klasik (Entity, Controller, Service, View) untuk dokumentasi BAB 4 skripsi.

### 6.A — Entity / Model

| Nama Kelas/File | Kategori | Path File | Deskripsi |
|---|---|---|---|
| User | Entity (Prisma) | prisma/schema.prisma | Akun login dengan role (SUPER_ADMIN/HR_ADMIN/MANAGER/EMPLOYEE) |
| Department | Entity (Prisma) | prisma/schema.prisma | Departemen perusahaan, soft-delete |
| Position | Entity (Prisma) | prisma/schema.prisma | Jabatan dalam departemen, soft-delete |
| OfficeLocation | Entity (Prisma) | prisma/schema.prisma | Lokasi kantor + IP whitelist + GPS geofence |
| LeaveType | Entity (Prisma) | prisma/schema.prisma | Jenis cuti master + kuota tahunan |
| AuditLog | Entity (Prisma) | prisma/schema.prisma | Catatan immutable mutasi sistem |
| Employee | Entity (Prisma) | prisma/schema.prisma | Profil karyawan (1:1 ke User) |
| EmployeeDocument | Entity (Prisma) | prisma/schema.prisma | Dokumen karyawan (file di local filesystem `uploads/employees/<id>/`, DB simpan relative path) |
| EmergencyContact | Entity (Prisma) | prisma/schema.prisma | Kontak darurat (max 3 per Employee) |
| AttendanceRecord | Entity (Prisma) | prisma/schema.prisma | Absensi harian (unique [employeeId, date]) |
| LeaveRequest | Entity (Prisma) | prisma/schema.prisma | Pengajuan cuti dengan 2-stage approval |
| LeaveBalance | Entity (Prisma) | prisma/schema.prisma | Saldo cuti per Employee/LeaveType/year |
| PayrollRun | Entity (Prisma) | prisma/schema.prisma | Periode payroll bulanan (DRAFT/FINALIZED) |
| PayrollEntry | Entity (Prisma) | prisma/schema.prisma | Snapshot payslip per karyawan per periode |
| Vacancy | Entity (Prisma) | prisma/schema.prisma | Lowongan kerja |
| Candidate | Entity (Prisma) | prisma/schema.prisma | Pelamar dengan stage pipeline |
| Interview | Entity (Prisma) | prisma/schema.prisma | Jadwal wawancara per kandidat |
| TypeScript Enums (client-safe) | Type | src/types/enums.ts | Re-export Role, AttendanceStatus, dll. untuk client component |
| TypeScript Common Types | Type | src/types/index.ts | ServiceResult<T>, helper types |
| NextAuth augment | Type | src/types/next-auth.d.ts | Module augmentation untuk Session.user.role/id |
| ip-range-check augment | Type | src/types/ip-range-check.d.ts | Module declaration untuk lib `ip-range-check` |

### 6.B — Controller / Route Handler

API Routes (REST endpoints khusus):

| Nama File | Kategori | Path File | Deskripsi |
|---|---|---|---|
| auth route | Controller (REST) | src/app/api/auth/[...nextauth]/route.ts | NextAuth.js handler (signin/signout/session) |
| attendance export route | Controller (REST) | src/app/api/attendance/export/route.ts | POST → render PDF rekap absensi bulanan |
| employee documents route | Controller (REST) | src/app/api/employees/[id]/documents/route.ts | GET list / POST upload dokumen ke local filesystem (`uploads/employees/<id>/`) via `fs/promises.writeFile` |
| employee document detail route | Controller (REST) | src/app/api/employees/[id]/documents/[docId]/route.ts | GET stream file dari disk (`fs/promises.readFile`) untuk download / DELETE dokumen + `unlink` file di disk |
| payslip route | Controller (REST) | src/app/api/payroll/payslip/[entryId]/route.ts | GET → render PDF slip gaji |
| payroll template route | Controller (REST) | src/app/api/payroll/template/route.ts | GET → download template Excel kosong |
| payroll report route | Controller (REST) | src/app/api/payroll-report/route.ts | GET → laporan rekap payroll periode |
| recruitment CV route | Controller (REST) | src/app/api/recruitment/cv/route.ts | POST upload CV kandidat ke local filesystem (`uploads/cv/<candidateId>-cv.<ext>`) via `fs/promises.writeFile`, lalu update `Candidate.cvPath` |
| offer letter route | Controller (REST) | src/app/api/recruitment/offer-letter/[candidateId]/route.ts | GET → render PDF surat penawaran |

Server Actions (controller utama, dipanggil dari form/dialog client):

| Nama File | Kategori | Path File | Deskripsi |
|---|---|---|---|
| attendance.actions.ts | Controller (Server Action) | src/lib/actions/attendance.actions.ts | clockInAction, clockOutAction, manualOverrideAction |
| employee.actions.ts | Controller (Server Action) | src/lib/actions/employee.actions.ts | createEmployeeAction, updatePersonalInfo/Employment/TaxBpjs, deactivateEmployee |
| employee-document.actions.ts | Controller (Server Action) | src/lib/actions/employee-document.actions.ts | CRUD emergency contact (max 3) |
| leave.actions.ts | Controller (Server Action) | src/lib/actions/leave.actions.ts | submitLeaveAction, approveLeave, rejectLeave, cancelLeave |
| master-data.actions.ts | Controller (Server Action) | src/lib/actions/master-data.actions.ts | CRUD Department/Position/OfficeLocation/LeaveType (SUPER_ADMIN only) |
| payroll.actions.ts | Controller (Server Action) | src/lib/actions/payroll.actions.ts | importPayrollAction (Excel upload), finalizePayrollAction |
| recruitment.actions.ts | Controller (Server Action) | src/lib/actions/recruitment.actions.ts | CRUD Vacancy/Candidate/Interview, updateOffer, convertCandidateToEmployee |
| user.actions.ts | Controller (Server Action) | src/lib/actions/user.actions.ts | createUser, updateUser, toggleUserActive (SUPER_ADMIN only) |

### 6.C — Service / Business Logic

| Nama File | Kategori | Path File | Deskripsi |
|---|---|---|---|
| attendance.service.ts | Service | src/lib/services/attendance.service.ts | calculateAttendanceFlags, monthly recap query |
| audit.service.ts | Service | src/lib/services/audit.service.ts | getAuditLogs (paginated filter), distinct users/modules |
| dashboard.service.ts | Service | src/lib/services/dashboard.service.ts | Dashboard data agregator per role (Promise.all multi-query) |
| employee.service.ts | Service | src/lib/services/employee.service.ts | NIK generation, CRUD employee, deactivation, manager scope check, stats summary |
| employee-document.service.ts | Service | src/lib/services/employee-document.service.ts | `getDocumentsByEmployeeId`, `getDocumentById`, `createDocumentRecord` (DB row + audit log), `deleteDocument` (`fs/promises.unlink` file di disk + delete row + audit log). Write file aktual (`writeFile`) dilakukan di POST route handler, bukan di service. |
| leave.service.ts | Service | src/lib/services/leave.service.ts | countWorkingDays, ensureLeaveBalances, submit/approve/reject/cancel + 2-stage transaction |
| location.service.ts | Service | src/lib/services/location.service.ts | verifyLocation: IP whitelist (CIDR) + haversine GPS distance |
| master-data.service.ts | Service | src/lib/services/master-data.service.ts | CRUD master data + soft-delete + usage check |
| payroll.service.ts | Service | src/lib/services/payroll.service.ts | matchRowsToEmployees, persistImportedPayroll, finalizePayroll |
| payroll-import.service.ts | Service | src/lib/services/payroll-import.service.ts | parsePayrollWorkbook, buildPayrollTemplate (xlsx lib) |
| recruitment.service.ts | Service | src/lib/services/recruitment.service.ts | getVacancies, candidate query, recruitment stats |
| user.service.ts | Service | src/lib/services/user.service.ts | createUser/updateUser/toggleActive (SUPER_ADMIN only) |
| auth.config.ts | Config / Helper | src/lib/auth.config.ts | NextAuth core config (providers, callbacks) — Edge-safe |
| auth.ts | Auth Helper | src/lib/auth.ts | NextAuth instance + authorize() callback dengan bcrypt |
| prisma.ts | Helper | src/lib/prisma.ts | Singleton PrismaClient + createAuditLog helper |
| utils.ts | Helper | src/lib/utils.ts | cn() (Tailwind class merge), date/currency formatters |
| constants.ts | Helper | src/lib/constants.ts | MODULES (label audit log), DEFAULT_PAGE_SIZE, OVERTIME_THRESHOLD_MINUTES |
| validations/auth.ts | Validation | src/lib/validations/auth.ts | loginSchema |
| validations/attendance.ts | Validation | src/lib/validations/attendance.ts | clockActionSchema, manualAttendanceSchema |
| validations/employee.ts | Validation | src/lib/validations/employee.ts | createEmployee, updatePersonalInfo, updateEmployment, updateTaxBpjs, emergencyContact, deactivateEmployee schemas |
| validations/leave.ts | Validation | src/lib/validations/leave.ts | submitLeave, approveLeave, rejectLeave |
| validations/master-data.ts | Validation | src/lib/validations/master-data.ts | department, position, officeLocation, leaveType schemas |
| validations/payroll.ts | Validation | src/lib/validations/payroll.ts | importPayroll, finalizePayroll schemas |
| validations/recruitment.ts | Validation | src/lib/validations/recruitment.ts | createVacancy, updateVacancy, createCandidate, updateCandidateStage, updateOffer, createInterview |
| validations/user.ts | Validation | src/lib/validations/user.ts | createUser, updateUser schemas |
| pdf/attendance-pdf.tsx | PDF Generator | src/lib/pdf/attendance-pdf.tsx | React-PDF: laporan absensi bulanan |
| pdf/offer-letter-pdf.tsx | PDF Generator | src/lib/pdf/offer-letter-pdf.tsx | React-PDF: surat penawaran kandidat |
| pdf/payslip-pdf.tsx | PDF Generator | src/lib/pdf/payslip-pdf.tsx | React-PDF: slip gaji karyawan |
| middleware.ts | Middleware | src/middleware.ts | Route protection (redirect unauth ke /login) |

### 6.D — View / Component

**Layout & Page (Next.js App Router):**

| Nama File | Kategori | Path File | Deskripsi |
|---|---|---|---|
| Root Layout | Page | src/app/layout.tsx | Layout root: html/body, font, providers (Session, Toaster) |
| Root Page | Page | src/app/page.tsx | Redirect / → /dashboard atau /login |
| Auth Layout | Page | src/app/(auth)/layout.tsx | Layout split-screen untuk login |
| Login Page | Page | src/app/(auth)/login/page.tsx | Form login (email + password) |
| Dashboard Layout | Page | src/app/(dashboard)/layout.tsx | Layout sidebar + header + breadcrumbs (auth gate) |
| Dashboard Page | Page | src/app/(dashboard)/dashboard/page.tsx | Routing role-based ke 4 dashboard |
| Attendance Page | Page | src/app/(dashboard)/attendance/page.tsx | Halaman absen karyawan (clock-in/out + history) |
| Attendance Admin List | Page | src/app/(dashboard)/attendance-admin/page.tsx | List karyawan + ringkasan absensi (HR view) |
| Attendance Admin Detail | Page | src/app/(dashboard)/attendance-admin/[employeeId]/page.tsx | Detail per karyawan + manual override |
| Audit Log List | Page | src/app/(dashboard)/audit-log/page.tsx | Tabel audit log paginated |
| Audit Log Detail | Page | src/app/(dashboard)/audit-log/[id]/page.tsx | Detail diff oldValue/newValue |
| Employees List | Page | src/app/(dashboard)/employees/page.tsx | Tabel karyawan dengan filter |
| Employees New | Page | src/app/(dashboard)/employees/new/page.tsx | Form create karyawan baru |
| Employee Detail | Page | src/app/(dashboard)/employees/[id]/page.tsx | Profile karyawan dengan 5 tabs |
| Leave Page | Page | src/app/(dashboard)/leave/page.tsx | Form ajukan cuti + saldo + history |
| Leave Manage | Page | src/app/(dashboard)/leave/manage/page.tsx | Approval queue (Manager/HR) |
| Leave Report | Page | src/app/(dashboard)/leave/report/page.tsx | Laporan cuti dengan KPI + chart |
| Master Data Page | Page | src/app/(dashboard)/master-data/page.tsx | Tabs: Department/Position/OfficeLocation/LeaveType |
| Payroll List | Page | src/app/(dashboard)/payroll/page.tsx | List payroll runs + import button |
| Payroll Detail | Page | src/app/(dashboard)/payroll/[periodId]/page.tsx | Detail entries periode + finalize |
| Payslip Page | Page | src/app/(dashboard)/payslip/page.tsx | Self-service payslip karyawan |
| Recruitment List | Page | src/app/(dashboard)/recruitment/page.tsx | List vacancies |
| Recruitment New | Page | src/app/(dashboard)/recruitment/new/page.tsx | Form create vacancy |
| Vacancy Detail | Page | src/app/(dashboard)/recruitment/[vacancyId]/page.tsx | Kanban candidates per vacancy |
| Candidate Detail | Page | src/app/(dashboard)/recruitment/candidates/[candidateId]/page.tsx | Detail kandidat + interview + offer |
| Users Page | Page | src/app/(dashboard)/users/page.tsx | Manajemen user (SUPER_ADMIN) |

**Shared Component (reusable):**

| Nama File | Kategori | Path File | Deskripsi |
|---|---|---|---|
| Sidebar | Layout Component | src/components/layout/sidebar.tsx | Navigasi role-based dengan menu items |
| Header | Layout Component | src/components/layout/header.tsx | Header app dengan profile + logout |
| Breadcrumbs | Layout Component | src/components/layout/breadcrumbs.tsx | Breadcrumb navigasi otomatis dari pathname |
| Session Provider (layout) | Provider | src/components/layout/session-provider.tsx | Provider Next-Auth di layout |
| Session Provider (providers) | Provider | src/components/providers/session-provider.tsx | NextAuth SessionProvider wrapper |
| ConfirmDialog | Shared Component | src/components/shared/confirm-dialog.tsx | Dialog konfirmasi reusable |
| DataTable | Shared Component | src/components/shared/data-table.tsx | Wrapper TanStack Table dengan loading/empty states |
| DataTablePagination | Shared Component | src/components/shared/data-table-pagination.tsx | Pagination control |
| LoadingSkeleton | Shared Component | src/components/shared/loading-skeleton.tsx | Skeleton loader generic |
| StatCard | Shared Component | src/components/shared/stat-card.tsx | Card statistik (total, trend, ikon) |
| SummaryTile | Shared Component | src/components/shared/summary-tile.tsx | Tile rangkuman dashboard |
| AttendanceStatusBadges | Domain Component | src/components/attendance/attendance-status-badges.tsx | Badge status absen (LATE, OVERTIME, dst.) |

**shadcn/ui primitives** (di `src/components/ui/`): alert-dialog, avatar, badge, button, calendar, card, chart, collapsible, dialog, dropdown-menu, form, input, label, popover, progress, scroll-area, select, separator, sheet, skeleton, sonner, table, tabs, textarea, toast, toaster, tooltip — total 27 file primitive.

**Page-level _components folder** (komponen yang khusus dipakai 1 halaman):
- `attendance/_components/`: attendance-history.tsx, attendance-today.tsx, clock-in-button.tsx
- `attendance-admin/_components/`: attendance-filters.tsx, attendance-summary-table.tsx, export-buttons.tsx, manual-record-dialog.tsx
- `audit-log/_components/`: audit-log-columns.tsx, audit-log-filters.tsx, audit-log-table.tsx
- `dashboard/_components/`: employee-dashboard.tsx, hr-admin-dashboard.tsx, manager-dashboard.tsx, super-admin-dashboard.tsx
- `employees/_components/`: employee-columns.tsx, employee-filters.tsx, employee-table.tsx
- `employees/[id]/_components/`: deactivate-employee-dialog.tsx, documents-tab.tsx, emergency-contacts-tab.tsx, employee-profile-tabs.tsx, employment-details-tab.tsx, personal-info-tab.tsx, tax-bpjs-tab.tsx
- `employees/new/_components/`: create-employee-form.tsx
- `leave/_components/`: leave-balance-card.tsx, leave-history-table.tsx, leave-request-form.tsx, leave-request-section.tsx, leave-type-info-panel.tsx
- `leave/manage/_components/`: approve-reject-dialog.tsx, leave-approval-table.tsx
- `leave/report/_components/`: leave-report-filters.tsx, leave-report-kpi-cards.tsx, leave-report-trend-chart.tsx
- `master-data/_components/`: department-form-dialog.tsx, department-tab.tsx, leave-type-form-dialog.tsx, leave-type-tab.tsx, master-data-tabs.tsx, office-location-form-dialog.tsx, office-location-tab.tsx, position-form-dialog.tsx, position-tab.tsx
- `payroll/_components/`: import-payroll-form.tsx
- `payroll/[periodId]/_components/`: finalize-button.tsx, payroll-entry-table.tsx
- `recruitment/_components/`: vacancy-table.tsx
- `recruitment/[vacancyId]/_components/`: add-candidate-dialog.tsx, kanban-board.tsx
- `recruitment/candidates/[candidateId]/_components/`: candidate-detail-client.tsx
- `recruitment/new/_components/`: create-vacancy-form.tsx
- `users/_components/`: user-columns.tsx, user-form-dialog.tsx, user-page-header.tsx, user-table.tsx

**Hook**:
| Nama File | Kategori | Path File | Deskripsi |
|---|---|---|---|
| use-toast | Hook | src/hooks/use-toast.ts | Toast notification hook (dari shadcn) |

---


---

## 7. Detail Method/Fungsi Setiap Controller

Untuk SETIAP fungsi (REST handler + Server Action) di bawah dijabarkan: nama, parameter, langkah-langkah eksekusi, model DB yang disentuh, response yang dikembalikan, dan error handling.

### 7.A REST API Handlers

#### 7.A.1 `GET/POST /api/auth/[...nextauth]`
- **Nama**: `GET`, `POST` (re-export `handlers` dari `@/lib/auth`).
- **Parameter**: Dikelola NextAuth.
- **Langkah**: Delegasi penuh ke Auth.js v5 — provider Credentials menerima email+password, validasi via `bcrypt.compare`, terbitkan JWT session.
- **DB**: `User` (lookup via Prisma adapter di `lib/auth.ts`).
- **Response**: Cookie session, JSON `{ user, expires }`.
- **Error**: NextAuth bawaan (401 untuk invalid credential).

#### 7.A.2 `GET /api/attendance/export`
- **Nama**: `GET(request: Request)`.
- **Parameter**: Query `month`, `year`, `format` (xlsx|pdf), `departmentId?`.
- **Langkah**:
  1. `auth()` → cek session valid + role HR_ADMIN/SUPER_ADMIN; else `401 Unauthorized`.
  2. Parse query parameters dengan default = bulan/tahun saat ini.
  3. Panggil `getMonthlyAttendanceRecap({ month, year, departmentId })` dari `attendance.service.ts` — query AttendanceRecord lengkap dengan Employee, Department, Position.
  4. Cabang format:
     - `pdf`: Render `AttendancePDFDocument` via `@react-pdf/renderer.renderToStream`, kumpulkan chunks → Buffer.
     - `xlsx` (default): Map records → array of object (NIK, Nama, Departemen, Jabatan, Tanggal, Jam Masuk, Jam Pulang, Total Jam, Terlambat, Lembur, Override) dengan timezone Asia/Jakarta. Build worksheet, set column widths, write buffer.
  5. Return `Response` dengan header `Content-Disposition: attachment; filename="absensi-{year}-{MM}.{ext}"`.
- **DB**: `AttendanceRecord`, `Employee`, `Department`, `Position`.
- **Error**: 401 jika role tidak sesuai (return text `"Unauthorized"`). PDF render exception bubble up.

#### 7.A.3 `POST /api/employees/[id]/documents`
- **Nama**: `POST(request, { params })`.
- **Parameter**: Path `id`. FormData: `file`, `documentType`.
- **Langkah**:
  1. `auth()` → cek session, else 401.
  2. Cek role HR_ADMIN/SUPER_ADMIN, else 403.
  3. Resolve `params.id` → employeeId.
  4. Parse formData; validasi:
     - `file` adalah `File`.
     - `mime` ∈ `[application/pdf, image/jpeg, image/png]`.
     - Size ≤ 5 MB.
     - `documentType` ∈ Prisma `DocumentType` enum.
  5. `mkdir -p uploads/employees/{employeeId}/`.
  6. Generate unique filename `Date.now()-{sanitized}` (regex `[^a-zA-Z0-9.-]/_`).
  7. `writeFile` ke disk dengan Buffer.
  8. Panggil `createDocumentRecord(...)` dari `employee-document.service.ts` → INSERT EmployeeDocument + audit log.
  9. Return `{ success: true, data: document }`.
- **DB**: `EmployeeDocument`, `AuditLog`.
- **Error**: 400 (validation), 401 (unauth), 403 (forbidden), 500 (catch + log "Document upload error").

#### 7.A.4 `GET /api/employees/[id]/documents/[docId]`
- **Nama**: `GET(request, { params })`.
- **Parameter**: Path `id`, `docId`.
- **Langkah**:
  1. `auth()` cek session.
  2. `canAccessEmployeeDocuments(userId, role, employeeId)`:
     - HR_ADMIN/SUPER_ADMIN → true;
     - MANAGER → true jika sama departemen dengan target;
     - EMPLOYEE → true hanya jika own record.
  3. `getDocumentById(docId)`. 404 jika tidak ada atau `document.employeeId !== employeeId`.
  4. `readFile(absolutePath)`. Jika gagal → 404 "File not found on disk".
  5. Return raw `Response(Uint8Array(buffer))` dengan header `Content-Type` (mimeType), `Content-Disposition: attachment`, `Content-Length`.
- **DB**: `EmployeeDocument` (read), `Employee` (read untuk role check).
- **Error**: 401, 403, 404, 500.

#### 7.A.5 `DELETE /api/employees/[id]/documents/[docId]`
- **Nama**: `DELETE(request, { params })`.
- **Parameter**: Path `id`, `docId`.
- **Langkah**:
  1. `auth()` → 401 jika no session.
  2. Role gate HR_ADMIN/SUPER_ADMIN, else 403.
  3. `deleteDocument(docId, actorId)` dari service: find document → unlink file (best-effort, swallow error jika file sudah hilang) → DELETE DB row → audit log.
  4. Return `{ success: true }`.
- **DB**: `EmployeeDocument`, `AuditLog`.
- **Error**: 500 jika exception.

#### 7.A.6 `GET /api/payroll/payslip/[entryId]`
- **Nama**: `GET(_request, { params })`.
- **Parameter**: Path `entryId`.
- **Langkah**:
  1. `auth()` → 401 jika no session.
  2. `prisma.payrollEntry.findUnique` include `payrollRun`. 404 jika tidak ada.
  3. Authorization: HR_ADMIN/SUPER_ADMIN dibolehkan; selainnya, lookup `Employee.userId === session.user.id` dan pastikan `employee.id === entry.employeeId`, else 403.
  4. Pastikan `entry.payrollRun.status === FINALIZED`, else 400 "Payroll belum difinalisasi".
  5. Build `PayslipData` (semua field di-`Number(...)` karena Decimal), buildPayrollCutoff `01 - {lastDay} {Jan|Feb|...} {year}`.
  6. `renderToStream(PayslipDocument)` → Buffer. Return PDF response dengan filename `Payslip-{YYYY-MM}-{NIK}.pdf`.
- **DB**: `PayrollEntry`, `PayrollRun`, `Employee` (selektif).
- **Error**: 401/403/404/400/500.

#### 7.A.7 `GET /api/payroll/template`
- **Nama**: `GET(request: NextRequest)`.
- **Parameter**: Query `month` (1–12), `year` (2024–2099) — default ke periode sekarang.
- **Langkah**:
  1. `auth()` cek session + role HR (HR_ADMIN/SUPER_ADMIN), else 401/403.
  2. Sanitize `month`/`year` ke range valid.
  3. `buildPayrollTemplate(periodLabel)` dari `payroll-import.service.ts` → buffer xlsx dengan dua sheet: `Payroll` (header sample row + 33 kolom Talenta-style) dan `Petunjuk` (cara pengisian).
  4. Return file dengan filename `template-penggajian-{Bulan}-{Tahun}.xlsx`.
- **DB**: tidak menyentuh DB.
- **Error**: 401/403.

#### 7.A.8 `GET /api/payroll-report`
- **Nama**: `GET(request: NextRequest)`.
- **Parameter**: Query `runId`.
- **Langkah**:
  1. `auth()` + role HR check.
  2. Validasi `runId` ada di query.
  3. `prisma.payrollRun.findUnique` include `entries` orderBy employeeName asc.
  4. Build header (38 kolom: No, NIK, Nama, ..., Total Earnings, Total Deductions, Take Home Pay, ..., Attendance Codes).
  5. Map entries → array of array, paksa Number untuk Decimal.
  6. Tambahkan baris `TOTAL` dengan reduce `numericColumns`.
  7. Build worksheet pakai `XLSX.utils.aoa_to_sheet([title, status, [], headers, ...rows, totalsRow])`. Set column widths.
  8. Return file `rekap-penggajian-{Bulan}-{Tahun}.xlsx`.
- **DB**: `PayrollRun`, `PayrollEntry`.
- **Error**: 400 (no runId), 401, 403, 404.

#### 7.A.9 `POST /api/recruitment/cv`
- **Nama**: `POST(request: NextRequest)`.
- **Parameter**: FormData `file`, `candidateId`.
- **Langkah**:
  1. `auth()` cek session + role HR, else 401/403.
  2. Validasi `file` instance of File, `candidateId` ada.
  3. Cek mimetype (PDF/JPEG/PNG) dan size ≤ 5 MB.
  4. `prisma.candidate.findUnique({ where: { id: candidateId } })`, 404 jika tidak ada.
  5. `mkdir -p uploads/cv/`. Filename = `{candidateId}-cv{ext}`.
  6. `writeFile(filepath, buffer)`.
  7. `prisma.candidate.update({ data: { cvPath: "/uploads/cv/{filename}" } })`.
  8. Return `{ success: true, cvPath }`.
- **DB**: `Candidate`.
- **Error**: 400/401/403/404/500.

#### 7.A.10 `GET /api/recruitment/offer-letter/[candidateId]`
- **Nama**: `GET(_request, { params })`.
- **Parameter**: Path `candidateId`.
- **Langkah**:
  1. `auth()` + role HR, else 401/403.
  2. `prisma.candidate.findUnique` include `vacancy.department`. 404 jika tidak ada.
  3. Pastikan `candidate.stage === DITERIMA`, else 400.
  4. Pastikan `candidate.offerSalary` ada, else 400.
  5. Build `data` (candidateName, position=vacancy.title, department, offerSalary, offerNotes, generatedDate).
  6. `renderToStream(OfferLetterDocument)` → Buffer.
  7. Return PDF `surat-penawaran-{nama-kandidat-with-dashes}.pdf`. Catch + log error.
- **DB**: `Candidate`, `Vacancy`, `Department`.
- **Error**: 401/403/404/400/500.

---

### 7.B Server Actions

> Catatan umum: setiap action diawali helper `requireSuperAdmin()`/`requireHRAdmin()` yang memanggil `auth()` (NextAuth) dan mengembalikan `ServiceResult` early-return jika gagal. Setelah operasi DB, dipanggil `revalidatePath(...)` untuk invalidasi Next.js cache.

#### 7.B.1 `user.actions.ts`

##### `createUserAction(formData)`
- **Parameter**: `formData: unknown` — divalidasi `createUserSchema` (name, email, password ≥ 8, role).
- **Langkah**:
  1. `requireSuperAdmin()`. Return error jika gagal.
  2. `safeParse` dengan Zod schema. Return error pertama jika gagal.
  3. Panggil `createUser(parsed.data, actorId)` dari `user.service.ts`:
     - Cek `User.email` unik → error "Email sudah terdaftar".
     - `bcrypt.hash(password, 12)`.
     - `prisma.user.create` (default isActive=true).
     - `createAuditLog({ action: CREATE, module: USER, targetId, newValue })`.
  4. `revalidatePath("/users")`.
  5. Return `{ success: true }`.
- **DB**: `User`, `AuditLog`.
- **Error**: Validation error / duplicate email / general failure.

##### `updateUserAction(id, formData)`
- **Parameter**: `id`, `formData: unknown` (updateUserSchema = name, email, role).
- **Langkah**:
  1. `requireSuperAdmin()`.
  2. Validate via schema.
  3. `updateUser(id, data, actorId)` di service:
     - Lookup old user; null → error "Pengguna tidak ditemukan".
     - Cek email unik (excluding self).
     - UPDATE.
     - Audit log dengan oldValue/newValue (name/email/role).
  4. `revalidatePath("/users")`.
- **DB**: `User`, `AuditLog`.

##### `toggleUserActiveAction(id)`
- **Langkah**:
  1. `requireSuperAdmin()`.
  2. `toggleUserActive(id, actorId)` di service:
     - Cegah `id === actorId` (self-deactivation) → error.
     - Lookup user; flip `isActive`; UPDATE; audit log oldValue/newValue.
  3. `revalidatePath("/users")`.

#### 7.B.2 `master-data.actions.ts`

Semua action di file ini menjalankan helper `getAuthenticatedSuperAdmin()` (throw jika tidak SUPER_ADMIN) di awal try block, dan `revalidatePath("/master-data")` setelah mutasi.

##### `getDepartmentsAction()` / `getPositionsAction()` / `getOfficeLocationsAction()` / `getLeaveTypesAction()`
- **Langkah**:
  1. `getAuthenticatedSuperAdmin()`.
  2. Panggil service `getDepartments()` (dst.) yang return paginated `{ data, total, page, pageSize, totalPages }` dengan filter `deletedAt: null`.
  3. Map data: convert tanggal `createdAt`/`updatedAt`/`deletedAt` ke ISO string (untuk serialisasi ke client component).
  4. Return `{ success: true, data }`.

##### `getAllDepartmentsAction()` / `getAllPositionsAction(departmentId?)`
- Kembalikan list `{ id, name }` saja (untuk dropdown). Tidak paginated.

##### `createDepartmentAction(formData)`
- **Langkah**:
  1. `getAuthenticatedSuperAdmin()` → actorId.
  2. `departmentSchema.parse(formData)` (throws jika invalid).
  3. `createDepartment(parsed, actorId)` service: INSERT + audit CREATE.
  4. `revalidatePath`.
- **Error**: Caught generic, return `{ success: false, error: e.message }`.

##### `updateDepartmentAction(id, formData)` / `updatePositionAction` / `updateOfficeLocationAction` / `updateLeaveTypeAction`
- Pola sama: parse Zod, service `update*` (read old → update → audit UPDATE oldValue/newValue), revalidate.

##### `deleteDepartmentAction(id)`
- **Langkah**:
  1. Auth + actorId.
  2. `deleteDepartment(id, actorId)` service:
     - findUniqueOrThrow + include `_count.positions where deletedAt: null`.
     - Throw "Departemen memiliki jabatan aktif" jika `_count.positions > 0`.
     - UPDATE `deletedAt = now()` (soft delete).
     - Audit DELETE oldValue.
  3. revalidatePath.

##### `deletePositionAction(id)` / `deleteOfficeLocationAction(id)` / `deleteLeaveTypeAction(id)`
- Soft delete (`deletedAt = now()`) + audit. Tidak ada guard cascade (Position selalu boleh dihapus selama tidak ada dependency hard).

##### `createPositionAction(formData)` / `updatePositionAction`
- Tambahan: verify `Department` (target) `findUniqueOrThrow where deletedAt: null` sebelum operate.

##### `create/update OfficeLocation`
- Field optional (lat/lng/radius/allowedIPs[]) di-coerce ke `null`/`[]` jika tidak diisi.

##### `create/update LeaveType`
- Field: `name`, `annualQuota`, `isPaid`, `genderRestriction?`.

#### 7.B.3 `employee.actions.ts`

##### `createEmployeeAction(formData)`
- **Parameter**: `createEmployeeSchema` (data lengkap karyawan + initialPassword).
- **Langkah**:
  1. `requireHRAdmin()`.
  2. `safeParse` schema.
  3. Service `createEmployee(parsed, actorId)`:
     - `prisma.$transaction`:
       - Cek email unik → throw "Email sudah terdaftar".
       - `generateEmployeeNIK(tx)` — query last NIK with prefix `EMP-{YYYY}-`, increment, pad 4 digit.
       - `bcrypt.hash(initialPassword, 12)`.
       - `tx.user.create({ name, email, hashedPassword, role: EMPLOYEE, isActive: true })`.
       - `tx.employee.create` semua field optional di-`||null` defensive.
     - Setelah commit: audit CREATE module EMPLOYEE.
  4. `revalidatePath("/employees")`.
  5. Return `{ success: true, data: { id } }`.
- **DB**: `User`, `Employee`, `AuditLog`.
- **Error**: Validation/duplicate-email/general; service mengembalikan `ServiceResult` sehingga action propagate `result.error`.

##### `updatePersonalInfoAction(employeeId, formData)`
- Service `updatePersonalInfo`:
  1. findUnique old → null = "Karyawan tidak ditemukan".
  2. UPDATE namaLengkap + 8 field optional (nikKtp, tempatLahir, tanggalLahir, jenisKelamin, statusPernikahan, agama, alamat, nomorHp); cast enum string ke type.
  3. Audit UPDATE oldValue/newValue.
- Return `ServiceResult<null>` + `revalidatePath`.

##### `updateEmploymentAction(employeeId, formData)`
- Service `updateEmploymentDetails`:
  - UPDATE departmentId, positionId, contractType, joinDate, officeLocationId.
  - Audit UPDATE old/new.

##### `updateTaxBpjsAction(employeeId, formData)`
- Service `updateTaxBpjs`: UPDATE npwp, ptkpStatus, bpjsKesehatanNo, bpjsKetenagakerjaanNo, isTaxBorneByCompany. Audit.

##### `deactivateEmployeeAction(employeeId, formData)`
- Service `deactivateEmployee`:
  1. Find old `{ id, userId, isActive }`. Null → "Karyawan tidak ditemukan". Already inactive → "Karyawan sudah tidak aktif".
  2. `prisma.$transaction`:
     - Update Employee `isActive=false`, `terminationDate`, `terminationReason`.
     - Update User linked `isActive=false` juga (cegah login).
  3. Audit UPDATE.
- Catatan: Action membungkus semua dalam try/catch service.

#### 7.B.4 `employee-document.actions.ts` (Emergency Contacts)

##### `createEmergencyContactAction(employeeId, data)`
- **Langkah**:
  1. `requireHRAdmin()`.
  2. `emergencyContactSchema.safeParse`.
  3. `prisma.emergencyContact.count({ where: { employeeId } })` — guard ≥ 3 → return error.
  4. `prisma.emergencyContact.create`.
  5. `createAuditLog` action CREATE module EMERGENCY_CONTACT.
  6. `revalidatePath("/employees/${employeeId}")`.
- **DB**: `EmergencyContact`, `AuditLog`.

##### `updateEmergencyContactAction(contactId, employeeId, data)`
- **Langkah**:
  1. Auth + parse.
  2. Find existing `where: { id: contactId }`. Cek `existing.employeeId === employeeId`, else "Kontak darurat tidak ditemukan".
  3. UPDATE.
  4. Audit UPDATE oldValue/newValue (name, relationship, phone, address).
  5. revalidatePath.

##### `deleteEmergencyContactAction(contactId, employeeId)`
- Sama-sama verifikasi ownership; DELETE; audit DELETE; revalidatePath.

#### 7.B.5 `attendance.actions.ts`

##### `clockInAction(coords?)`
- **Parameter**: optional `{ latitude, longitude }`.
- **Langkah**:
  1. `auth()` cek session.
  2. Resolve `clientIp` dari header `x-forwarded-for` (split koma) atau `x-real-ip`, else "unknown".
  3. `prisma.employee.findUnique({ where: userId, include: officeLocation })`. Validasi: ada, isActive, officeLocation tidak null.
  4. `verifyLocation(clientIp, coords, officeLocation)`:
     - Jika GPS tersedia (`coords && office.latitude/longitude/radiusMeters` tidak null) → haversineDistance; jika > radius → reject.
     - Else fallback: jika `office.allowedIPs.length === 0` → allow; else cek `ipRangeCheck(clientIp, allowedIPs)`.
  5. Dapatkan UTC now → konversi ke timezone Asia/Jakarta (`toZonedTime`) → format `yyyy-MM-dd` → buat `dateOnly` UTC midnight string.
  6. `calculateAttendanceFlags(nowUtc, null, scheduleStart, scheduleEnd)` → hitung `isLate`/`lateMinutes` (lateMinutes = round((local - scheduledStart)/60000)).
  7. `prisma.attendanceRecord.create` dengan `clockIn: nowUtc`, `clockInIp`, GPS, `isLate`, `lateMinutes`. Unique constraint `[employeeId, date]` melempar P2002 jika sudah ada.
  8. `revalidatePath("/attendance")`.
- **Error**: P2002 → "Anda sudah melakukan absen masuk hari ini"; lokasi reject → reason; sesi/profile/lokasi salah → message spesifik.

##### `clockOutAction(coords?)`
- **Langkah**:
  1. Auth + employee + lokasi check (sama).
  2. `findUnique` AttendanceRecord today via composite key `employeeId_date`.
  3. Guard: tidak ada → "Absen masuk belum tercatat". Sudah ada `clockOut` → "Sudah absen pulang".
  4. `calculateAttendanceFlags(record.clockIn, nowUtc, scheduleStart, scheduleEnd)` → hitung `isEarlyOut`, `earlyOutMinutes`, `overtimeMinutes` (>= `OVERTIME_THRESHOLD_MINUTES`), `totalMinutes`.
  5. `prisma.attendanceRecord.update` dengan `clockOut`, `clockOutIp`, dan flags.
  6. revalidatePath.

##### `manualOverrideAction(input)`
- **Parameter**: `manualAttendanceSchema` (employeeId, date Date, clockIn `"HH:mm"`, clockOut?, overrideReason).
- **Langkah**:
  1. Auth + role HR/SUPER_ADMIN.
  2. Parse Zod. Lookup Employee + officeLocation.
  3. Build `dateOnly` UTC midnight, parse `clockIn`/`clockOut` `"HH:mm"`, set ke UTC dengan offset `-7` (WIB→UTC).
  4. `calculateAttendanceFlags`.
  5. Resolve `officeLocationId`: ambil dari Employee atau fallback ke `findFirst` location.
  6. `prisma.attendanceRecord.upsert` (composite unique `employeeId_date`):
     - create/update dengan `isManualOverride: true`, `overrideById: session.user.id`, `overrideReason`, dan flags.
  7. Audit log UPDATE module "Absensi".
  8. `revalidatePath("/attendance-admin")`.

#### 7.B.6 `leave.actions.ts`

##### `submitLeaveAction(formData)`
- **Parameter**: `submitLeaveSchema` (leaveTypeId, startDate, endDate, reason).
- **Langkah**:
  1. `auth()` cek session.
  2. Parse Zod.
  3. Lookup Employee + isActive guard.
  4. Service `submitLeaveRequest({ employeeId, leaveTypeId, startDate, endDate, reason })`:
     - `countWorkingDays(start, end)` (skip Sat/Sun via date-fns `isWeekend`).
     - Throw jika 0 working days.
     - `ensureLeaveBalances(employeeId, year)` → upsert balance row untuk semua active LeaveType.
     - Lookup balance; jika `workingDays > (allocated - used)` → throw "Saldo cuti tidak mencukupi".
     - `resolveInitialStage(employeeId)`: requester own role MANAGER → PENDING_HR; else cek `prisma.user.count({ role: MANAGER, isActive, employee.departmentId == requester.departmentId })`; > 0 → PENDING_MANAGER; else PENDING_HR.
     - `prisma.leaveRequest.create`.
  5. Audit CREATE module "Permintaan Cuti".
  6. `revalidatePath("/leave")`.
- **DB**: `LeaveRequest`, `LeaveBalance`, `LeaveType`, `User`, `Employee`, `AuditLog`.
- **Error**: working days = 0; saldo tidak cukup; profile tidak aktif.

##### `approveLeaveAction(input)`
- **Parameter**: `approveLeaveSchema` (leaveRequestId, notes?).
- **Langkah**:
  1. `auth()` + role MANAGER/HR_ADMIN/SUPER_ADMIN.
  2. Service `approveLeaveRequest(id, approverUserId, role, notes)` di `prisma.$transaction`:
     - findUnique include `employee.{departmentId, userId}`.
     - Self-approval guard (`employee.userId === approverUserId` → throw).
     - Branch `PENDING_MANAGER`:
       - Role harus MANAGER.
       - Cek approver employee `departmentId === request.employee.departmentId`.
       - Update LeaveRequest → `PENDING_HR`, `managerApprovedById`, `managerNotes`, `managerApprovedAt`.
     - Branch `PENDING_HR`:
       - Role harus HR_ADMIN/SUPER_ADMIN.
       - `tx.leaveBalance.update` increment `usedDays` by `workingDays` (composite unique key).
       - Update LeaveRequest → `APPROVED`, `hrApprovedById`, `hrNotes`, `hrApprovedAt`.
     - Else → "Permintaan sudah diproses sebelumnya".
  3. Audit UPDATE.
  4. `revalidatePath("/leave/manage")`, `/leave`.

##### `rejectLeaveAction(input)`
- **Parameter**: `rejectLeaveSchema` (leaveRequestId, notes wajib).
- **Langkah**:
  1. Auth + role MANAGER/HR/SUPER_ADMIN.
  2. Service `rejectLeaveRequest`:
     - findUnique with employee. Self-reject guard.
     - Branch `PENDING_MANAGER` → role MANAGER + same dept → set status REJECTED + managerNotes/At.
     - Branch `PENDING_HR` → role HR/SUPER_ADMIN → set REJECTED + hrNotes/At.
     - Else → throw "Sudah diproses".
     - **Tidak** decrement balance (karena tidak pernah di-increment di stage manager).
  3. Audit UPDATE.

##### `cancelLeaveAction(leaveRequestId)`
- **Langkah**:
  1. Auth + lookup employee.
  2. Service `cancelLeaveRequest(id, employeeId)`:
     - findUnique. Cek ownership `request.employeeId === employeeId`.
     - Cek status ∈ {PENDING_MANAGER, PENDING_HR} (selain itu tidak boleh cancel).
     - Update status `CANCELLED`.
- **Note**: tidak ada audit log di action ini.

#### 7.B.7 `payroll.actions.ts`

##### `importPayrollAction(formData)`
- **Parameter**: FormData `month`, `year`, `file`.
- **Langkah**:
  1. `requireHRAdmin()`.
  2. `importPayrollSchema.safeParse({ month, year })`.
  3. Validasi `file` instanceof File + size > 0 + extension ∈ `[.xlsx, .xls, .csv]`.
  4. `await file.arrayBuffer()` → Buffer.
  5. `parsePayrollWorkbook(buffer)` di `payroll-import.service.ts`:
     - `XLSX.read(buffer)` → `workbook`. Jika exception → file-level error.
     - Pilih sheet "Payroll" jika ada, else first sheet.
     - `sheet_to_json` array-of-array.
     - Validasi header (33 kolom: NIK, Nama Karyawan, Job Position, Organization, Grade/Level, PTKP, NPWP, 7 Earnings, 7 Deductions, 5 Benefits, 6 attendance int, Attendance Codes).
     - Loop tiap baris:
       - Skip jika full empty (NIK, Nama, BasicSalary semua kosong).
       - Required text columns: error jika empty.
       - Duplicate NIK in upload: error.
       - Numeric columns: parse via `toNumber` (handle "1.000,5" → 1000.5); reject negative.
       - Integer columns: `toInt = round(toNumber)`; reject negative.
     - Compute totals: `totalEarnings = Basic+Komunikasi+Kehadiran+Jabatan+Lainnya+Tax+THR`; `totalDeductions = BPJS Kes Emp+JHT Emp+JP Emp+PPH21+Keterlambatan+Koperasi+Lainnya`; `totalBenefits = JKK+JKM+JHT Co+JP Co+BPJS Kes Co`; `takeHomePay = totalEarnings - totalDeductions`.
     - Return `{ rows, errors }`.
  6. Jika errors > 0 → return error string `"Validasi gagal: <baris>:<kolom>: <pesan> | ... (+N lagi)"`.
  7. `matchRowsToEmployees(rows)` di `payroll.service.ts`:
     - findMany Employee `where nik in [...]`.
     - Untuk tiap row: jika tidak ditemukan → error "NIK tidak ditemukan"; inactive → error "sudah tidak aktif"; else push `MatchedRow`.
  8. Jika matchErrors > 0 → return error.
  9. `persistImportedPayroll({ month, year, rows: matched, createdBy })`:
     - `findUnique payrollRun where month_year`. Jika sudah `FINALIZED` → throw.
     - `upsert` PayrollRun (DRAFT).
     - Jika pernah ada DRAFT → `deleteMany` entries lama.
     - `createMany` PayrollEntry dari rows (snapshot semua field termasuk totals).
  10. `revalidatePath("/payroll")`, `/payroll/{id}`.
  11. Return `{ success: true, data: { payrollRunId, entryCount, warnings: [] } }`.
- **DB**: `PayrollRun`, `PayrollEntry`, `Employee`.

##### `finalizePayrollAction(input)`
- **Parameter**: `finalizePayrollSchema` (`payrollRunId`).
- **Langkah**:
  1. `requireHRAdmin()`.
  2. Parse schema.
  3. `finalizePayroll(id)` service:
     - findUnique. Tidak ada → throw. Sudah FINALIZED → throw.
     - Update `status = FINALIZED`.
  4. revalidatePath `/payroll`, `/payroll/{id}`.
- **Error**: Bubble up service errors as `{ success: false, error }`.

#### 7.B.8 `recruitment.actions.ts`

> Helper `requireHRAdmin()` di file ini lokal (mengembalikan `{ success: true, userId }` atau error).

##### `createVacancyAction(data)`
- **Langkah**:
  1. Auth HR.
  2. `createVacancySchema.safeParse(data)`.
  3. `prisma.vacancy.create({ data: parsed })`.
  4. Audit CREATE module "Lowongan" newValue {title, departmentId}.
  5. `revalidatePath("/recruitment")`.

##### `updateVacancyAction(id, data)`
- Sama, audit UPDATE; revalidate `/recruitment` dan `/recruitment/{id}`.

##### `toggleVacancyStatusAction(id)`
- **Langkah**:
  1. Auth.
  2. findUniqueOrThrow vacancy.
  3. `newStatus = vacancy.status === OPEN ? CLOSED : OPEN`.
  4. UPDATE.
  5. Audit UPDATE newValue {status}.
  6. revalidate.

##### `createCandidateAction(vacancyId, data)`
- Auth → parse `createCandidateSchema` → `prisma.candidate.create({ data: { ...parsed, vacancyId } })` → audit CREATE → revalidate `/recruitment/{vacancyId}`.

##### `updateCandidateStageAction(candidateId, data)`
- Auth → parse `updateCandidateStageSchema` → update stage (cast ke `CandidateStage`) → audit UPDATE → revalidate parent vacancy page.

##### `updateOfferAction(candidateId, data)`
- Auth → parse `updateOfferSchema` → update `offerSalary`, `offerNotes` (null-fallback) → revalidate `/recruitment/candidates/{candidateId}`.
- **Catatan**: tidak ada audit log untuk action ini (by design, since penawaran masih bersifat draft).

##### `createInterviewAction(candidateId, data)`
- Auth → parse `createInterviewSchema` (scheduledAt, interviewerName?, notes?) → `prisma.interview.create({ data: { ...parsed, candidateId } })` → revalidate candidate detail + parent vacancy.

##### `convertCandidateToEmployeeAction(candidateId)`
- **Langkah**:
  1. Auth HR.
  2. `findUniqueOrThrow Candidate` include `vacancy.department`.
  3. Guard `stage === DITERIMA`, else error "Hanya kandidat dengan status Diterima ...".
  4. `prisma.candidate.update({ data: { hiredAt: new Date() } })` (set hiredAt).
  5. Audit UPDATE module "Kandidat" newValue { hiredAt, converted: true }.
  6. Build `prefill` payload `{ fullName, email, phone, departmentId, cvPath, candidateId }`.
  7. Return `{ success: true, prefill }` — UI berikutnya redirect ke `/employees/new?fullName=...&email=...&phone=...&departmentId=...&candidateId=...` (5 query param). `CreateEmployeeForm` membaca `useSearchParams()` dan mengisi `defaultValues` untuk `namaLengkap`, `email`, `nomorHp`, `departmentId` — form ter-prefill, HR tinggal lengkapi field yang belum (password, jabatan, kontrak, dll.). Konversi DB sebenarnya dilakukan oleh `createEmployeeAction` saat HR submit form karyawan baru.

---

### 7.C Service Layer Helpers (dipakai oleh banyak actions/handlers)

Untuk kelengkapan dokumentasi, berikut fungsi service yang dipanggil banyak action:

- `createAuditLog(input)` di `lib/prisma.ts` — INSERT `AuditLog` dengan `userId`, `action`, `module`, `targetId`, `oldValue`, `newValue`. Dipakai oleh hampir semua action mutasi.
- `verifyLocation(clientIp, coords, office)` di `services/location.service.ts` — pure function, validasi IP via `ip-range-check` dan haversine GPS.
- `calculateAttendanceFlags(clockInUtc, clockOutUtc?, scheduleStart, scheduleEnd)` di `services/attendance.service.ts` — pure function, hitung `isLate`/`lateMinutes`/`isEarlyOut`/`earlyOutMinutes`/`overtimeMinutes`/`totalMinutes`. Lembur hanya diakui jika ≥ `OVERTIME_THRESHOLD_MINUTES`.
- `getMonthlyAttendanceRecap({ month, year, departmentId?, employeeId? })` — query AttendanceRecord seluruh bulan dengan join Employee/Department/Position.
- `countWorkingDays(start, end)` di `services/leave.service.ts` — exclude weekend.
- `ensureLeaveBalances(employeeId, year)` — upsert LeaveBalance untuk tiap LeaveType aktif (allocatedDays = annualQuota).
- `getAuditLogs(filters)` di `services/audit.service.ts` — pagination + filter userId/module/action/dateRange.
- `getDashboardData()`, `getSuperAdminDashboardData()`, `getHrAdminDashboardData()`, `getManagerDashboardData(userId)`, `getEmployeeDashboardData(userId)` di `services/dashboard.service.ts` — agregator role-specific (Promise.all multi-query, hitung trend 7 hari, breakdown departemen/posisi, ulang tahun mendatang, kontrak PKWT yang akan jatuh tempo, payslip terbaru, dst.).
- `parsePayrollWorkbook(buffer)`, `buildPayrollTemplate(periodLabel)` di `services/payroll-import.service.ts`.
- `matchRowsToEmployees(rows)`, `persistImportedPayroll(...)`, `finalizePayroll(id)`, `getPayrollRuns()`, `getPayrollRunDetail(id)` di `services/payroll.service.ts`.
- `getVacancies(status?)`, `getVacanciesWithPipeline(status?)`, `getVacancyById(id)`, `getCandidateById(id)`, `getRecruitmentStatsSummary()` di `services/recruitment.service.ts`.

---

*Akhir dump-part1.md.*

---

## 8. Detail Setiap Tabel Database

Schema lengkap ada di Section 1. Berikut breakdown per-model:

### 8.1 Enums

**Role**
| Value | Deskripsi |
|---|---|
| SUPER_ADMIN | Akses penuh sistem, satu-satunya yang bisa kelola Master Data, User Management, Audit Log |
| HR_ADMIN | CRUD Karyawan, Absensi, Cuti (approve stage 2), Payroll, Recruitment |
| MANAGER | Read karyawan di departemennya, approve cuti stage 1 di departemennya |
| EMPLOYEE | Default role; absen, ajukan cuti, lihat payslip & profil sendiri |

**AuditAction**: `CREATE`, `UPDATE`, `DELETE` — kategori aksi yang dicatat audit log.

**Gender**: `MALE`, `FEMALE`.

**Religion**: `ISLAM`, `KRISTEN`, `KATOLIK`, `HINDU`, `BUDDHA`, `KONGHUCU`.

**MaritalStatus**: `TK` (Tidak Kawin), `K` (Kawin).

**ContractType**: `PKWT` (Perjanjian Kerja Waktu Tertentu / kontrak), `PKWTT` (Perjanjian Kerja Waktu Tidak Tertentu / tetap).

**PTKPStatus**: `TK_0`, `TK_1`, `TK_2`, `TK_3`, `K_0`, `K_1`, `K_2`, `K_3` — Penghasilan Tidak Kena Pajak (TK=Tidak Kawin, K=Kawin, angka=jumlah tanggungan).

**DocumentType**: `KTP`, `NPWP`, `BPJS_KESEHATAN`, `BPJS_KETENAGAKERJAAN`, `KONTRAK`, `FOTO`, `LAINNYA`.

**AttendanceStatus** (derivable, untuk display): `ON_TIME`, `LATE`, `EARLY_OUT`, `OVERTIME`, `LATE_AND_EARLY_OUT`, `LATE_AND_OVERTIME`.

**LeaveStatus**: `PENDING_MANAGER`, `PENDING_HR`, `APPROVED`, `REJECTED`, `CANCELLED`.

**PayrollStatus**: `DRAFT` (bisa di-edit/re-import), `FINALIZED` (immutable).

**VacancyStatus**: `OPEN`, `CLOSED`.

**CandidateStage**: `MELAMAR`, `SELEKSI_BERKAS`, `INTERVIEW`, `PENAWARAN`, `DITERIMA`, `DITOLAK`.

---

### 8.2 Model: User (`users`)

Akun login sistem. Setiap User bisa punya 0 atau 1 Employee profile.

| Field | Deskripsi | Tipe Data | Nullable | Default | Relasi |
|---|---|---|---|---|---|
| id | Primary key cuid | String | No | cuid() | PK |
| name | Nama lengkap user | String | No | - | - |
| email | Email login (unique) | String | No | - | - |
| hashedPassword | Password bcrypt hash (cost 12) | String | No | - | - |
| role | Role enum | Role | No | EMPLOYEE | - |
| isActive | Apakah akun aktif (bisa login) | Boolean | No | true | - |
| createdAt | Timestamp create | DateTime | No | now() | - |
| updatedAt | Timestamp update | DateTime | No | @updatedAt | - |

**Relasi**:
- `auditLogs` — one-to-many ke `AuditLog` (siapa yang melakukan aksi)
- `employee` — one-to-one ke `Employee` (optional, hanya jika role EMPLOYEE/MANAGER)
- `attendanceOverrides` — one-to-many ke `AttendanceRecord` (override yang dilakukan, named relation "AttendanceOverrides")
- `leaveManagerApprovals` — one-to-many `LeaveRequest` (cuti yang diapprove sebagai Manager)
- `leaveHRApprovals` — one-to-many `LeaveRequest` (cuti yang diapprove sebagai HR)

---

### 8.3 Model: Department (`departments`)

| Field | Deskripsi | Tipe Data | Nullable | Default | Relasi |
|---|---|---|---|---|---|
| id | Primary key | String | No | cuid() | PK |
| name | Nama departemen | String | No | - | - |
| description | Deskripsi panjang | String | Yes | null | - |
| deletedAt | Soft-delete timestamp | DateTime | Yes | null | - |
| createdAt | - | DateTime | No | now() | - |
| updatedAt | - | DateTime | No | @updatedAt | - |

**Relasi**: `positions` (1:N), `employees` (1:N), `vacancies` (1:N).

---

### 8.4 Model: Position (`positions`)

Jabatan dalam departemen.

| Field | Deskripsi | Tipe Data | Nullable | Default | Relasi |
|---|---|---|---|---|---|
| id | PK | String | No | cuid() | PK |
| name | Nama jabatan | String | No | - | - |
| departmentId | FK ke Department | String | No | - | FK Department |
| deletedAt | Soft-delete | DateTime | Yes | null | - |
| createdAt | - | DateTime | No | now() | - |
| updatedAt | - | DateTime | No | @updatedAt | - |

**Relasi**: `department` (N:1), `employees` (1:N).

---

### 8.5 Model: OfficeLocation (`office_locations`)

Lokasi kantor untuk validasi clock-in/out.

| Field | Deskripsi | Tipe Data | Nullable | Default | Relasi |
|---|---|---|---|---|---|
| id | PK | String | No | cuid() | PK |
| name | Nama kantor (cabang) | String | No | - | - |
| address | Alamat lengkap | String | Yes | null | - |
| allowedIPs | Whitelist IP/CIDR | String[] | No | [] | - |
| latitude | Koordinat lintang | Float | Yes | null | - |
| longitude | Koordinat bujur | Float | Yes | null | - |
| radiusMeters | Radius geofence (meter) | Int | Yes | null | - |
| workStartTime | Jam masuk default ("HH:mm") | String | Yes | null | - |
| workEndTime | Jam pulang default ("HH:mm") | String | Yes | null | - |
| deletedAt | Soft-delete | DateTime | Yes | null | - |
| createdAt | - | DateTime | No | now() | - |
| updatedAt | - | DateTime | No | @updatedAt | - |

**Relasi**: `employees` (1:N), `attendances` (1:N).

---

### 8.6 Model: LeaveType (`leave_types`)

Jenis cuti master data (Cuti Tahunan, Cuti Sakit, Cuti Melahirkan, dll.).

| Field | Deskripsi | Tipe Data | Nullable | Default | Relasi |
|---|---|---|---|---|---|
| id | PK | String | No | cuid() | PK |
| name | Nama jenis cuti | String | No | - | - |
| annualQuota | Jatah tahunan (hari) | Int | No | - | - |
| isPaid | Cuti dibayar atau tidak | Boolean | No | true | - |
| genderRestriction | "MALE"/"FEMALE"/null | String | Yes | null | - |
| deletedAt | Soft-delete | DateTime | Yes | null | - |
| createdAt | - | DateTime | No | now() | - |
| updatedAt | - | DateTime | No | @updatedAt | - |

**Relasi**: `leaveRequests` (1:N), `leaveBalances` (1:N).

---

### 8.7 Model: AuditLog (`audit_logs`)

Catatan immutable semua mutasi penting di sistem.

| Field | Deskripsi | Tipe Data | Nullable | Default | Relasi |
|---|---|---|---|---|---|
| id | PK | String | No | cuid() | PK |
| userId | Siapa yang melakukan aksi | String | No | - | FK User |
| action | CREATE/UPDATE/DELETE | AuditAction | No | - | - |
| module | Label modul (free string) | String | No | - | - |
| targetId | ID entity yang dimutasi | String | No | - | - |
| oldValue | Snapshot before (JSON) | Json | Yes | null | - |
| newValue | Snapshot after (JSON) | Json | Yes | null | - |
| createdAt | - | DateTime | No | now() | - |

**Index**: `[userId, module, createdAt]`.

**Relasi**: `user` (N:1).

---

### 8.8 Model: Employee (`employees`)

Profil karyawan (gabungan personal info + employment + tax/BPJS). Terikat 1:1 ke User.

| Field | Deskripsi | Tipe Data | Nullable | Default | Relasi |
|---|---|---|---|---|---|
| id | PK | String | No | cuid() | PK |
| nik | NIK perusahaan EMP-YYYY-#### | String | No | - | unique |
| userId | FK User (1:1) | String | No | - | FK User unique |
| namaLengkap | Nama lengkap | String | No | - | - |
| nikKtp | NIK KTP (16 digit) | String | Yes | null | - |
| tempatLahir | Tempat lahir | String | Yes | null | - |
| tanggalLahir | Tanggal lahir | DateTime | Yes | null | - |
| jenisKelamin | Gender enum | Gender | Yes | null | - |
| statusPernikahan | TK/K | MaritalStatus | Yes | null | - |
| agama | Religion enum | Religion | Yes | null | - |
| alamat | Alamat domisili | String | Yes | null | - |
| nomorHp | Nomor HP | String | Yes | null | - |
| email | Email kerja | String | No | - | - |
| departmentId | FK Department | String | No | - | FK |
| positionId | FK Position | String | No | - | FK |
| officeLocationId | FK OfficeLocation | String | Yes | null | FK |
| contractType | PKWT/PKWTT | ContractType | No | - | - |
| joinDate | Tanggal masuk | DateTime | No | - | - |
| isActive | Status aktif kerja | Boolean | No | true | - |
| terminationDate | Tanggal berhenti | DateTime | Yes | null | - |
| terminationReason | Alasan berhenti | String | Yes | null | - |
| npwp | Nomor NPWP | String | Yes | null | - |
| ptkpStatus | PTKP enum | PTKPStatus | Yes | null | - |
| bpjsKesehatanNo | Nomor BPJS Kes | String | Yes | null | - |
| bpjsKetenagakerjaanNo | Nomor BPJS TK | String | Yes | null | - |
| isTaxBorneByCompany | PPh 21 ditanggung perusahaan | Boolean | No | false | - |
| createdAt | - | DateTime | No | now() | - |
| updatedAt | - | DateTime | No | @updatedAt | - |

**Relasi**: `user` (1:1), `department` (N:1), `position` (N:1), `officeLocation` (N:1 optional), `documents` (1:N), `emergencyContacts` (1:N), `attendances` (1:N), `leaveRequests` (1:N), `leaveBalances` (1:N), `allowances` (1:N), `payrollEntries` (1:N).

---

### 8.9 Model: EmployeeDocument (`employee_documents`)

Dokumen karyawan (PDF/image), file disimpan di **local filesystem** di folder `<projectRoot>/uploads/employees/<employeeId>/`. Allowed MIME: `application/pdf`, `image/jpeg`, `image/png`. Max size 5 MB.

| Field | Deskripsi | Tipe Data | Nullable | Default | Relasi |
|---|---|---|---|---|---|
| id | PK | String | No | cuid() | PK |
| employeeId | FK Employee | String | No | - | FK (cascade delete) |
| documentType | Jenis dokumen | DocumentType | No | - | - |
| fileName | Nama asli file (sebelum sanitasi) | String | No | - | - |
| filePath | Relative path di disk, format `uploads/employees/<employeeId>/<timestamp>-<sanitized-filename>` (digabung dengan `process.cwd()` saat read/delete) | String | No | - | - |
| fileSize | Ukuran (bytes) | Int | No | - | - |
| mimeType | MIME type | String | No | - | - |
| createdAt | - | DateTime | No | now() | - |
| updatedAt | - | DateTime | No | @updatedAt | - |

**onDelete**: Cascade — kalau Employee dihapus (jarang terjadi karena soft-deactivate), dokumennya ikut.

---

### 8.10 Model: EmergencyContact (`emergency_contacts`)

Maks 3 kontak per karyawan (validasi di action layer).

| Field | Deskripsi | Tipe Data | Nullable | Default | Relasi |
|---|---|---|---|---|---|
| id | PK | String | No | cuid() | PK |
| employeeId | FK Employee | String | No | - | FK (cascade) |
| name | Nama kontak | String | No | - | - |
| relationship | Hubungan (Suami/Istri/Ortu/dll) | String | No | - | - |
| phone | Nomor HP kontak | String | No | - | - |
| address | Alamat kontak (opsional) | String | Yes | null | - |
| createdAt | - | DateTime | No | now() | - |
| updatedAt | - | DateTime | No | @updatedAt | - |

---

### 8.11 Model: AttendanceRecord (`attendance_records`)

Satu row per karyawan per tanggal (unique `[employeeId, date]`).

| Field | Deskripsi | Tipe Data | Nullable | Default | Relasi |
|---|---|---|---|---|---|
| id | PK | String | No | cuid() | PK |
| employeeId | FK Employee | String | No | - | FK |
| officeLocationId | FK OfficeLocation | String | No | - | FK |
| date | Tanggal absen (Date only, UTC midnight) | DateTime @db.Date | No | - | - |
| clockIn | Timestamp clock-in (UTC) | DateTime | Yes | null | - |
| clockOut | Timestamp clock-out (UTC) | DateTime | Yes | null | - |
| clockInIp | IP saat clock-in | String | Yes | null | - |
| clockOutIp | IP saat clock-out | String | Yes | null | - |
| clockInLat | Lintang GPS clock-in | Float | Yes | null | - |
| clockInLon | Bujur GPS clock-in | Float | Yes | null | - |
| isLate | Telat masuk | Boolean | No | false | - |
| lateMinutes | Menit telat | Int | No | 0 | - |
| isEarlyOut | Pulang sebelum jam | Boolean | No | false | - |
| earlyOutMinutes | Menit early-out | Int | No | 0 | - |
| overtimeMinutes | Menit lembur (≥ threshold) | Int | No | 0 | - |
| totalMinutes | Total menit kerja | Int | No | 0 | - |
| isManualOverride | Ditambahkan/diedit manual oleh HR | Boolean | No | false | - |
| overrideById | FK User HR yang override | String | Yes | null | FK User |
| overrideReason | Alasan override | String | Yes | null | - |
| createdAt | - | DateTime | No | now() | - |
| updatedAt | - | DateTime | No | @updatedAt | - |

**Constraints**:
- `@@unique([employeeId, date])` — 1 record per karyawan per hari.
- `@@index([employeeId, date])`.

---

### 8.12 Model: LeaveRequest (`leave_requests`)

Pengajuan cuti dengan 2-stage approval.

| Field | Deskripsi | Tipe Data | Nullable | Default | Relasi |
|---|---|---|---|---|---|
| id | PK | String | No | cuid() | PK |
| employeeId | FK pengaju | String | No | - | FK Employee |
| leaveTypeId | FK jenis cuti | String | No | - | FK LeaveType |
| startDate | Tanggal mulai (Date) | DateTime | No | - | - |
| endDate | Tanggal akhir (Date) | DateTime | No | - | - |
| workingDays | Jumlah hari kerja | Int | No | - | - |
| reason | Alasan pengajuan | String | No | - | - |
| status | LeaveStatus enum | LeaveStatus | No | PENDING_MANAGER | - |
| managerApprovedById | FK User Manager approver | String | Yes | null | FK User |
| managerNotes | Catatan manager | String | Yes | null | - |
| managerApprovedAt | Timestamp approve manager | DateTime | Yes | null | - |
| hrApprovedById | FK User HR approver | String | Yes | null | FK User |
| hrNotes | Catatan HR | String | Yes | null | - |
| hrApprovedAt | Timestamp approve HR | DateTime | Yes | null | - |
| createdAt | - | DateTime | No | now() | - |
| updatedAt | - | DateTime | No | @updatedAt | - |

**Index**: `[employeeId, status]`, `[status, createdAt]`.

---

### 8.13 Model: LeaveBalance (`leave_balances`)

Saldo cuti per karyawan per leave type per tahun.

| Field | Deskripsi | Tipe Data | Nullable | Default | Relasi |
|---|---|---|---|---|---|
| id | PK | String | No | cuid() | PK |
| employeeId | FK Employee | String | No | - | FK |
| leaveTypeId | FK LeaveType | String | No | - | FK |
| year | Tahun (e.g. 2026) | Int | No | - | - |
| allocatedDays | Jatah tahunan (snapshot dari LeaveType.annualQuota) | Int | No | - | - |
| usedDays | Hari yang sudah dipakai (di-increment saat APPROVED) | Int | No | 0 | - |
| createdAt | - | DateTime | No | now() | - |
| updatedAt | - | DateTime | No | @updatedAt | - |

**Constraint**: `@@unique([employeeId, leaveTypeId, year])`.

---

### 8.14 Model: PayrollRun (`payroll_runs`)

Periode payroll bulanan.

| Field | Deskripsi | Tipe Data | Nullable | Default | Relasi |
|---|---|---|---|---|---|
| id | PK | String | No | cuid() | PK |
| month | Bulan 1-12 | Int | No | - | - |
| year | Tahun | Int | No | - | - |
| status | DRAFT/FINALIZED | PayrollStatus | No | DRAFT | - |
| createdBy | userId pembuat | String | No | - | - |
| createdAt | - | DateTime | No | now() | - |
| updatedAt | - | DateTime | No | @updatedAt | - |

**Constraint**: `@@unique([month, year])` — satu run per periode.

**Relasi**: `entries` (1:N PayrollEntry).

---

### 8.16 Model: PayrollEntry (`payroll_entries`)

Snapshot payslip per karyawan per periode (immutable setelah finalize). Semua nilai di-import dari Excel HR.

| Field | Deskripsi | Tipe Data | Nullable | Default | Relasi |
|---|---|---|---|---|---|
| id | PK | String | No | cuid() | PK |
| payrollRunId | FK PayrollRun | String | No | - | FK (cascade delete) |
| employeeId | FK Employee | String | No | - | FK |
| **Employee Snapshot** | | | | | |
| employeeNik | NIK (snapshot) | String | No | - | - |
| employeeName | Nama (snapshot) | String | No | - | - |
| jobPosition | Jabatan (snapshot) | String | No | "" | - |
| organization | Departemen (snapshot) | String | No | "" | - |
| gradeLevel | Grade/level | String | No | "" | - |
| ptkpStatus | PTKP saat itu | String | No | "" | - |
| npwp | NPWP saat itu | String | Yes | null | - |
| **Earnings (Decimal 15,2)** | | | | | |
| basicSalary | Gaji pokok | Decimal | No | 0 | - |
| tunjanganKomunikasi | Tunjangan komunikasi | Decimal | No | 0 | - |
| tunjanganKehadiran | Tunjangan kehadiran | Decimal | No | 0 | - |
| tunjanganJabatan | Tunjangan jabatan | Decimal | No | 0 | - |
| tunjanganLainnya | Tunjangan lain | Decimal | No | 0 | - |
| taxAllowance | Tunjangan pajak | Decimal | No | 0 | - |
| thr | THR | Decimal | No | 0 | - |
| totalEarnings | Total pendapatan | Decimal | No | - | - |
| **Deductions (Decimal 15,2)** | | | | | |
| bpjsKesehatanEmployee | Potongan BPJS Kes (employee) | Decimal | No | 0 | - |
| jhtEmployee | Potongan JHT (employee) | Decimal | No | 0 | - |
| jaminanPensiunEmployee | Potongan JP (employee) | Decimal | No | 0 | - |
| pph21 | PPh21 | Decimal | No | 0 | - |
| potonganKeterlambatan | Potongan terlambat | Decimal | No | 0 | - |
| potonganKoperasi | Potongan koperasi | Decimal | No | 0 | - |
| potonganLainnya | Potongan lain | Decimal | No | 0 | - |
| totalDeductions | Total potongan | Decimal | No | - | - |
| takeHomePay | THP final | Decimal | No | - | - |
| **Benefits (porsi perusahaan, informational)** | | | | | |
| jkk | Jaminan Kecelakaan Kerja | Decimal | No | 0 | - |
| jkm | Jaminan Kematian | Decimal | No | 0 | - |
| jhtCompany | JHT porsi perusahaan | Decimal | No | 0 | - |
| jaminanPensiunCompany | JP porsi perusahaan | Decimal | No | 0 | - |
| bpjsKesehatanCompany | BPJS Kes porsi perusahaan | Decimal | No | 0 | - |
| totalBenefits | Total benefit | Decimal | No | - | - |
| **Attendance Summary** | | | | | |
| actualWorkingDay | Hari kerja aktual | Int | No | 0 | - |
| scheduleWorkingDay | Hari kerja terjadwal | Int | No | 0 | - |
| dayoff | Hari libur | Int | No | 0 | - |
| nationalHoliday | Libur nasional | Int | No | 0 | - |
| companyHoliday | Libur perusahaan | Int | No | 0 | - |
| specialHoliday | Libur khusus | Int | No | 0 | - |
| attendanceCodes | String kode kehadiran | String | No | "" | - |
| createdAt | - | DateTime | No | now() | - |
| updatedAt | - | DateTime | No | @updatedAt | - |

**Constraint**: `@@unique([payrollRunId, employeeId])` — 1 entry per karyawan per periode.

**Index**: `[payrollRunId]`, `[employeeId]`.

---

### 8.17 Model: Vacancy (`vacancies`)

Lowongan pekerjaan.

| Field | Deskripsi | Tipe Data | Nullable | Default | Relasi |
|---|---|---|---|---|---|
| id | PK | String | No | cuid() | PK |
| title | Judul lowongan | String | No | - | - |
| departmentId | FK Department | String | No | - | FK |
| description | Deskripsi (rich text) | String @db.Text | No | - | - |
| requirements | Persyaratan (rich text) | String @db.Text | No | - | - |
| status | OPEN/CLOSED | VacancyStatus | No | OPEN | - |
| openDate | Tanggal buka | DateTime | No | - | - |
| closeDate | Tanggal tutup | DateTime | Yes | null | - |
| createdAt | - | DateTime | No | now() | - |
| updatedAt | - | DateTime | No | @updatedAt | - |

**Relasi**: `department` (N:1), `candidates` (1:N).

---

### 8.18 Model: Candidate (`candidates`)

Pelamar kerja.

| Field | Deskripsi | Tipe Data | Nullable | Default | Relasi |
|---|---|---|---|---|---|
| id | PK | String | No | cuid() | PK |
| vacancyId | FK Vacancy | String | No | - | FK |
| name | Nama pelamar | String | No | - | - |
| email | Email | String | No | - | - |
| phone | HP | String | Yes | null | - |
| stage | CandidateStage enum | CandidateStage | No | MELAMAR | - |
| cvPath | Relative path CV di local filesystem (mis. `/uploads/cv/<candidateId>-cv.pdf`); resolve dengan `process.cwd()` saat baca dari disk | String | Yes | null | - |
| notes | Catatan internal | String @db.Text | Yes | null | - |
| offerSalary | Tawaran gaji (Decimal 15,2) | Decimal | Yes | null | - |
| offerNotes | Catatan offer | String @db.Text | Yes | null | - |
| hiredAt | Tanggal di-convert ke Employee | DateTime | Yes | null | - |
| createdAt | - | DateTime | No | now() | - |
| updatedAt | - | DateTime | No | @updatedAt | - |

**Relasi**: `vacancy` (N:1), `interviews` (1:N).

---

### 8.19 Model: Interview (`interviews`)

Jadwal wawancara per kandidat.

| Field | Deskripsi | Tipe Data | Nullable | Default | Relasi |
|---|---|---|---|---|---|
| id | PK | String | No | cuid() | PK |
| candidateId | FK Candidate | String | No | - | FK |
| scheduledAt | Waktu interview | DateTime | No | - | - |
| interviewerName | Nama interviewer | String | Yes | null | - |
| notes | Catatan hasil | String @db.Text | Yes | null | - |
| createdAt | - | DateTime | No | now() | - |
| updatedAt | - | DateTime | No | @updatedAt | - |

**Relasi**: `candidate` (N:1).

---

*Akhir dump-part3.md.*

---

## 9. Validasi Form

Semua validasi pakai **Zod 4** + **react-hook-form** via `@hookform/resolvers/zod` di client. Server action juga re-validasi (`safeParse` / `parse`) sebagai defense-in-depth.

Pesan error berbahasa Indonesia. Error pertama dari `parsed.error.issues[0]?.message` dilempar ke client untuk ditampilkan via Sonner toast.

---

### 9.1 loginSchema

**File**: `src/lib/validations/auth.ts`
**Dipakai di**: `src/app/(auth)/login/page.tsx`

| Field | Type | Rules | Error Message |
|---|---|---|---|
| email | string | email() | "Format email tidak valid" |
| password | string | min(1) | "Password wajib diisi" |

---

### 9.2 createEmployeeSchema

**File**: `src/lib/validations/employee.ts`
**Dipakai di**: `src/app/(dashboard)/employees/new/_components/create-employee-form.tsx`

| Field | Type | Rules | Error Message |
|---|---|---|---|
| namaLengkap | string | min(2), max(100) | "Nama minimal 2 karakter", "Nama maksimal 100 karakter" |
| email | string | email() | "Email tidak valid" |
| initialPassword | string | min(8) + regex `[A-Z]`, `[a-z]`, `[0-9]` | "Password minimal 8 karakter", "Harus mengandung huruf besar/kecil/angka" |
| departmentId | string | min(1) | "Departemen wajib dipilih" |
| positionId | string | min(1) | "Jabatan wajib dipilih" |
| contractType | enum (PKWT/PKWTT) | nativeEnum(ContractType) | "Tipe kontrak tidak valid" |
| joinDate | date | coerce.date() | (auto-coerce) |
| nikKtp | string? | length(16) atau "" | "NIK KTP harus 16 digit" |
| tempatLahir | string? | optional | - |
| tanggalLahir | date? | coerce.date() optional | - |
| jenisKelamin | enum? | Gender (MALE/FEMALE) | - |
| statusPernikahan | enum? | MaritalStatus (TK/K) | - |
| agama | enum? | Religion (ISLAM/KRISTEN/...) | - |
| alamat | string? | optional | - |
| nomorHp | string? | optional | - |
| npwp | string? | optional | - |
| ptkpStatus | enum? | PTKPStatus (TK_0..K_3) | - |
| bpjsKesehatanNo | string? | optional | - |
| bpjsKetenagakerjaanNo | string? | optional | - |

---

### 9.3 updatePersonalInfoSchema

**File**: `src/lib/validations/employee.ts`
**Dipakai di**: `src/app/(dashboard)/employees/[id]/_components/personal-info-tab.tsx`

| Field | Type | Rules | Error Message |
|---|---|---|---|
| namaLengkap | string | min(2), max(100) | "Nama minimal 2 karakter", "Nama maksimal 100 karakter" |
| nikKtp | string? | length(16) atau "" | "NIK KTP harus 16 digit" |
| tempatLahir | string? | optional | - |
| tanggalLahir | date? | optional | - |
| jenisKelamin | enum? | Gender | - |
| statusPernikahan | enum? | MaritalStatus | - |
| agama | enum? | Religion | - |
| alamat | string? | optional | - |
| nomorHp | string? | optional | - |

---

### 9.4 updateEmploymentSchema

**File**: `src/lib/validations/employee.ts`
**Dipakai di**: `src/app/(dashboard)/employees/[id]/_components/employment-details-tab.tsx`

| Field | Type | Rules | Error Message |
|---|---|---|---|
| departmentId | string | min(1) | "Departemen wajib dipilih" |
| positionId | string | min(1) | "Jabatan wajib dipilih" |
| contractType | enum | nativeEnum(ContractType) | "Tipe kontrak tidak valid" |
| joinDate | date | coerce.date() | (auto) |
| officeLocationId | string? | optional | - |

---

### 9.5 updateTaxBpjsSchema

**File**: `src/lib/validations/employee.ts`
**Dipakai di**: `src/app/(dashboard)/employees/[id]/_components/tax-bpjs-tab.tsx`

| Field | Type | Rules | Error Message |
|---|---|---|---|
| npwp | string? | optional | - |
| ptkpStatus | enum? | PTKPStatus | - |
| bpjsKesehatanNo | string? | optional | - |
| bpjsKetenagakerjaanNo | string? | optional | - |
| isTaxBorneByCompany | boolean? | optional | - |

---

### 9.6 emergencyContactSchema

**File**: `src/lib/validations/employee.ts`
**Dipakai di**: `src/app/(dashboard)/employees/[id]/_components/emergency-contacts-tab.tsx`

| Field | Type | Rules | Error Message |
|---|---|---|---|
| name | string | min(1) | "Nama wajib diisi" |
| relationship | string | min(1) | "Hubungan wajib diisi" |
| phone | string | min(1) | "Nomor telepon wajib diisi" |
| address | string? | optional | - |

**Tambahan validasi action layer**: max 3 kontak per employee (`prisma.emergencyContact.count` cek sebelum create).

---

### 9.7 deactivateEmployeeSchema

**File**: `src/lib/validations/employee.ts`
**Dipakai di**: `src/app/(dashboard)/employees/[id]/_components/deactivate-employee-dialog.tsx`

| Field | Type | Rules | Error Message |
|---|---|---|---|
| terminationDate | date | coerce.date() | (auto) |
| terminationReason | string | min(1) | "Alasan wajib diisi" |

---

### 9.8 clockActionSchema & manualAttendanceSchema

**File**: `src/lib/validations/attendance.ts`

**clockActionSchema** (dipakai di `clock-in-button.tsx` saat call action):

| Field | Type | Rules | Error Message |
|---|---|---|---|
| latitude | number? | optional | - |
| longitude | number? | optional | - |

**manualAttendanceSchema** (dipakai di `manual-record-dialog.tsx`):

| Field | Type | Rules | Error Message |
|---|---|---|---|
| employeeId | string | min(1) | "Karyawan wajib dipilih" |
| date | date | coerce.date() | (auto) |
| clockIn | string | regex /^\d{2}:\d{2}$/ | "Format jam tidak valid" |
| clockOut | string? | regex /^\d{2}:\d{2}$/ atau "" | "Format jam tidak valid" |
| overrideReason | string | min(1) | "Alasan wajib diisi" |

---

### 9.9 submitLeaveSchema

**File**: `src/lib/validations/leave.ts`
**Dipakai di**: `src/app/(dashboard)/leave/_components/leave-request-form.tsx`

| Field | Type | Rules | Error Message |
|---|---|---|---|
| leaveTypeId | string | min(1) | "Jenis cuti wajib dipilih" |
| startDate | date | coerce.date() | (auto) |
| endDate | date | coerce.date() | (auto) |
| reason | string | min(1), max(500) | "Alasan wajib diisi", "Alasan maksimal 500 karakter" |

**Refine** (cross-field): `endDate >= startDate` else error "Tanggal akhir harus sama atau setelah tanggal mulai" (path: `endDate`).

**Validasi business layer (di service)**:
- workingDays > 0 (tanggal harus mengandung hari kerja non-weekend) → "Rentang tanggal tidak mencakup hari kerja"
- workingDays ≤ saldo cuti tersisa → "Saldo cuti tidak mencukupi. Sisa: X hari, dibutuhkan: Y hari"

---

### 9.10 approveLeaveSchema & rejectLeaveSchema

**File**: `src/lib/validations/leave.ts`
**Dipakai di**: `src/app/(dashboard)/leave/manage/_components/approve-reject-dialog.tsx`

**approveLeaveSchema**:
| Field | Type | Rules | Error Message |
|---|---|---|---|
| leaveRequestId | string | min(1) | (id wajib) |
| notes | string? | optional | - |

**rejectLeaveSchema**:
| Field | Type | Rules | Error Message |
|---|---|---|---|
| leaveRequestId | string | min(1) | (id wajib) |
| notes | string | min(1) | "Alasan penolakan wajib diisi" |

---

### 9.11 departmentSchema

**File**: `src/lib/validations/master-data.ts`
**Dipakai di**: `src/app/(dashboard)/master-data/_components/department-form-dialog.tsx`

| Field | Type | Rules | Error Message |
|---|---|---|---|
| name | string | min(2), max(100) | "Nama departemen minimal 2 karakter", "Nama departemen maksimal 100 karakter" |
| description | string? | max(500) | "Deskripsi maksimal 500 karakter" |

---

### 9.12 positionSchema

**File**: `src/lib/validations/master-data.ts`
**Dipakai di**: `src/app/(dashboard)/master-data/_components/position-form-dialog.tsx`

| Field | Type | Rules | Error Message |
|---|---|---|---|
| name | string | min(2), max(100) | "Nama jabatan minimal 2 karakter", "Nama jabatan maksimal 100 karakter" |
| departmentId | string | min(1) | "Departemen wajib dipilih" |

---

### 9.13 officeLocationSchema

**File**: `src/lib/validations/master-data.ts`
**Dipakai di**: `src/app/(dashboard)/master-data/_components/office-location-form-dialog.tsx`

| Field | Type | Rules | Error Message |
|---|---|---|---|
| name | string | min(2) | "Nama lokasi minimal 2 karakter" |
| address | string? | optional | - |
| allowedIPs | string[]? | optional array of CIDR | - |
| latitude | number? | nullable optional | - |
| longitude | number? | nullable optional | - |
| radiusMeters | number? | min(50), max(10000), nullable | "Radius minimal 50 meter", "Radius maksimal 10000 meter" |

---

### 9.14 leaveTypeSchema

**File**: `src/lib/validations/master-data.ts`
**Dipakai di**: `src/app/(dashboard)/master-data/_components/leave-type-form-dialog.tsx`

| Field | Type | Rules | Error Message |
|---|---|---|---|
| name | string | min(2) | "Nama jenis cuti minimal 2 karakter" |
| annualQuota | number | min(0), max(365) | "Kuota minimal 0", "Kuota maksimal 365 hari" |
| isPaid | boolean | required | - |
| genderRestriction | enum? | "MALE" \| "FEMALE" \| null | - |

---

### 9.15 importPayrollSchema & finalizePayrollSchema

**File**: `src/lib/validations/payroll.ts`

**importPayrollSchema** (dipakai di `import-payroll-form.tsx`):
| Field | Type | Rules | Error Message |
|---|---|---|---|
| month | number | int(), min(1), max(12) | (default Zod) |
| year | number | int(), min(2024), max(2099) | (default Zod) |

Validasi tambahan di action: file harus `.xlsx`/`.xls`/`.csv`, size > 0 → "Format file harus .xlsx, .xls, atau .csv" / "File belum dipilih".

**finalizePayrollSchema** (dipakai di `finalize-button.tsx`):
| Field | Type | Rules | Error Message |
|---|---|---|---|
| payrollRunId | string | min(1) | (id wajib) |

---

### 9.16 createVacancySchema

**File**: `src/lib/validations/recruitment.ts`
**Dipakai di**: `src/app/(dashboard)/recruitment/new/_components/create-vacancy-form.tsx`

| Field | Type | Rules | Error Message |
|---|---|---|---|
| title | string | min(1) | "Judul posisi wajib diisi" |
| departmentId | string | min(1) | "Departemen wajib dipilih" |
| description | string | min(1) | "Deskripsi pekerjaan wajib diisi" |
| requirements | string | min(1) | "Persyaratan wajib diisi" |
| openDate | date | coerce.date() | (auto) |
| closeDate | date? | optional | - |

**updateVacancySchema** = `createVacancySchema.partial()` — semua field optional.

---

### 9.17 createCandidateSchema

**File**: `src/lib/validations/recruitment.ts`
**Dipakai di**: `src/app/(dashboard)/recruitment/[vacancyId]/_components/add-candidate-dialog.tsx`

| Field | Type | Rules | Error Message |
|---|---|---|---|
| name | string | min(1) | "Nama kandidat wajib diisi" |
| email | string | email() | "Format email tidak valid" |
| phone | string? | optional | - |
| notes | string? | optional | - |

---

### 9.18 updateCandidateStageSchema

**File**: `src/lib/validations/recruitment.ts`
**Dipakai di**: drag-and-drop di `kanban-board.tsx` & dropdown di `candidate-detail-client.tsx`

| Field | Type | Rules | Error Message |
|---|---|---|---|
| stage | enum | "MELAMAR"\|"SELEKSI_BERKAS"\|"INTERVIEW"\|"PENAWARAN"\|"DITERIMA"\|"DITOLAK" | (Zod default) |

---

### 9.19 updateOfferSchema

**File**: `src/lib/validations/recruitment.ts`
**Dipakai di**: `src/app/(dashboard)/recruitment/candidates/[candidateId]/_components/candidate-detail-client.tsx`

| Field | Type | Rules | Error Message |
|---|---|---|---|
| offerSalary | number? | coerce.number().positive() | (default) |
| offerNotes | string? | optional | - |

---

### 9.20 createInterviewSchema

**File**: `src/lib/validations/recruitment.ts`
**Dipakai di**: form jadwal interview di `candidate-detail-client.tsx`

| Field | Type | Rules | Error Message |
|---|---|---|---|
| scheduledAt | date | coerce.date() | (auto) |
| interviewerName | string? | optional | - |
| notes | string? | optional | - |

---

### 9.21 createUserSchema & updateUserSchema

**File**: `src/lib/validations/user.ts`
**Dipakai di**: `src/app/(dashboard)/users/_components/user-form-dialog.tsx`

**createUserSchema**:
| Field | Type | Rules | Error Message |
|---|---|---|---|
| name | string | min(2), max(100) | "Nama minimal 2 karakter", "Nama maksimal 100 karakter" |
| email | string | email() | "Format email tidak valid" |
| password | string | min(8) + regex (uppercase + lowercase + digit) | "Password minimal 8 karakter", "Password harus mengandung huruf besar, huruf kecil, dan angka" |
| role | enum | nativeEnum(Role) | "Peran tidak valid" |

**updateUserSchema** (password tidak ada di update — terpisah jika user mau ganti):
| Field | Type | Rules | Error Message |
|---|---|---|---|
| name | string | min(2), max(100) | sama dengan create |
| email | string | email() | "Format email tidak valid" |
| role | enum | nativeEnum(Role) | "Peran tidak valid" |

---


---

## 10. Tech Stack & Dependencies

### 10.A — Production Dependencies

Berasal dari `package.json` (versi sesuai snapshot):

| Package | Versi | Fungsi |
|---|---|---|
| @auth/prisma-adapter | ^2.11.1 | Adapter NextAuth ke database via Prisma (saat ini tidak aktif karena pakai JWT strategy + custom credentials) |
| @dnd-kit/core | ^6.3.1 | Engine drag-and-drop untuk Kanban kandidat di recruitment |
| @dnd-kit/sortable | ^10.0.0 | Sortable extension @dnd-kit untuk reorder dalam kolom |
| @dnd-kit/utilities | ^3.2.2 | Utility helper (CSS, transform) untuk @dnd-kit |
| @hookform/resolvers | ^5.2.2 | Bridge react-hook-form ↔ Zod (zodResolver) |
| @prisma/client | ^6.19.2 | Prisma runtime client (di-generate ke `src/generated/prisma`) |
| @radix-ui/react-alert-dialog | ^1.1.15 | Primitive alert dialog (basis shadcn/ui AlertDialog) |
| @radix-ui/react-avatar | ^1.1.11 | Primitive Avatar |
| @radix-ui/react-collapsible | ^1.1.12 | Primitive Collapsible (sidebar group) |
| @radix-ui/react-dialog | ^1.1.15 | Primitive Dialog |
| @radix-ui/react-dropdown-menu | ^2.1.16 | Primitive DropdownMenu |
| @radix-ui/react-label | ^2.1.8 | Primitive Label |
| @radix-ui/react-popover | ^1.1.15 | Primitive Popover (date picker, dll.) |
| @radix-ui/react-progress | ^1.1.8 | Primitive Progress bar |
| @radix-ui/react-scroll-area | ^1.2.10 | Primitive ScrollArea custom scrollbar |
| @radix-ui/react-select | ^2.2.6 | Primitive Select combobox |
| @radix-ui/react-separator | ^1.1.8 | Primitive Separator garis |
| @radix-ui/react-slot | ^1.2.4 | Slot polymorphic (asChild prop di shadcn Button) |
| @radix-ui/react-tabs | ^1.1.13 | Primitive Tabs |
| @radix-ui/react-toast | ^1.2.15 | Primitive Toast (legacy, akan di-deprecate ke Sonner) |
| @radix-ui/react-tooltip | ^1.2.8 | Primitive Tooltip |
| @react-pdf/renderer | ^4.3.2 | Generate PDF di server side untuk payslip, attendance report, offer letter |
| @tanstack/react-table | ^8.21.3 | Headless table (sorting, pagination, filter) untuk semua DataTable |
| bcryptjs | ^3.0.3 | Hash password user (cost factor 12) |
| class-variance-authority | ^0.7.1 | Definisi varian Tailwind class untuk Button/Badge |
| clsx | ^2.1.1 | Conditional class util (dipakai di `cn()`) |
| date-fns | ^4.1.0 | Manipulasi tanggal (format, eachDayOfInterval, isWeekend, startOfWeek, dst.) |
| date-fns-tz | ^3.2.0 | Timezone conversion UTC ↔ Asia/Jakarta (WIB) untuk attendance |
| decimal.js | ^10.6.0 | Type Decimal untuk kolom DB Prisma (gaji, payroll). **Tidak dipakai untuk kalkulasi aktif** — sistem payroll pakai Excel import (kalkulasi eksternal oleh HR). Konstanta legacy yang masih `new Decimal(...)` di `constants.ts` tidak di-import di mana pun. |
| dotenv | ^17.3.1 | Load `.env` di seed script |
| ip-range-check | ^0.2.0 | Cek apakah IP berada dalam range CIDR (validasi clock-in) |
| lucide-react | ^0.575.0 | Ikon SVG (Building, User, Calendar, dll. di sidebar dan pages) |
| next | 14.2.35 | Next.js framework (App Router) |
| next-auth | ^5.0.0-beta.30 | Authentication library (versi 5 / Auth.js) |
| next-themes | ^0.4.6 | Theme switcher (light/dark — saat ini single light theme) |
| nuqs | ^2.8.8 | Type-safe URL search params untuk filter di list pages |
| react | ^18 | React core |
| react-day-picker | ^9.14.0 | Calendar picker (komponen `<Calendar/>`) |
| react-dom | ^18 | React DOM |
| react-hook-form | ^7.71.2 | Form state management |
| recharts | ^2.15.4 | Charting library (LineChart untuk dashboard trend) |
| sonner | ^2.0.7 | Toast notification (success/error feedback dari server actions) |
| tailwind-merge | ^3.5.0 | Merge Tailwind class tanpa konflik (dipakai di `cn()`) |
| tailwindcss-animate | ^1.0.7 | Plugin animasi Tailwind (slide-in, fade) |
| xlsx | ^0.18.5 | Parsing & generate Excel file (payroll import + template) |
| zod | ^4.3.6 | Runtime schema validation (semua form + server action input) |

### 10.B — DevDependencies

| Package | Versi | Fungsi |
|---|---|---|
| @types/bcryptjs | ^2.4.6 | TypeScript types untuk bcryptjs |
| @types/node | ^20 | TypeScript types untuk Node.js builtins |
| @types/react | ^18 | TS types React |
| @types/react-dom | ^18 | TS types ReactDOM |
| @types/xlsx | ^0.0.35 | TS types xlsx |
| eslint | ^8 | Linter |
| eslint-config-next | 14.2.35 | Konfigurasi ESLint Next.js (Core Web Vitals + React Hooks) |
| postcss | ^8 | CSS processor (Tailwind requires) |
| prisma | ^6.19.2 | Prisma CLI (migrate, generate, db push) |
| tailwindcss | ^3.4.1 | Utility-first CSS framework |
| tsx | ^4.21.0 | TypeScript executor untuk seed script (`npx tsx prisma/seed.ts`) |
| typescript | ^5 | TypeScript compiler |

### 10.C — Environment Variables

Berdasarkan grep `process.env.*` + referensi di schema.prisma + library yang digunakan:

| Nama | Wajib | Sumber | Fungsi |
|---|---|---|---|
| DATABASE_URL | Yes | `prisma/schema.prisma` `datasource db { url = env("DATABASE_URL") }` | Connection string PostgreSQL (host, port, user, password, db name, schema) |
| NODE_ENV | Auto | `src/lib/prisma.ts` (Prisma log level), Next.js core | "development"/"production"/"test" |
| AUTH_SECRET | Yes | NextAuth v5 (Auth.js) — required signing secret | Random string untuk sign JWT cookie session |
| NEXTAUTH_URL | Optional (auto-detect) | NextAuth | URL canonical aplikasi (e.g. `http://localhost:3000` di dev, `https://hrms.example.com` di prod) — biasanya auto-detect di Vercel |

Catatan: tidak ada referensi `process.env` lain di `src/`. Tidak ada Vercel Blob token, tidak ada SMTP, tidak ada API key external. File upload (employee documents) menggunakan local filesystem (`fs/promises.unlink`, `path.join(process.cwd(), filePath)`). Storage path mengikuti `process.cwd()` relatif.

### 10.D — Konfigurasi Build & Deployment

**`next.config.mjs`**:
```js
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};
```
Hanya menaikkan body size limit Server Actions ke 5 MB (default 1 MB) supaya bisa upload Excel payroll + dokumen karyawan ≤ 5 MB.

**`package.json` scripts**:
- `npm run dev` — `next dev` (port 3000, hot reload)
- `npm run build` — `next build` (production bundle)
- `npm run start` — `next start` (run production)
- `npm run lint` — `next lint`

**Prisma**:
- `prisma generate` — generate client ke `src/generated/prisma/` (custom output path).
- `prisma migrate dev/deploy` — migration. Folder `prisma/migrations/` punya 8 migrations:
  - 20260227160142_init
  - 20260304155331_add_employee_models
  - 20260305221746_add_attendance_leave_models
  - 20260307120948_add_payroll_models
  - 20260308081802_add_recruitment_models
  - 20260413133047_add_is_tax_borne_by_company
  - 20260429100000_leave_two_stage_approval
  - 20260507120000_cleanup_dead_fields_and_payroll_pivot (Paket A — drop `baseSalary`, `EmployeeAllowance`, `attachmentPath/Name`, sync payroll pivot columns)
- Seed: `npx tsx prisma/seed.ts` (idempotent, findFirst-before-create guards).

**Deployment**: kandidat utama Vercel (Next.js 14 + serverless). Tidak ada `vercel.json` di repo (default config Vercel). Postgres bisa pakai Vercel Postgres / Neon / Supabase. Migrasi dijalankan via `prisma migrate deploy` di Vercel build step (perlu env `DATABASE_URL`).

---


---

## 11. Middleware & Auth

Sistem autentikasi menggunakan **NextAuth.js v5 (Auth.js)** dengan strategi JWT, Credentials provider, dan integrasi Prisma untuk verifikasi password.

### 11.1 Provider & Konfigurasi

#### 11.1.1 `src/lib/auth.config.ts` — Edge-compatible Config

```ts
import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isPublicPath =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/api/auth")

      if (isPublicPath) return true
      if (isLoggedIn) return true

      return false
    },
  },
  providers: [], // Providers added in auth.ts (not Edge-compatible)
} satisfies NextAuthConfig
```

File ini **dipisahkan** dari `auth.ts` karena akan dimuat oleh middleware (Edge Runtime). Edge Runtime tidak mendukung `bcryptjs` dan Prisma client penuh — sehingga providers ditambahkan di `auth.ts` (Node.js runtime) saja.

`pages.signIn = "/login"` memberitahu NextAuth: jika user belum login, redirect ke `/login` (bukan halaman default `/api/auth/signin`).

#### 11.1.2 `src/lib/auth.ts` — Full NextAuth Configuration

```ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth.config"
import type { Role } from "@/generated/prisma/client"

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        const user = await prisma.user.findUnique({
          where: { email, isActive: true },
        })

        if (!user) return null

        const isPasswordValid = await bcrypt.compare(password, user.hashedPassword)
        if (!isPasswordValid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role as Role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
})
```

Object yang di-export:
- `auth` — function untuk dipanggil di server component / route handler untuk mengambil session.
- `signIn`, `signOut` — wrapper untuk login/logout (server action).
- `handlers` — `GET` & `POST` handler untuk `/api/auth/[...nextauth]/route.ts`.

#### 11.1.3 Provider: Credentials (Email + Password)

Sistem **hanya menggunakan satu provider**: `Credentials`. Tidak ada OAuth (Google/GitHub) karena ini sistem internal perusahaan.

Fields:
- `email` (type=email, label="Email")
- `password` (type=password, label="Password")

Function `authorize(credentials)`:
1. Validasi keberadaan email & password — jika kosong return `null`.
2. Query `prisma.user.findUnique({ where: { email, isActive: true }})` — di-filter `isActive: true` agar user yang di-deactivate tidak bisa login.
3. Jika user tidak ditemukan, return `null`.
4. `bcrypt.compare(password, user.hashedPassword)` — verifikasi password hash.
5. Jika password tidak valid, return `null`.
6. Return user object: `{ id, name, email, role }`. Field `role` (Prisma enum) ikut di-return supaya bisa diteruskan ke JWT.

Return `null` di NextAuth = login gagal → frontend menerima `result.error` di `signIn(...)` → tampilkan banner "Email atau password salah".

### 11.2 Session Strategy

```ts
session: {
  strategy: "jwt",
  maxAge: 8 * 60 * 60, // 8 hours
}
```

Sistem menggunakan **JWT-based session** (bukan database-backed). Implikasi:
- Session disimpan di **encrypted cookie** (`next-auth.session-token` / `__Secure-next-auth.session-token` di production).
- Tidak ada tabel `Session` / `Account` di Prisma schema — lebih ringan, tidak perlu Prisma adapter.
- Session **tidak bisa di-revoke server-side** (karena disimpan di client cookie). Logout efektif hanya pada device tersebut.
- `maxAge` = 8 jam — durasi 1 hari kerja kantor; sesudah itu user harus login ulang.

### 11.3 Callbacks: jwt() dan session()

NextAuth v5 dengan JWT strategy memanggil callback dalam urutan:
1. `authorize()` (Credentials provider) → return user object (atau null).
2. `jwt({ token, user, ... })` — pertama kali login, `user` ada; refresh subsequent, `user` undefined.
3. `session({ session, token })` — dipanggil setiap kali `auth()` atau `useSession()` dijalankan.

#### Callback `jwt`

```ts
async jwt({ token, user }) {
  if (user) {
    token.id = user.id as string
    token.role = user.role as Role
  }
  return token
}
```

Saat login pertama, `user` ada → kita inject `id` dan `role` dari user object (returned by `authorize`) ke JWT token. Pada request berikutnya, `user` undefined dan token sudah memiliki `id` + `role` yang persisten.

#### Callback `session`

```ts
async session({ session, token }) {
  if (token) {
    session.user.id = token.id
    session.user.role = token.role
  }
  return session
}
```

Dari token, kita inject `id` dan `role` ke session object. Inilah cara `session.user.role` tersedia di seluruh aplikasi (server component dan client `useSession()`).

### 11.4 TypeScript Type Augmentation (`src/types/next-auth.d.ts`)

NextAuth default `Session.user` hanya punya `name`, `email`, `image`. Untuk menambahkan `id` dan `role`, type-augment via module declaration:

```ts
import { Role } from "@/types/enums"
import { DefaultSession, DefaultUser } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface User extends DefaultUser {
    role: Role
  }

  interface Session {
    user: {
      id: string
      role: Role
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    role: Role
  }
}
```

Sekarang TypeScript memahami bahwa `session.user.role` adalah `Role` (`SUPER_ADMIN | HR_ADMIN | MANAGER | EMPLOYEE`), dan `session.user.id` adalah string.

### 11.5 Middleware Behavior

#### File: `src/middleware.ts`

```ts
import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

export default NextAuth(authConfig).auth

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
```

#### Penjelasan

1. **Edge Runtime**: middleware Next.js berjalan di Edge Runtime (V8 isolate, tidak ada Node API penuh). Ini sebabnya kita import `authConfig` (yang **tidak punya providers** Credentials dengan `bcryptjs`) — bukan `auth.ts` lengkap.

2. **`NextAuth(authConfig).auth`**: NextAuth menyediakan helper middleware. `auth` adalah default-exported function yang akan dijalankan untuk setiap request yang match `matcher`.

3. **Matcher regex**: `/((?!api/auth|_next/static|_next/image|favicon.ico).*)`. Ini negative lookahead — meng-exclude:
   - `/api/auth/*` — endpoint NextAuth (login, callback, signout) harus accessible tanpa middleware.
   - `/_next/static/*` & `/_next/image/*` — Next.js internal asset.
   - `/favicon.ico`.
   
   Semua path lain melewati middleware.

4. **Redirect logic**: callback `authorized()` di `authConfig` me-return `false` jika user tidak login dan path tidak public. NextAuth menerjemahkan `false` menjadi redirect ke `pages.signIn = "/login"` dengan query param `?callbackUrl={original}` (yang bisa digunakan untuk auto-redirect setelah login).

5. **Tidak ada role check di middleware**. Semua role-based authorization dilakukan di:
   - Layout dashboard (`if (!session) redirect("/login")`).
   - Page-level check (`if (role !== ...) redirect(...)`).
   - Service layer (validasi scope).

### 11.6 Login Flow End-to-End

1. User akses `/dashboard` (atau halaman protected lainnya) → middleware menjalankan `authorized` callback. Tidak ada session cookie → callback return `false` → NextAuth redirect ke `/login?callbackUrl=/dashboard`.
2. User type email + password di form `/login` (`src/app/(auth)/login/page.tsx`).
3. Form submit memanggil `signIn("credentials", { email, password, redirect: false })` dari `next-auth/react`.
4. NextAuth POST ke `/api/auth/callback/credentials` dengan kredensial.
5. Server menjalankan `authorize(credentials)` di `auth.ts` — query Prisma + `bcrypt.compare`. Jika OK, return user object.
6. NextAuth menjalankan `jwt({ token, user })` — inject `id` + `role` ke token.
7. Token di-encrypt + disimpan ke cookie httpOnly (`next-auth.session-token`).
8. Client menerima respons sukses (`result.error === undefined`) → halaman memanggil `router.push("/dashboard")` + `router.refresh()`.
9. Browser request ke `/dashboard` dengan cookie session → middleware `authorized` return `true` → request lolos.
10. Layout `(dashboard)/layout.tsx` jalankan `auth()` lagi (server-side) → memvalidasi cookie, decrypt token, jalankan `session({ session, token })` callback → return session yang punya `user.id` + `user.role`.
11. Page component `dashboard/page.tsx` panggil `auth()` → switch render dashboard sesuai `session.user.role`.

### 11.7 Password Hashing

- Library: `bcryptjs` (pure JS, tidak butuh native binding).
- Storage: field `User.hashedPassword` (string) di Prisma.
- Hash baru dibuat di flow seeding dan di server action create user (file `src/lib/services/user.service.ts` atau actions terkait).
- Verifikasi: `await bcrypt.compare(plaintextPassword, storedHash)` — memberikan timing-safe comparison.
- bcryptjs default cost: 10 rounds (cukup untuk aplikasi internal).

**Catatan keamanan**: karena `bcryptjs` butuh runtime Node.js (kompatibel dengan WASM tapi penalti perf di Edge), `Credentials` provider harus berada di file `auth.ts` saja, bukan `auth.config.ts`.

### 11.8 Bagaimana Role di-attach ke Session

Alur attachment role:

```
User table (Prisma)
  └── { role: Role enum }                  ← source of truth
        ↓
Credentials.authorize()
  └── return { id, name, email, role }     ← user object
        ↓
jwt() callback
  └── token.role = user.role               ← injected ke JWT
        ↓
[ JWT encrypted, stored in cookie ]
        ↓
session() callback (subsequent requests)
  └── session.user.role = token.role       ← extracted ke session
        ↓
session.user.role → consumed by:
  - Server: page.tsx role checks (redirect)
  - Server: layout.tsx
  - Server: service layer scope checks
  - Client: useSession() in sidebar.tsx (filter nav)
```

### 11.9 Verifikasi Auth di Server Component / Server Action

Pattern resmi yang dipakai di semua page server:

```ts
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function SomePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Role-specific check
  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard")
  }

  // ... fetch data, render UI
}
```

`auth()` di server context:
- Membaca cookie `next-auth.session-token` dari incoming Request.
- Decrypt JWT.
- Jalankan `session()` callback.
- Return `Session | null`.

Untuk **server actions** (`"use server"`), pattern serupa:

```ts
"use server"
import { auth } from "@/lib/auth"

export async function someAction(input: Input) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  if (session.user.role !== "HR_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden")
  }
  // ... DB mutation
}
```

### 11.10 Verifikasi Auth di Client Component

Untuk client component yang butuh role/session info, dipakai `useSession` dari `next-auth/react`:

```tsx
"use client"
import { useSession } from "next-auth/react"

export function SomeWidget() {
  const { data: session } = useSession()
  const role = session?.user?.role
  // ...
}
```

Agar `useSession` bekerja, app harus dibungkus di `<SessionProvider>`. Di proyek ini ada **dua wrapper** dengan tujuan berbeda:

1. **`src/components/providers/session-provider.tsx`** — `AuthSessionProvider`, dipakai di **root layout** (`src/app/layout.tsx`):

   ```tsx
   "use client"
   import { SessionProvider } from "next-auth/react"
   
   export function AuthSessionProvider({ children }) {
     return <SessionProvider>{children}</SessionProvider>
   }
   ```

2. **`src/components/layout/session-provider.tsx`** — `SessionProvider` (alias berbeda), dipakai di **dashboard layout** (`src/app/(dashboard)/layout.tsx`):

   ```tsx
   "use client"
   import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
   
   export function SessionProvider({ children }) {
     return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
   }
   ```

Keduanya pada dasarnya identik — wrapper tipis di sekitar `next-auth/react`'s `SessionProvider`. Adanya dua versi adalah artefak refactor; secara fungsional satu cukup, tapi root layout dan dashboard layout masing-masing membungkus children dengan provider sendiri-sendiri (membuat double-wrap, namun tidak menimbulkan error).

### 11.11 Public Path & API Auth Endpoint

Path publik (tidak butuh auth):
- `/login` — halaman login.
- `/api/auth/*` — endpoint NextAuth: `/signin`, `/callback/credentials`, `/signout`, `/session`, `/csrf`, dll. Semua endpoint ini di-handle oleh `handlers` di `auth.ts` yang di-mount di `src/app/api/auth/[...nextauth]/route.ts` (file standar Auth.js).

### 11.12 Logout Flow

Logout dipanggil dari client (misalnya dari `Header` component dengan tombol logout) via:

```ts
import { signOut } from "next-auth/react"
await signOut({ callbackUrl: "/login" })
```

Atau dari server action:

```ts
"use server"
import { signOut } from "@/lib/auth"
export async function logoutAction() {
  await signOut({ redirectTo: "/login" })
}
```

Logout memanggil `/api/auth/signout` → cookie session di-clear (Set-Cookie dengan Max-Age=0) → redirect ke `/login`.

### 11.13 Ringkasan Lapisan Keamanan

| Lapis | Lokasi | Yang dicek | Fail action |
|---|---|---|---|
| 1. Middleware | `src/middleware.ts` | Login (existence of session) | Redirect `/login` |
| 2. Layout gate | `src/app/(dashboard)/layout.tsx` | Login (server `auth()`) | Redirect `/login` |
| 3. Page-level | Setiap `page.tsx` server component | Login + Role | Redirect (`/login` atau halaman fallback role) |
| 4. Service layer | `src/lib/services/*.ts` | Role + scope (departemen, ownership) | Throw error / null result |
| 5. UI Filter (UX) | `src/components/layout/sidebar.tsx` | Role (sembunyikan nav) | Item tidak ditampilkan (bukan security) |

Dengan lima lapis ini, sistem mempertahankan prinsip **defense in depth** — kebocoran di satu lapis tidak otomatis membuka akses ke modul yang seharusnya restricted.

---

## 12. Komponen UI Reusable

### 12.A — Layout Components (`src/components/layout/`)

#### Sidebar (`sidebar.tsx`)
- **Props**: tidak ada (membaca session via hook).
- **Deskripsi**: navigasi utama aplikasi. Item menu di-filter berdasarkan `session.user.role`. Setiap item: ikon Lucide + label + href. Items: Dashboard, Karyawan, Absensi (per-role view), Cuti, Cuti Manage, Cuti Report, Payroll, Payslip, Recruitment, Master Data, Audit Log, User Management.
- **Dipakai di**: `src/app/(dashboard)/layout.tsx`.

#### Header (`header.tsx`)
- **Props**: tidak ada (membaca session).
- **Deskripsi**: header bar dengan brand, breadcrumbs (mobile), avatar dropdown (logout).
- **Dipakai di**: `src/app/(dashboard)/layout.tsx`.

#### Breadcrumbs (`breadcrumbs.tsx`)
- **Props**: tidak ada (membaca pathname via `usePathname`).
- **Deskripsi**: breadcrumb otomatis dari URL pathname dengan label mapping.
- **Dipakai di**: `header.tsx`.

#### SessionProvider (`layout/session-provider.tsx`, `providers/session-provider.tsx`)
- **Props**: `children: ReactNode`.
- **Deskripsi**: wrapper NextAuth `SessionProvider` agar session tersedia di client component.
- **Dipakai di**: `src/app/layout.tsx`.

---

### 12.B — Shared Components (`src/components/shared/`)

#### ConfirmDialog (`confirm-dialog.tsx`)
- **Props**: `open: boolean`, `onOpenChange: (b: boolean) => void`, `title: string`, `description: string`, `onConfirm: () => void | Promise<void>`, `variant?: "default" | "destructive"`, `loading?: boolean`.
- **Deskripsi**: dialog konfirmasi reusable (Yes/No) dengan loading state.
- **Dipakai di**: `deactivate-employee-dialog.tsx`, `finalize-button.tsx`, `vacancy-table.tsx` (toggle status), `user-table.tsx` (toggle active), master data tabs (delete).

#### DataTable (`data-table.tsx`)
- **Props**: `columns: ColumnDef<T>[]`, `data: T[]`, `loading?: boolean`, `emptyMessage?: string`, `pagination?: PaginationProps`, `actions?: ReactNode` (action area top-right).
- **Deskripsi**: wrapper TanStack `useReactTable` dengan empty state, loading skeleton, dan slot action.
- **Dipakai di**: `employee-table.tsx`, `audit-log-table.tsx`, `vacancy-table.tsx`, `user-table.tsx`, `payroll-entry-table.tsx`, `attendance-summary-table.tsx`, `leave-history-table.tsx`, `leave-approval-table.tsx`, master-data tabs.

#### DataTablePagination (`data-table-pagination.tsx`)
- **Props**: `currentPage: number`, `totalPages: number`, `pageSize: number`, `total: number`, `onPageChange: (n: number) => void`, `onPageSizeChange?: (n: number) => void`.
- **Deskripsi**: kontrol pagination (next/prev/first/last + page-size selector).
- **Dipakai di**: setiap halaman list yang pakai `DataTable` (employees, audit-log, payroll, dll.).

#### LoadingSkeleton (`loading-skeleton.tsx`)
- **Props**: `rows?: number`, `columns?: number`.
- **Deskripsi**: skeleton table loader generic.
- **Dipakai di**: tabel saat fetching.

#### StatCard (`stat-card.tsx`)
- **Props**: `title: string`, `value: string | number`, `icon?: LucideIcon`, `description?: string`, `trend?: { value: number; isPositive: boolean }`.
- **Deskripsi**: card statistik untuk dashboard (total karyawan, total leave, dll.).
- **Dipakai di**: 4 dashboard components, leave-report-kpi-cards.

#### SummaryTile (`summary-tile.tsx`)
- **Props**: `label: string`, `value: string | number`, `accent?: string`.
- **Deskripsi**: tile rangkuman compact untuk dashboard.
- **Dipakai di**: 4 dashboard components.

---

### 12.C — Domain Components (`src/components/attendance/`)

#### AttendanceStatusBadges (`attendance-status-badges.tsx`)
- **Props**: `record: { isLate: boolean; lateMinutes: number; isEarlyOut: boolean; earlyOutMinutes: number; overtimeMinutes: number; isManualOverride: boolean }`.
- **Deskripsi**: render kombinasi badge berdasarkan flag (Late, Early Out, Overtime, Manual). Color-coded: kuning untuk late, merah untuk early-out, biru untuk overtime, abu-abu untuk manual.
- **Dipakai di**: `attendance-history.tsx`, `attendance-summary-table.tsx`.

---

### 12.D — Provider Components (`src/components/providers/`)

#### SessionProvider (`providers/session-provider.tsx`)
- **Props**: `children: ReactNode`.
- **Deskripsi**: NextAuth `SessionProvider` wrapper (root provider).
- **Dipakai di**: `src/app/layout.tsx`.

---

### 12.E — shadcn/ui Primitives (`src/components/ui/`)

Kumpulan komponen primitive berbasis Radix UI + Tailwind, di-generate via shadcn CLI. Tidak diubah secara substansial dari template default. Berikut daftar lengkap:

| Komponen | File | Deskripsi singkat |
|---|---|---|
| Alert Dialog | alert-dialog.tsx | Dialog modal dengan trigger, action, cancel |
| Avatar | avatar.tsx | Avatar dengan image + fallback initial |
| Badge | badge.tsx | Label warna untuk status |
| Button | button.tsx | Tombol dengan variant (default, destructive, outline, ghost, link) + size |
| Calendar | calendar.tsx | Calendar picker (react-day-picker) |
| Card | card.tsx | CardHeader/Content/Footer composable |
| Chart | chart.tsx | Recharts wrapper |
| Collapsible | collapsible.tsx | Collapsible content |
| Dialog | dialog.tsx | Modal dialog non-confirm |
| DropdownMenu | dropdown-menu.tsx | Dropdown menu items dengan submenu |
| Form | form.tsx | react-hook-form + Zod integration (FormField, FormItem, FormLabel, FormControl, FormMessage) |
| Input | input.tsx | Text input dengan style consistent |
| Label | label.tsx | Form label |
| Popover | popover.tsx | Floating popover content |
| Progress | progress.tsx | Progress bar |
| ScrollArea | scroll-area.tsx | Custom scrollbar |
| Select | select.tsx | Combobox/select |
| Separator | separator.tsx | Horizontal/vertical separator |
| Sheet | sheet.tsx | Slide-out drawer (mobile sidebar) |
| Skeleton | skeleton.tsx | Loading skeleton primitive |
| Sonner | sonner.tsx | Toast (notification) — Sonner library |
| Table | table.tsx | Table primitives (Table, TableHeader, TableRow, TableCell) |
| Tabs | tabs.tsx | TabsList, TabsTrigger, TabsContent |
| Textarea | textarea.tsx | Multi-line text input |
| Toast (legacy) | toast.tsx | Toast component (legacy, akan diganti Sonner) |
| Toaster | toaster.tsx | Toast container |
| Tooltip | tooltip.tsx | Hover tooltip |

---

### 12.F — Page-Level Components (per halaman)

Komponen di `_components/` adalah implementasi spesifik halaman dan tidak reusable lintas halaman. Kategori:

**Form components**:
- `create-employee-form.tsx`, `create-vacancy-form.tsx`, `import-payroll-form.tsx`, `leave-request-form.tsx`, `manual-record-dialog.tsx`, `*-form-dialog.tsx` (master data) — semua pakai `react-hook-form` + Zod schema dari `validations/`.

**Table components**:
- `employee-table.tsx`, `audit-log-table.tsx`, `vacancy-table.tsx`, `user-table.tsx`, `payroll-entry-table.tsx`, `attendance-summary-table.tsx`, `leave-history-table.tsx`, `leave-approval-table.tsx` — wrapper `DataTable` shared dengan `*-columns.tsx` mendefinisikan kolom (TanStack `ColumnDef<T>`).

**Filter components**:
- `attendance-filters.tsx`, `audit-log-filters.tsx`, `employee-filters.tsx`, `leave-report-filters.tsx` — `useSearchParams` + `nuqs` untuk state filter URL-based.

**Dashboard components** (4 role variants):
- `super-admin-dashboard.tsx`, `hr-admin-dashboard.tsx`, `manager-dashboard.tsx`, `employee-dashboard.tsx` — semua server component yang load dari `dashboard.service.ts`, render `StatCard` + chart Recharts.

**Tab components** (Employee Profile):
- `employee-profile-tabs.tsx` (parent dengan `Tabs` shadcn) → 5 child: `personal-info-tab.tsx`, `employment-details-tab.tsx`, `tax-bpjs-tab.tsx`, `documents-tab.tsx`, `emergency-contacts-tab.tsx`.

**Kanban**:
- `kanban-board.tsx` — pakai `@dnd-kit/core` + `@dnd-kit/sortable` untuk drag-and-drop candidate antar stage column. onDragEnd → `updateCandidateStageAction`.

---

*Akhir dump-part4.md.*

---

## 13. Library/Utility Khusus

### 13.1 Kalkulasi Payroll

**File utama**: `src/lib/services/payroll.service.ts` + `src/lib/services/payroll-import.service.ts`.

**Important context**: Setelah pivot 2026-04-29, sistem **TIDAK** lagi menghitung BPJS/PPh21/THR sendiri. HR menghitung di Excel external. Sistem hanya:
1. Parse file `.xlsx`/`.xls`/`.csv`.
2. Validasi struktural (kolom, tipe data, NIK unik).
3. Match NIK ke Employee aktif.
4. Persist sebagai snapshot di `PayrollEntry`.

**`parsePayrollWorkbook(buffer: Buffer): PayrollImportResult`** di `payroll-import.service.ts`:
- Pakai `xlsx` library (`XLSX.read`, `XLSX.utils.sheet_to_json` dengan `header: 1` → array-of-arrays).
- Sheet preference: `"Payroll"` jika ada, else first sheet.
- 33 kolom wajib (`PAYROLL_COLUMNS` const), case-insensitive header match.
- Validasi:
  - Required text cols: `NIK`, `Nama Karyawan`, `Job Position`, `Organization`, `Grade / Level`, `PTKP`.
  - 19 kolom number: Basic Salary, semua tunjangan, semua deduction, semua benefit perusahaan. Format Indonesian-friendly: `replace(/[.,\s]/g, m => m === "," ? "." : "")` → handle "1.234.567,89" → 1234567.89.
  - 6 kolom integer: Actual/Schedule Working Day, Dayoff, holidays.
  - Negative number rejected.
  - Duplicate NIK in upload rejected.
  - Empty rows skipped (NIK="" + name="" + basic=0).
- Compute totals di parser:
  - `totalEarnings = basicSalary + tunjanganKomunikasi + tunjanganKehadiran + tunjanganJabatan + tunjanganLainnya + taxAllowance + thr`
  - `totalDeductions = bpjsKesehatanEmp + jhtEmp + jaminanPensiunEmp + pph21 + potonganKeterlambatan + potonganKoperasi + potonganLainnya`
  - `totalBenefits = jkk + jkm + jhtCompany + jaminanPensiunCompany + bpjsKesehatanCompany`
  - `takeHomePay = totalEarnings - totalDeductions`

**`buildPayrollTemplate(periodLabel: string): Buffer`** di `payroll-import.service.ts`:
- Generate Excel 2-sheet ("Payroll" + "Petunjuk").
- Sheet "Payroll": header + 1 row sample data (Budi Santoso example).
- Sheet "Petunjuk": instruksi pengisian.
- Column widths proporsional terhadap header length.

**`matchRowsToEmployees(rows)`** di `payroll.service.ts`:
- `findMany({ where: { nik: { in: niks } } })`.
- Per row: cek NIK exists & employee active, else error.

**`persistImportedPayroll({ month, year, rows, createdBy })`**:
- Cek `PayrollRun` existing untuk month/year. Jika `FINALIZED` → throw immutable.
- Upsert run (DRAFT). Jika existing DRAFT → `deleteMany(entries)` dulu (replace strategy).
- `createMany(entries)` dengan semua snapshot field.

**`finalizePayroll(id)`**:
- Cek run exists & status DRAFT.
- Update status → `FINALIZED`. Tidak bisa di-rollback dari UI.

**Tidak ada engine kalkulasi di sistem.** Semua aritmatika BPJS, PPh21 (TER bulanan & progresif Desember), biaya jabatan, dan THR dilakukan oleh HR di spreadsheet eksternal (Excel/Google Sheets). Sistem hanya:

1. **Generate template Excel** (`/api/payroll/template`) — kolom kosong (NIK, Nama, Basic Salary, BPJS, PPh21, dst.) untuk diisi HR.
2. **Parse upload** (`parsePayrollWorkbook`) — validasi STRUKTURAL saja (kolom lengkap, tipe angka, NIK unik, tidak negatif). Tidak ada perhitungan rate × DPP, tidak ada lookup tabel TER, tidak ada bracket pajak progresif.
3. **Snapshot ke `PayrollEntry`** — angka yang diketik HR di Excel tersimpan apa adanya.
4. **Finalize** → status DRAFT → FINALIZED → slip gaji muncul di akun masing-masing karyawan via halaman `/payslip`.

**Catatan historis**: Sebelum Paket A cleanup (2026-05-07), `constants.ts` menyimpan konstanta sisa engine kalkulasi pre-pivot — `BPJS_RATES`, `PTKP_ANNUAL`, `TER_TABLE_A/B/C`, `TER_CATEGORY`, `PPH21_PROGRESSIVE_BRACKETS`, `BIAYA_JABATAN_RATE/MAX`. Konstanta-konstanta tersebut sudah **dihapus** karena tidak di-import di mana pun. Lihat Section 0.3 untuk detail.

**Decimal.js**: library dipakai oleh Prisma generated types (kolom DB Decimal di `PayrollEntry` semua kolom moneter, `Candidate.offerSalary`). Untuk display nilai Decimal di komponen dashboard/payroll detail, konversi ke `number` via `.toNumber()` atau format string. Tidak ada operasi aritmatika `Decimal` aktif di runtime application code (kalkulasi payroll dilakukan eksternal di Excel oleh HR — lihat 13.1).

---

### 13.2 PDF Generation

**Library**: `@react-pdf/renderer` ^4.3.2 (server-side). Komponen ditulis dengan JSX yang dikompilasi ke PDF binary.

**File**:
- `src/lib/pdf/payslip-pdf.tsx` — slip gaji per `PayrollEntry`. Render Document → Page A4 portrait → View blocks: header company, employee identity, earnings table, deductions table, total THP, benefits, attendance summary.
- `src/lib/pdf/attendance-pdf.tsx` — laporan absensi bulanan. Tabel per karyawan dengan kolom date, clockIn, clockOut, late mins, early-out mins, overtime mins.
- `src/lib/pdf/offer-letter-pdf.tsx` — surat penawaran kandidat. Body letter dengan offerSalary + offerNotes.

**Pola pemanggilan dari API route**:
```ts
import { renderToStream } from "@react-pdf/renderer";
import { PayslipDocument } from "@/lib/pdf/payslip-pdf";

const stream = await renderToStream(<PayslipDocument data={payslipData} />);
return new Response(stream as unknown as ReadableStream, {
  headers: { "Content-Type": "application/pdf" },
});
```

Type interface `PayslipData` di `payslip-pdf.tsx` mirror semua kolom `PayrollEntry` (basicSalary, tunjangan*, deductions, takeHomePay, benefits, attendance summary).

**StyleSheet API**: pakai `StyleSheet.create({...})` mirip React Native. Style flat, no Tailwind.

---

### 13.3 Date Handling & Timezone

**Library**: `date-fns` ^4.1.0 + `date-fns-tz` ^3.2.0.

**Timezone constant**: `const TZ = "Asia/Jakarta"` (WIB / UTC+7), dipakai di `attendance.service.ts` dan `attendance.actions.ts`.

**Konversi UTC ↔ WIB**:
- `toZonedTime(utcDate, TZ)` — convert UTC `Date` ke local Date object yang merepresentasikan jam WIB.
- Manual reverse: `clockInUtc.setUTCHours(inH - 7, inM, 0, 0)` — convert "08:00 WIB" → UTC 01:00 (untuk manual override action).

**Pola normalisasi tanggal** (stored sebagai `@db.Date` di Prisma):
```ts
const nowJkt = toZonedTime(nowUtc, TZ);
const dateStr = format(nowJkt, "yyyy-MM-dd");
const dateOnly = new Date(dateStr + "T00:00:00.000Z");
```
Date stored sebagai UTC midnight dari hari WIB → saat di-query, konsisten lookup `[employeeId, date]`.

**Working days**: `eachDayOfInterval({ start, end }).filter(d => !isWeekend(d))` — exclude Sat/Sun. Tidak ada handling libur nasional di hari kerja (libur nasional masuk di payroll Excel kolom `nationalHoliday`, bukan otomatis).

**Week start**: `startOfWeek(now, { weekStartsOn: 1 })` — Senin sebagai awal minggu (locale Indonesia).

---

### 13.4 Audit Logging

**File**: `src/lib/services/audit.service.ts` (query) + `src/lib/prisma.ts` (`createAuditLog` mutator).

**`createAuditLog(params)`** di `prisma.ts`:
```ts
async function createAuditLog(params: {
  userId: string;
  action: AuditAction;          // CREATE | UPDATE | DELETE
  module: string;                // label dari MODULES const
  targetId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
}) {
  await prisma.auditLog.create({ data: { ... } });
}
```
- Function ini SENGAJA tidak memicu audit log lebih lanjut (anti-recursion).
- Service layer panggil **eksplisit** setelah setiap mutasi sukses (tidak ada Prisma middleware/hook).

**Modul yang di-track** (label di `MODULES` const + label string ad-hoc di action layer):
- USER ("Manajemen Pengguna")
- DEPARTMENT, POSITION, OFFICE_LOCATION, LEAVE_TYPE — master data
- EMPLOYEE ("Karyawan")
- EMPLOYEE_DOCUMENT ("Dokumen Karyawan")
- EMERGENCY_CONTACT ("Kontak Darurat")
- "Absensi" (manual override)
- "Permintaan Cuti" (submit, approve, reject, cancel)
- "Payroll" (import + finalize) — ditambahkan saat Paket A
- "Lowongan", "Kandidat", "Wawancara" — recruitment

**`getAuditLogs(filters)`**: paginated query dengan filter `userId`, `module`, `action`, `dateFrom`, `dateTo`. Default `pageSize=25`. Include `user.name` + `user.email`.

**`getAuditLogById(id)`**: detail single log untuk diff view.

**`getAuditLogUsers()` & `getAuditLogModules()`**: distinct values untuk dropdown filter.

**Lokasi pemanggilan `createAuditLog`** (action mutasi):
- employee.actions: createEmployee, updatePersonalInfo, updateEmployment, updateTaxBpjs, deactivateEmployee
- employee-document.actions: createEmergencyContact (juga update/delete via service)
- attendance.actions: manualOverrideAction
- leave.actions: submit, approve, reject, cancel (cancel ditambahkan Paket A)
- payroll.actions: importPayrollAction (CREATE), finalizePayrollAction (UPDATE) — ditambahkan Paket A
- recruitment.actions: createVacancy, updateVacancy, toggleVacancyStatus, createCandidate, updateCandidateStage, convertCandidate, updateOffer (Paket A), createInterview (Paket A)
- master-data.actions: create/update/delete department/position/officeLocation/leaveType
- user.actions: create/update/toggle (via service)

---

### 13.5 File Upload (penyimpanan dokumen)

**Storage backend yang aktual**: implementasi 100% **local filesystem** (`fs/promises`). Tidak ada package `@vercel/blob` di `package.json`, tidak ada env var `BLOB_READ_WRITE_TOKEN`, dan tidak ada `import` dari `@vercel/blob` di mana pun di `src/`. File disimpan di folder `<projectRoot>/uploads/` (di-gitignore via `/uploads/` di `.gitignore`, dibuat on-demand dengan `mkdir(..., { recursive: true })`).

**Bukti kode** (`src/lib/services/employee-document.service.ts`):
```ts
import { unlink } from "fs/promises";
import path from "path";

// On delete:
const absolutePath = path.join(process.cwd(), document.filePath);
await unlink(absolutePath);
```

`document.filePath` adalah relative path dari root project (mis. `uploads/employees/<id>/<timestamp>-file.pdf`).

**Flow upload dokumen karyawan** (`src/app/api/employees/[id]/documents/route.ts`):
1. Client form (`documents-tab.tsx`) submit multipart ke `POST /api/employees/[id]/documents`.
2. Handler API parse `FormData` → ambil `File` instance, validasi MIME (`application/pdf`, `image/jpeg`, `image/png`) + size (≤ 5 MB) + `documentType` (enum `DocumentType`).
3. `mkdir(path.join(process.cwd(), "uploads", "employees", employeeId), { recursive: true })`.
4. Sanitize filename (`replace(/[^a-zA-Z0-9.-]/g, "_")`), prefix dengan `Date.now()` untuk uniqueness.
5. `writeFile(filePath, Buffer.from(await file.arrayBuffer()))` — full path di disk.
6. `createDocumentRecord({ ..., filePath: relativeFilePath })` — DB row simpan **relative path** + audit log CREATE module="Dokumen Karyawan".

**Flow download dokumen** (`/api/employees/[id]/documents/[docId]` GET):
- Role-based access check (HR/Super Admin: any; Manager: department-scoped; Employee: own only).
- `readFile(path.join(process.cwd(), document.filePath))` → return sebagai `Response` dengan `Content-Type` & `Content-Disposition: attachment`.

**Flow delete**:
1. `DELETE /api/employees/[id]/documents/[docId]` (HR/Super Admin only).
2. Service `deleteDocument(docId, actorId)`:
   - Load existing document.
   - `await unlink(absolutePath)` — error di-catch (file mungkin sudah dihapus dari disk; tetap lanjut hapus DB row).
   - `prisma.employeeDocument.delete`.
   - AuditLog DELETE.

**CV upload (recruitment)** — `src/app/api/recruitment/cv/route.ts` (HR/Super Admin only):
- Validasi sama: PDF/JPEG/PNG, max 5 MB, candidate harus exist.
- `writeFile` ke `<projectRoot>/uploads/cv/<candidateId>-cv.<ext>` (deterministic filename, **overwrite** kalau upload ulang).
- Update `Candidate.cvPath = "/uploads/cv/<filename>"` (leading slash, web-style relative path).

**Trade-off lokal vs cloud storage**: implementasi local FS **tidak compatible dengan Vercel serverless** — filesystem di Vercel ephemeral, file hilang setiap cold start / redeploy. Cocok untuk **dev local** dan **on-prem / VPS deployment** dengan persistent volume (mis. Docker volume mount, EC2 EBS). Migrasi ke object storage (S3 / Vercel Blob / GCS) menjadi *future work* kalau target deployment berubah ke serverless.

**Bodysize limit**: `next.config.mjs` set `serverActions.bodySizeLimit = "5mb"` — semua upload (Excel payroll, dokumen karyawan, CV) capped 5 MB.

---

### 13.6 Location / IP Validation

**File**: `src/lib/services/location.service.ts`.

**`verifyLocation(clientIp, coords, office): LocationResult`**:
- Return type: `{ allowed: true } | { allowed: false; reason: string }`.
- Logika:
  1. **GPS check (primary)**: jika `coords` ada DAN office punya `latitude/longitude/radiusMeters`, hitung haversine distance. Jika > radius → reject "Lokasi Anda di luar radius yang diizinkan". Jika OK → allow.
  2. **IP check (fallback)**: jika tidak ada koordinat atau office tidak punya GPS config — cek IP. `ipRangeCheck(clientIp, office.allowedIPs)` (CIDR matcher). Jika `allowedIPs.length === 0` (dev mode) → allow. Jika CIDR match gagal → reject "Alamat IP Anda tidak berada dalam rentang yang diizinkan".

**`haversineDistance(lat1, lon1, lat2, lon2): number`** (private):
- Formula haversine standar dengan radius bumi `R = 6_371_000` meter.
- Return jarak dalam meter.

**Library**: `ip-range-check` ^0.2.0 — accept array CIDR like `["192.168.1.0/24", "10.0.0.0/8"]`.

**Dipakai di**: `attendance.actions.ts` `clockInAction` dan `clockOutAction`. Jika office.allowedIPs=[] dan office.latitude=null, location check pass (allow clock-in tanpa restriksi → mode development). Production: konfigurasikan minimal salah satu.

**Type augmentation**: `src/types/ip-range-check.d.ts` deklarasi module untuk lib JS yang tidak punya TS types.

---

### 13.7 Utility Umum

**`cn(...classes)`** di `src/lib/utils.ts`:
```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```
- Combine `clsx` (conditional) + `tailwind-merge` (resolve konflik utility seperti `p-2 p-4` → `p-4`).
- Dipakai di SEMUA komponen UI shadcn untuk merge class props.

**`prisma`** di `src/lib/prisma.ts`:
- Singleton `PrismaClient` dengan global cache (mencegah multiple instances di dev hot-reload).
- Log levels: `["query", "error", "warn"]` di dev, `["error"]` di prod.

**Constants** di `src/lib/constants.ts` (semua dipakai di codebase setelah Paket A cleanup):

- `ROLES`, `MODULES`, `AUDIT_ACTIONS` — label mapping bahasa Indonesia (dipakai di sidebar, audit log filter, action layer).
- `GENDER_LABELS`, `RELIGION_LABELS`, `MARITAL_STATUS_LABELS`, `CONTRACT_TYPE_LABELS`, `PTKP_STATUS_LABELS`, `DOCUMENT_TYPE_LABELS` — display label per enum di tabel/dropdown.
- `DEFAULT_PAGE_SIZE = 25`, `PAGE_SIZE_OPTIONS = [25, 50]` — dipakai di service query (employee, audit log) dan komponen pagination.
- `OVERTIME_THRESHOLD_MINUTES = 30` — di-import di `attendance.service.ts` `calculateAttendanceFlags`. Overtime hanya diakui jika > 30 menit lewat jam pulang.
- `ATTENDANCE_STATUS_LABELS`, `LEAVE_STATUS_LABELS` — display label di badge/filter.

> **Catatan historis**: Sebelum Paket A cleanup (2026-05-07), `constants.ts` juga punya konstanta sisa engine kalkulasi pre-pivot (`BPJS_RATES`, `PTKP_ANNUAL`, `TER_TABLE_A/B/C`, `TER_CATEGORY`, `PPH21_PROGRESSIVE_BRACKETS`, `BIAYA_JABATAN_RATE/MAX`) — semua sudah dihapus karena tidak di-import di mana pun. Lihat Section 0.3.

**`calculateAttendanceFlags(clockInUtc, clockOutUtc, scheduleStart, scheduleEnd)`** di `attendance.service.ts`:
- Pure function, no DB.
- Return `{ isLate, lateMinutes, isEarlyOut, earlyOutMinutes, overtimeMinutes, totalMinutes }`.
- Late = clockIn after scheduledStart (in WIB).
- Early-out = clockOut before scheduledEnd.
- Overtime = (clockOut - scheduledEnd) >= 30 menit.
- TotalMinutes = (clockOut - clockIn) / 60000.

**`countWorkingDays(start, end)`** di `leave.service.ts`:
- `eachDayOfInterval({ start, end }).filter(d => !isWeekend(d)).length`.
- Saturday + Sunday excluded; libur nasional tidak di-handle (asumsi tidak masuk hitungan cuti).

**`ensureLeaveBalances(employeeId, year)`**:
- Upsert `LeaveBalance` untuk setiap `LeaveType` aktif dengan `allocatedDays = annualQuota`, `usedDays = 0`.
- Idempotent (update branch `{}` — no-op kalau sudah ada).

**`getEmployeesForManager(userId, params)`**:
- Lookup manager.departmentId → call `getEmployees({ ...params, departmentId })`.
- Dipakai di Manager dashboard & employee list (scope dept).

**`canManagerAccessEmployee(managerUserId, employeeId)`**:
- Boolean check apakah manager dan employee di department sama.

**Dashboard agregator** (`dashboard.service.ts`):
- 4 function: `getSuperAdminDashboardData`, `getHrAdminDashboardData`, `getManagerDashboardData(userId)`, `getEmployeeDashboardData(userId)`.
- Pakai `Promise.all` multi-query untuk agregasi:
  - count per role
  - employee stats (active, PKWT/PKWTT split, joined this month)
  - pending leave count (via `prisma.leaveRequest.count` langsung di dashboard.service)
  - attendance trend 7 hari (groupBy date + countIf isLate)
  - upcoming birthdays (filter `tanggalLahir` MM-DD dalam 7 hari)
  - PKWT contracts expiring (joinDate + 12 bulan)
  - latest payslip per employee.

---

*Akhir dump-part5.md.*

---

*Akhir hrms-context-dump.md.*
