# Dump Dokumentasi Skripsi BAB 4-5 — Part 1

Dokumen ini berisi dump lengkap untuk tiga seksi yang diminta:
- Seksi 1: Prisma Schema lengkap.
- Seksi 2: Daftar SEMUA REST API Routes dan Server Actions.
- Seksi 7: Detail method/fungsi setiap controller (REST handler + Server Action) lengkap dengan langkah-langkahnya.

Catatan arsitektural penting: Codebase HRMS ini menggunakan Next.js App Router. Sebagian besar mutasi data (CRUD) tidak diekspos sebagai REST API tetapi sebagai **Next.js Server Actions** yang berada di `src/lib/actions/*.actions.ts`. Folder `src/app/api/` hanya berisi 9 endpoint khusus (NextAuth, upload file PDF/CV, generator PDF, export Excel). Karena itu dalam dokumentasi ini Server Actions diperlakukan sebagai "Controller" sejajar dengan REST API Route Handlers.

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
  baseSalary             Decimal        @default(0) @db.Decimal(15, 2)
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
  allowances        EmployeeAllowance[]
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
  attachmentPath      String?
  attachmentName      String?
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

model EmployeeAllowance {
  id          String   @id @default(cuid())
  employeeId  String
  name        String
  amount      Decimal  @db.Decimal(15, 2)
  isFixed     Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  employee Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@map("employee_allowances")
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
| `convertCandidateToEmployeeAction(candidateId)` | id | Validasi stage `DITERIMA`, set `hiredAt = now`, audit. Kembalikan `prefill` (fullName, email, phone, departmentId, cvPath, candidateId) untuk auto-fill form `/employees/new`. Konversi sebenarnya ke Employee dilakukan via `createEmployeeAction`. | `Candidate`, `AuditLog` |

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
  7. Return `{ success: true, prefill }` — UI berikutnya redirect ke `/employees/new?candidateId=...` dan auto-fill form. Konversi DB sebenarnya dilakukan oleh `createEmployeeAction` saat HR submit form karyawan baru.

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
