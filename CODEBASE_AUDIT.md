# CODEBASE AUDIT — HRMS PT Sinergi Asta Nusantara
Generated on: 2026-05-12

Audit ini dihasilkan dari pembacaan langsung file source code. Setiap klaim disertai path file sebagai bukti. Hanya fitur yang benar-benar ter-implementasi di kode yang dicatat di sini.

---

## 1. Tech Stack (dari `package.json`)

### Framework & Runtime
- **Next.js**: `14.2.35` (App Router)
- **React**: `^18`
- **React DOM**: `^18`
- **TypeScript**: `^5`
- **Node typings**: `@types/node ^20`

### Database & ORM
- **Database**: PostgreSQL (dari `prisma/schema.prisma` line 9 — `provider = "postgresql"`)
- **ORM**: `prisma` (dev) `^6.19.2` + `@prisma/client ^6.19.2`
- Output client di-generate ke `src/generated/prisma` (lihat `schema.prisma` line 5)

### Auth
- **next-auth**: `^5.0.0-beta.30` (Auth.js v5)
- **@auth/prisma-adapter**: `^2.11.1`
- **bcryptjs**: `^3.0.3` (password hashing)

### UI / Komponen
- **Tailwind CSS**: `^3.4.1`
- **tailwindcss-animate**: `^1.0.7`
- **tailwind-merge**: `^3.5.0`
- **class-variance-authority**: `^0.7.1`
- **clsx**: `^2.1.1`
- **lucide-react** (icons): `^0.575.0`
- **shadcn-style primitives (Radix UI)**: alert-dialog, avatar, collapsible, dialog, dropdown-menu, label, popover, progress, scroll-area, select, separator, slot, tabs, toast, tooltip
- **next-themes**: `^0.4.6`
- **sonner** (toast): `^2.0.7`

### Form / Validasi / Tabel
- **react-hook-form**: `^7.71.2`
- **@hookform/resolvers**: `^5.2.2`
- **zod**: `^4.3.6`
- **@tanstack/react-table**: `^8.21.3`
- **react-day-picker**: `^9.14.0`

### Drag & Drop (Kanban)
- **@dnd-kit/core**: `^6.3.1`
- **@dnd-kit/sortable**: `^10.0.0`
- **@dnd-kit/utilities**: `^3.2.2`

### File / Dokumen / Tanggal / Jaringan
- **@react-pdf/renderer**: `^4.3.2` (PDF generation)
- **xlsx**: `^0.18.5` (Excel import/template)
- **date-fns**: `^4.1.0`
- **date-fns-tz**: `^3.2.0`
- **decimal.js**: `^10.6.0`
- **ip-range-check**: `^0.2.0`
- **dotenv**: `^17.3.1`
- **nuqs**: `^2.8.8` (URL search-param state)
- **recharts**: `^2.15.4` (charts di dashboard & laporan)

### Tooling Dev
- **eslint**: `^8` + `eslint-config-next 14.2.35`
- **tsx**: `^4.21.0` (untuk seed)
- **postcss**: `^8`

### Catatan
- Tidak ada test framework (Jest/Vitest/Playwright) yang terpasang. Tidak ada folder `tests/` atau file `*.test.ts`.

---

## 2. Database Schema (dari `prisma/schema.prisma`)

### Enums
- **Role**: `SUPER_ADMIN`, `HR_ADMIN`, `MANAGER`, `EMPLOYEE`
- **AuditAction**: `CREATE`, `UPDATE`, `DELETE`
- **Gender**: `MALE`, `FEMALE`
- **Religion**: `ISLAM`, `KRISTEN`, `KATOLIK`, `HINDU`, `BUDDHA`, `KONGHUCU`
- **MaritalStatus**: `TK`, `K`
- **ContractType**: `PKWT`, `PKWTT`
- **PTKPStatus**: `TK_0`, `TK_1`, `TK_2`, `TK_3`, `K_0`, `K_1`, `K_2`, `K_3`
- **DocumentType**: `KTP`, `NPWP`, `BPJS_KESEHATAN`, `BPJS_KETENAGAKERJAAN`, `KONTRAK`, `FOTO`, `LAINNYA`
- **AttendanceStatus**: `ON_TIME`, `LATE`, `EARLY_OUT`, `OVERTIME`, `LATE_AND_EARLY_OUT`, `LATE_AND_OVERTIME`
- **LeaveStatus**: `PENDING_MANAGER`, `PENDING_HR`, `APPROVED`, `REJECTED`, `CANCELLED`
- **PayrollStatus**: `DRAFT`, `FINALIZED`
- **VacancyStatus**: `OPEN`, `CLOSED`
- **CandidateStage**: `MELAMAR`, `SELEKSI_BERKAS`, `INTERVIEW`, `PENAWARAN`, `DITERIMA`, `DITOLAK`

> Catatan: enum yang sama juga di-mirror di `src/types/enums.ts` (client-safe, tidak import dari Prisma).

### Models

#### User (`users`)
- `id`: String (cuid, PK)
- `name`: String
- `email`: String (unique)
- `hashedPassword`: String
- `role`: Role (default `EMPLOYEE`)
- `isActive`: Boolean (default `true`)
- `createdAt`, `updatedAt`: DateTime
- Relasi: `auditLogs`, `employee` (one), `attendanceOverrides`, `leaveManagerApprovals`, `leaveHRApprovals`

#### Department (`departments`)
- `id`, `name`, `description?`, `deletedAt?` (soft delete), `createdAt`, `updatedAt`
- Relasi: `positions[]`, `employees[]`, `vacancies[]`

#### Position (`positions`)
- `id`, `name`, `departmentId`, `deletedAt?`, `createdAt`, `updatedAt`
- Relasi: `department`, `employees[]`

#### OfficeLocation (`office_locations`)
- `id`, `name`, `address?`
- `allowedIPs`: String[]
- `latitude?`, `longitude?`, `radiusMeters?`
- `workStartTime?`, `workEndTime?` (String, format jam)
- `deletedAt?`, `createdAt`, `updatedAt`
- Relasi: `employees[]`, `attendances[]`

#### LeaveType (`leave_types`)
- `id`, `name`, `annualQuota` (Int), `isPaid` (Boolean default true)
- `genderRestriction?` (String, bukan enum di schema)
- `deletedAt?`, `createdAt`, `updatedAt`
- Relasi: `leaveRequests[]`, `leaveBalances[]`

#### AuditLog (`audit_logs`)
- `id`, `userId`, `action` (AuditAction), `module` (String), `targetId` (String)
- `oldValue?` Json, `newValue?` Json
- `createdAt`
- Index: `[userId, module, createdAt]`

#### Employee (`employees`)
- `id` (cuid), `nik` (unique, string), `userId` (unique, FK ke User)
- `namaLengkap`, `nikKtp?`, `tempatLahir?`, `tanggalLahir?`
- `jenisKelamin?` (Gender), `statusPernikahan?` (MaritalStatus), `agama?` (Religion)
- `alamat?`, `nomorHp?`, `email`
- `departmentId`, `positionId`, `officeLocationId?`
- `contractType` (ContractType), `joinDate`, `isActive` (default true)
- `terminationDate?`, `terminationReason?`
- `npwp?`, `ptkpStatus?` (PTKPStatus)
- `bpjsKesehatanNo?`, `bpjsKetenagakerjaanNo?`
- `isTaxBorneByCompany` (Boolean default false)
- Relasi: user, department, position, officeLocation, `documents[]`, `emergencyContacts[]`, `attendances[]`, `leaveRequests[]`, `leaveBalances[]`, `payrollEntries[]`

#### EmployeeDocument (`employee_documents`)
- `id`, `employeeId` (cascade), `documentType` (DocumentType)
- `fileName`, `filePath`, `fileSize` (Int), `mimeType`
- `createdAt`, `updatedAt`

#### EmergencyContact (`emergency_contacts`)
- `id`, `employeeId` (cascade), `name`, `relationship`, `phone`, `address?`
- `createdAt`, `updatedAt`

#### AttendanceRecord (`attendance_records`)
- `id`, `employeeId`, `officeLocationId`
- `date` (Date)
- `clockIn?`, `clockOut?` (DateTime)
- `clockInIp?`, `clockOutIp?`
- `clockInLat?`, `clockInLon?` (Float)
- `isLate`, `lateMinutes` (Int)
- `isEarlyOut`, `earlyOutMinutes` (Int)
- `overtimeMinutes` (Int)
- `totalMinutes` (Int)
- `isManualOverride`, `overrideById?` (FK User), `overrideReason?`
- Unique: `[employeeId, date]` ; Index `[employeeId, date]`

#### LeaveRequest (`leave_requests`)
- `id`, `employeeId`, `leaveTypeId`
- `startDate`, `endDate` (Date), `workingDays` (Int)
- `reason` (String)
- `status` (LeaveStatus, default `PENDING_MANAGER`)
- `managerApprovedById?`, `managerNotes?`, `managerApprovedAt?`
- `hrApprovedById?`, `hrNotes?`, `hrApprovedAt?`
- Index: `[employeeId, status]`, `[status, createdAt]`

#### LeaveBalance (`leave_balances`)
- `id`, `employeeId`, `leaveTypeId`, `year` (Int)
- `allocatedDays`, `usedDays` (Int)
- Unique `[employeeId, leaveTypeId, year]`

#### PayrollRun (`payroll_runs`)
- `id`, `month` (Int), `year` (Int)
- `status` (PayrollStatus, default DRAFT)
- `createdBy` (String — userId, no FK relation)
- Unique `[month, year]`

#### PayrollEntry (`payroll_entries`)
- `id`, `payrollRunId` (cascade), `employeeId`
- Employee snapshot: `employeeNik`, `employeeName`, `jobPosition`, `organization`, `gradeLevel`, `ptkpStatus` (String), `npwp?`
- Earnings (Decimal 15,2): `basicSalary`, `tunjanganKomunikasi`, `tunjanganKehadiran`, `tunjanganJabatan`, `tunjanganLainnya`, `taxAllowance`, `thr`, `totalEarnings`
- Deductions (Decimal 15,2): `bpjsKesehatanEmployee`, `jhtEmployee`, `jaminanPensiunEmployee`, `pph21`, `potonganKeterlambatan`, `potonganKoperasi`, `potonganLainnya`, `totalDeductions`
- `takeHomePay` (Decimal)
- Benefits (informational): `jkk`, `jkm`, `jhtCompany`, `jaminanPensiunCompany`, `bpjsKesehatanCompany`, `totalBenefits`
- Attendance summary: `actualWorkingDay`, `scheduleWorkingDay`, `dayoff`, `nationalHoliday`, `companyHoliday`, `specialHoliday`, `attendanceCodes` (String)
- Unique: `[payrollRunId, employeeId]`

#### Vacancy (`vacancies`)
- `id`, `title`, `departmentId`, `description`, `requirements` (Text)
- `status` (VacancyStatus, default OPEN)
- `openDate`, `closeDate?`

#### Candidate (`candidates`)
- `id`, `vacancyId`, `name`, `email`, `phone?`
- `stage` (CandidateStage, default MELAMAR)
- `cvPath?`, `notes?` (Text)
- `offerSalary?` (Decimal 15,2), `offerNotes?` (Text)
- `hiredAt?`

#### Interview (`interviews`)
- `id`, `candidateId`, `scheduledAt`, `interviewerName?`, `notes?` (Text)

### Relasi antar Model (ringkas)
- `User 1—1 Employee` (via `Employee.userId` unique)
- `User 1—N AuditLog`
- `User 1—N AttendanceRecord` (sebagai overrider, named relation `AttendanceOverrides`)
- `User 1—N LeaveRequest` (manager approver & HR approver, dua named relations)
- `Department 1—N Position`
- `Department 1—N Employee`
- `Department 1—N Vacancy`
- `Position 1—N Employee`
- `OfficeLocation 1—N Employee`
- `OfficeLocation 1—N AttendanceRecord`
- `Employee 1—N EmployeeDocument` (cascade delete)
- `Employee 1—N EmergencyContact` (cascade delete)
- `Employee 1—N AttendanceRecord`
- `Employee 1—N LeaveRequest`
- `Employee 1—N LeaveBalance`
- `Employee 1—N PayrollEntry`
- `LeaveType 1—N LeaveRequest`
- `LeaveType 1—N LeaveBalance`
- `PayrollRun 1—N PayrollEntry` (cascade delete)
- `Vacancy 1—N Candidate`
- `Candidate 1—N Interview`

---

## 3. Daftar Halaman / Routes (App Router)

Group `(auth)`:
- `/login` → `src/app/(auth)/login/page.tsx` — login dengan email+password (public)

Group `(dashboard)` — dilindungi oleh `auth()` check + `redirect("/login")` di `src/app/(dashboard)/layout.tsx`:
- `/dashboard` → `src/app/(dashboard)/dashboard/page.tsx` — dashboard role-aware (4 varian)
- `/employees` → list karyawan (`employees/page.tsx`)
- `/employees/new` → form tambah karyawan (HR_ADMIN/SUPER_ADMIN)
- `/employees/[id]` → profil karyawan dengan tabs (Personal, Employment, Tax/BPJS, Documents, Emergency Contacts)
- `/attendance` → halaman clock in/out + history sendiri
- `/attendance-admin` → rekap bulanan kehadiran (HR_ADMIN/SUPER_ADMIN/MANAGER) — manager dibatasi per `departmentId`
- `/attendance-admin/[employeeId]` → detail per karyawan
- `/leave` → halaman cuti karyawan (form + balance + history)
- `/leave/manage` → approval cuti (HR_ADMIN/SUPER_ADMIN/MANAGER)
- `/leave/report` → laporan cuti (HR_ADMIN/SUPER_ADMIN)
- `/payroll` → list payroll runs + form impor Excel (HR_ADMIN/SUPER_ADMIN)
- `/payroll/[periodId]` → detail entries 1 periode + tombol finalize
- `/payslip` → list slip gaji karyawan (semua role; data sesuai user)
- `/recruitment` → list lowongan (HR_ADMIN/SUPER_ADMIN)
- `/recruitment/new` → form buat lowongan
- `/recruitment/[vacancyId]` → kanban kandidat per lowongan
- `/recruitment/candidates/[candidateId]` → detail kandidat (offer, interviews, convert-to-employee)
- `/users` → manajemen user (SUPER_ADMIN saja)
- `/master-data` → tabs Departemen/Jabatan/Lokasi Kantor/Jenis Cuti (SUPER_ADMIN saja)
- `/audit-log` → list log audit (SUPER_ADMIN saja)
- `/audit-log/[id]` → detail satu entry log

Root:
- `/` → `src/app/page.tsx` — `redirect("/login")`

### Akses per Role (dari `src/components/layout/sidebar.tsx`)
- `Dashboard`, `Karyawan`, `Absensi`, `Cuti`, `Slip Gaji` → semua role
- `Admin Absensi`, `Kelola Cuti` → SUPER_ADMIN, HR_ADMIN, MANAGER
- `Laporan Cuti`, `Penggajian`, `Rekrutmen` → SUPER_ADMIN, HR_ADMIN
- `Pengguna`, `Data Master`, `Log Audit` → SUPER_ADMIN saja

---

## 4. Daftar API Endpoints / Server Actions

### REST API Routes (`src/app/api/`)
- `GET /api/auth/[...nextauth]` → handler NextAuth (`src/app/api/auth/[...nextauth]/route.ts`)
- `GET /api/attendance/export` → CSV/Excel export rekap absensi
- `POST /api/employees/[id]/documents` → upload dokumen karyawan (max 5MB; mime: pdf/jpeg/png)
- `GET /api/employees/[id]/documents/[docId]` → download/stream dokumen
- `DELETE /api/employees/[id]/documents/[docId]` → hapus dokumen
- `GET /api/payroll/payslip/[entryId]` → generate PDF payslip (via `@react-pdf/renderer`)
- `GET /api/payroll/template` → download template Excel impor payroll
- `GET /api/payroll-report` → laporan payroll (csv/xlsx)
- `POST /api/recruitment/cv` → upload CV kandidat
- `GET /api/recruitment/offer-letter/[candidateId]` → generate PDF offer letter

### Server Actions (`src/lib/actions/`)
**employee.actions.ts**:
- `createEmployeeAction`, `updatePersonalInfoAction`, `updateEmploymentAction`, `updateTaxBpjsAction`, `deactivateEmployeeAction`

**employee-document.actions.ts** (handles emergency contacts, bukan documents):
- `createEmergencyContactAction`, `updateEmergencyContactAction`, `deleteEmergencyContactAction`

**attendance.actions.ts**:
- `clockInAction`, `clockOutAction`, `manualOverrideAction`

**leave.actions.ts**:
- `submitLeaveAction`, `approveLeaveAction`, `rejectLeaveAction`, `cancelLeaveAction`

**master-data.actions.ts**:
- Department: `getDepartmentsAction`, `getAllDepartmentsAction`, `createDepartmentAction`, `updateDepartmentAction`, `deleteDepartmentAction`
- Position: `getPositionsAction`, `getAllPositionsAction`, `createPositionAction`, `updatePositionAction`, `deletePositionAction`
- OfficeLocation: `getOfficeLocationsAction`, `createOfficeLocationAction`, `updateOfficeLocationAction`, `deleteOfficeLocationAction`
- LeaveType: `getLeaveTypesAction`, `createLeaveTypeAction`, `updateLeaveTypeAction`, `deleteLeaveTypeAction`

**payroll.actions.ts**:
- `importPayrollAction` (upload Excel/CSV, parse, match NIK, persist as DRAFT)
- `finalizePayrollAction`

**recruitment.actions.ts**:
- Vacancy: `createVacancyAction`, `updateVacancyAction`, `toggleVacancyStatusAction`
- Candidate: `createCandidateAction`, `updateCandidateStageAction`, `updateOfferAction`
- Interview: `createInterviewAction`
- `convertCandidateToEmployeeAction`

**user.actions.ts**:
- `createUserAction`, `updateUserAction`, `toggleUserActiveAction`

---

## 5. Sistem Autentikasi & Otorisasi

### Provider
- **Auth.js v5 (`next-auth ^5.0.0-beta.30`)** dengan **Credentials provider** (email + password).
- Password hashing: `bcryptjs` (verifikasi via `bcrypt.compare`) — lihat `src/lib/auth.ts:31`.
- Session strategy: `jwt`, maxAge `8 jam`.
- Field tambahan di JWT/Session: `id`, `role` (lihat callbacks `jwt` & `session`).

### Config
- `src/lib/auth.config.ts` — Edge-compatible config dengan callback `authorized` yang:
  - Mengizinkan path `/login` dan `/api/auth/*`
  - Selain itu butuh `auth.user` (kalau tidak ada → redirect ke `/login`)
- `src/lib/auth.ts` — full config dengan provider Credentials (Node runtime, karena bcrypt).

### Middleware
- `src/middleware.ts` membungkus `NextAuth(authConfig).auth`.
- Matcher: `["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"]` — semua route kecuali asset & nextauth endpoint.

### Roles & Otorisasi
- 4 roles: `SUPER_ADMIN`, `HR_ADMIN`, `MANAGER`, `EMPLOYEE` (enum di schema & `src/types/enums.ts`).
- Authorization dilakukan di tiga tempat:
  1. **Layout `(dashboard)`** → cek session, redirect ke `/login` jika tidak ada.
  2. **Per-page server check** → contoh `src/app/(dashboard)/payroll/page.tsx:62` (`if (!["HR_ADMIN","SUPER_ADMIN"].includes(role)) redirect("/dashboard")`).
  3. **Sidebar filter** → menu disembunyikan berdasarkan `roles[]` (`src/components/layout/sidebar.tsx`).
  4. **Action-level guard** → contoh `requireHRAdmin()` di `src/lib/actions/payroll.actions.ts:21`.

### Audit Trail
- Helper `createAuditLog(...)` di `src/lib/prisma.ts` digunakan oleh action HR (CRUD penting) untuk mencatat ke tabel `audit_logs`.

---

## 6. Daftar Komponen Utama per Modul

### Modul Layout / Shared
- `src/components/layout/sidebar.tsx` — `Sidebar`, `MobileSidebar` (role-aware menu).
- `src/components/layout/header.tsx` — header dengan profil & logout.
- `src/components/layout/breadcrumbs.tsx` — breadcrumb generator.
- `src/components/layout/session-provider.tsx` & `src/components/providers/session-provider.tsx` — wrapper NextAuth SessionProvider.
- `src/components/shared/data-table.tsx`, `data-table-pagination.tsx` — TanStack table generic.
- `src/components/shared/confirm-dialog.tsx`, `loading-skeleton.tsx`, `stat-card.tsx`, `summary-tile.tsx`.
- `src/components/ui/*` — shadcn-style primitives (button, dialog, form, table, select, dll).

### Modul Employee Data Management
- `employees/_components/employee-table.tsx`, `employee-columns.tsx`, `employee-filters.tsx` — listing.
- `employees/new/_components/create-employee-form.tsx` — form tambah karyawan.
- `employees/[id]/_components/employee-profile-tabs.tsx` (wrapper tabs)
- Tabs: `personal-info-tab.tsx`, `employment-details-tab.tsx`, `tax-bpjs-tab.tsx`, `documents-tab.tsx`, `emergency-contacts-tab.tsx`
- `employees/[id]/_components/deactivate-employee-dialog.tsx`.

### Modul Attendance (Absensi)
- `attendance/_components/clock-in-button.tsx` — clock in/out, butuh geolocation.
- `attendance/_components/attendance-today.tsx`, `attendance-history.tsx`
- `attendance-admin/_components/attendance-filters.tsx`, `attendance-summary-table.tsx`, `manual-record-dialog.tsx`, `export-buttons.tsx`
- `src/components/attendance/attendance-status-badges.tsx` — badge On Time/Late/Early Out/Overtime.

### Modul Leave (Cuti)
- `leave/_components/leave-balance-card.tsx`, `leave-history-table.tsx`, `leave-request-form.tsx`, `leave-request-section.tsx`, `leave-type-info-panel.tsx`
- `leave/manage/_components/approve-reject-dialog.tsx`, `leave-approval-table.tsx`
- `leave/report/_components/leave-report-filters.tsx`, `leave-report-kpi-cards.tsx`, `leave-report-trend-chart.tsx`

### Modul Payroll
- `payroll/_components/import-payroll-form.tsx` — upload Excel/CSV.
- `payroll/[periodId]/_components/payroll-entry-table.tsx`, `finalize-button.tsx`
- PDF: `src/lib/pdf/payslip-pdf.tsx` (slip gaji), `attendance-pdf.tsx` (rekap absensi).

### Modul Recruitment
- `recruitment/_components/vacancy-table.tsx`
- `recruitment/new/_components/create-vacancy-form.tsx`
- `recruitment/[vacancyId]/_components/kanban-board.tsx` (drag-and-drop dnd-kit), `add-candidate-dialog.tsx`
- `recruitment/candidates/[candidateId]/_components/candidate-detail-client.tsx`
- PDF: `src/lib/pdf/offer-letter-pdf.tsx`

### Modul Master Data (SUPER_ADMIN)
- `master-data/_components/master-data-tabs.tsx`
- Department: `department-tab.tsx`, `department-form-dialog.tsx`
- Position: `position-tab.tsx`, `position-form-dialog.tsx`
- OfficeLocation: `office-location-tab.tsx`, `office-location-form-dialog.tsx`
- LeaveType: `leave-type-tab.tsx`, `leave-type-form-dialog.tsx`

### Modul User Management
- `users/_components/user-table.tsx`, `user-columns.tsx`, `user-form-dialog.tsx`, `user-page-header.tsx`

### Modul Audit Log
- `audit-log/_components/audit-log-table.tsx`, `audit-log-columns.tsx`, `audit-log-filters.tsx`

### Modul Dashboard
- `dashboard/_components/super-admin-dashboard.tsx`
- `dashboard/_components/hr-admin-dashboard.tsx`
- `dashboard/_components/manager-dashboard.tsx`
- `dashboard/_components/employee-dashboard.tsx`

---

## 7. Validasi (Zod Schemas)

### `src/lib/validations/auth.ts`
- **loginSchema**: `email` (email), `password` (min 1)

### `src/lib/validations/user.ts`
- **createUserSchema**: `name` (2..100), `email`, `password` (min 8, regex butuh upper+lower+angka), `role` (Role enum)
- **updateUserSchema**: `name` (2..100), `email`, `role`

### `src/lib/validations/employee.ts`
- **createEmployeeSchema**: `namaLengkap`, `email`, `initialPassword` (min 8, upper/lower/angka), `departmentId`, `positionId`, `contractType` (ContractType), `joinDate`. Optional: `nikKtp` (length 16), `tempatLahir`, `tanggalLahir`, `jenisKelamin`, `statusPernikahan`, `agama`, `alamat`, `nomorHp`, `npwp`, `ptkpStatus`, `bpjsKesehatanNo`, `bpjsKetenagakerjaanNo`
- **updatePersonalInfoSchema**: namaLengkap + field personal optional
- **updateEmploymentSchema**: departmentId, positionId, contractType, joinDate, officeLocationId
- **updateTaxBpjsSchema**: npwp, ptkpStatus, bpjsKesehatanNo, bpjsKetenagakerjaanNo, isTaxBorneByCompany
- **emergencyContactSchema**: name, relationship, phone (semua required), address optional
- **deactivateEmployeeSchema**: terminationDate, terminationReason

### `src/lib/validations/master-data.ts`
- **departmentSchema**: name (2..100), description (max 500, optional)
- **positionSchema**: name (2..100), departmentId
- **officeLocationSchema**: name (min 2), address, allowedIPs (string[]), latitude, longitude, radiusMeters (50..10000)
- **leaveTypeSchema**: name (min 2), annualQuota (0..365), isPaid (bool), genderRestriction (MALE/FEMALE/null)

### `src/lib/validations/attendance.ts`
- **clockActionSchema**: latitude/longitude optional
- **manualAttendanceSchema**: employeeId, date, clockIn (HH:MM regex), clockOut (HH:MM optional), overrideReason (required)

### `src/lib/validations/leave.ts`
- **submitLeaveSchema**: leaveTypeId, startDate, endDate, reason (1..500). Refine: `endDate >= startDate`.
- **approveLeaveSchema**: leaveRequestId, notes optional
- **rejectLeaveSchema**: leaveRequestId, notes (required, alasan penolakan)

### `src/lib/validations/payroll.ts`
- **importPayrollSchema**: month (1..12), year (2024..2099)
- **finalizePayrollSchema**: payrollRunId

### `src/lib/validations/recruitment.ts`
- **createVacancySchema**: title, departmentId, description, requirements, openDate, closeDate optional
- **updateVacancySchema**: partial dari create
- **createCandidateSchema**: name, email, phone optional, notes optional
- **updateCandidateStageSchema**: stage (CandidateStage)
- **updateOfferSchema**: offerSalary (positive optional), offerNotes optional
- **createInterviewSchema**: scheduledAt, interviewerName optional, notes optional

---

## 8. Fitur-Fitur yang BENAR-BENAR Ada (evidence-based)

### Autentikasi & Otorisasi
- Login email+password dengan bcrypt + JWT session (8 jam).
- 4 role hierarki: SUPER_ADMIN > HR_ADMIN > MANAGER > EMPLOYEE.
- Filter menu sidebar per-role.
- Middleware guard + per-page redirect.
- Audit logging untuk operasi CRUD oleh HR/Admin (tabel `audit_logs`).

### Employee Data Management
- CRUD karyawan + pembuatan user account otomatis (initialPassword di-hash).
- Profil karyawan dengan tabs (Personal, Employment, Tax/BPJS, Documents, Emergency Contacts).
- Upload/download/delete dokumen karyawan (PDF/JPEG/PNG, max 5MB) — file disimpan ke filesystem lokal (`mkdir`, `writeFile` di `/api/employees/[id]/documents`).
- Emergency contacts CRUD.
- Deaktivasi karyawan (terminationDate + reason).
- Soft-delete master data (Department, Position, OfficeLocation, LeaveType — kolom `deletedAt`).

### Attendance
- Clock in / Clock out dengan verifikasi lokasi (IP allowlist + opsional GPS radius).
- IP & GPS coordinates dicatat per record.
- Late & early-out & overtime calculation (`calculateAttendanceFlags` di `attendance.service.ts`).
- Rekap bulanan + filter departemen (manager dibatasi ke departemennya).
- Manual override oleh HR/admin (tercatat siapa override & alasan).
- Export rekap absensi (CSV/Excel via `/api/attendance/export`).
- PDF rekap absensi (`attendance-pdf.tsx`).

### Leave Management
- Pengajuan cuti karyawan + perhitungan `workingDays` (helper `countWorkingDays`).
- Workflow 2-tahap: `PENDING_MANAGER` → `PENDING_HR` → `APPROVED`/`REJECTED`/`CANCELLED`.
- Saldo cuti per tahun per LeaveType (`LeaveBalance`).
- Laporan cuti (KPI cards + trend chart via `recharts`).
- Restriksi gender pada LeaveType (`genderRestriction`).

### Payroll (IMPORT-BASED, bukan perhitungan otomatis)
- Download template Excel (`/api/payroll/template` — `buildPayrollTemplate`).
- Upload file Excel/CSV (xlsx/xls/csv) — parsing struktural (`parsePayrollWorkbook`).
- Matching NIK → Employee.
- Persist sebagai PayrollRun status `DRAFT`; bisa import ulang untuk overwrite.
- Finalize → status `FINALIZED` (audit log dibuat).
- Snapshot semua field gaji disimpan di PayrollEntry (immutable setelah finalize).
- PDF slip gaji per entry (`/api/payroll/payslip/[entryId]` + `payslip-pdf.tsx`).
- Laporan payroll (`/api/payroll-report`).

### Recruitment
- CRUD lowongan (Vacancy) + toggle OPEN/CLOSED.
- Tambah kandidat + upload CV (`/api/recruitment/cv`).
- Kanban board drag-and-drop (`@dnd-kit`) untuk update stage kandidat (6 stage).
- Update offer salary & notes.
- Schedule interview (`createInterviewAction`).
- Generate Offer Letter PDF (`/api/recruitment/offer-letter/[candidateId]`).
- Convert candidate → Employee (`convertCandidateToEmployeeAction`).

### Master Data (SUPER_ADMIN)
- Department, Position, OfficeLocation (dengan IP allowlist, GPS, radius, jam kerja), LeaveType.

### User Management (SUPER_ADMIN)
- Create/Update user, toggle active.

### Audit Log (SUPER_ADMIN)
- Listing dengan filter (user, module, date range, pagination).
- Detail view dengan old/new JSON values.

### Dashboard
- 4 varian role-specific dashboard, masing-masing dengan data berbeda (`dashboard.service.ts` punya 4 fungsi `getXxxDashboardData`).

### Database Seed
- Idempotent seed di `prisma/seed.ts` + `seed-extras.ts`.

---

## 9. Fitur yang TIDAK Ada / Belum Diimplementasi

Berdasarkan inspeksi file (tidak ada code/file yang bersangkutan):

- **Perhitungan payroll otomatis** (BPJS/PPh21/THR engine). Sesuai memory `project_payroll_pivot.md` (2026-04-29): Phase 4 di-refactor menjadi **import-based** — engine kalkulasi dihapus. Payroll bergantung pada Excel eksternal.
- **Reset password / Forgot password flow** untuk user. Tidak ada endpoint atau action terkait reset password.
- **Self-update profile karyawan**. Endpoint update profil hanya bisa lewat HR/Admin route (server actions employee.actions.ts).
- **Notifikasi email / push notification** untuk approval cuti, payslip, dsb. Tidak ada layanan email (Resend, Nodemailer, SMTP).
- **Multi-factor authentication (2FA)**.
- **OAuth provider** (Google, Microsoft, dll) — hanya `Credentials` di `auth.ts`.
- **File storage cloud** (S3, GCS). Upload disimpan ke filesystem lokal via `fs/promises`.
- **Test suite** (unit/integration/e2e) — tidak ada framework test terpasang.
- **Internationalization (i18n)**. UI hard-coded Bahasa Indonesia.
- **API public/webhook** untuk integrasi eksternal.
- **Realtime feature** (WebSocket/SSE) — tidak ada library terkait.
- **Reporting export PDF untuk modul selain payroll dan offer letter**. Cuti & employee belum punya PDF report.
- **Bulk import karyawan** — hanya satu-per-satu via form. (Bulk hanya untuk payroll.)
- **Permission granular per-feature** di luar role-based. Tidak ada tabel Permission/RBAC granular.
- **Soft delete pada Employee/User**. Hanya `isActive` flag (User) atau `terminationDate` (Employee), bukan `deletedAt` seperti master data.
- **Phase 5 (Recruitment)**: status di MEMORY.md menyebut "NOT STARTED" — namun kode rekrutmen SUDAH ADA (Vacancy/Candidate/Interview models + actions + UI lengkap). Memory tampak out-of-date; berdasarkan code, Recruitment **sudah ter-implementasi**.

---

## Lampiran: Lokasi File Penting

| Konsep | Path |
|---|---|
| Prisma schema | `prisma/schema.prisma` |
| Seed | `prisma/seed.ts`, `prisma/seed-extras.ts` |
| NextAuth | `src/lib/auth.ts`, `src/lib/auth.config.ts` |
| Middleware | `src/middleware.ts` |
| Prisma client + audit helper | `src/lib/prisma.ts` |
| Enum client-safe | `src/types/enums.ts` |
| Konstanta label UI | `src/lib/constants.ts` |
| Server actions | `src/lib/actions/*.ts` |
| Service layer | `src/lib/services/*.ts` |
| Zod schemas | `src/lib/validations/*.ts` |
| PDF generators | `src/lib/pdf/*.tsx` |
| Pages | `src/app/(auth)/*`, `src/app/(dashboard)/*` |
| REST APIs | `src/app/api/*` |
