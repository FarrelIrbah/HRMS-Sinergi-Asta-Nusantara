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
| EmployeeDocument | Entity (Prisma) | prisma/schema.prisma | Dokumen karyawan (Vercel Blob) |
| EmergencyContact | Entity (Prisma) | prisma/schema.prisma | Kontak darurat (max 3 per Employee) |
| AttendanceRecord | Entity (Prisma) | prisma/schema.prisma | Absensi harian (unique [employeeId, date]) |
| LeaveRequest | Entity (Prisma) | prisma/schema.prisma | Pengajuan cuti dengan 2-stage approval |
| LeaveBalance | Entity (Prisma) | prisma/schema.prisma | Saldo cuti per Employee/LeaveType/year |
| EmployeeAllowance | Entity (Prisma) | prisma/schema.prisma | Tunjangan tetap (legacy, tidak dipakai pasca pivot) |
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
| employee documents route | Controller (REST) | src/app/api/employees/[id]/documents/route.ts | GET list / POST upload dokumen ke Vercel Blob |
| employee document detail route | Controller (REST) | src/app/api/employees/[id]/documents/[docId]/route.ts | DELETE dokumen + hapus dari Blob |
| payslip route | Controller (REST) | src/app/api/payroll/payslip/[entryId]/route.ts | GET → render PDF slip gaji |
| payroll template route | Controller (REST) | src/app/api/payroll/template/route.ts | GET → download template Excel kosong |
| payroll report route | Controller (REST) | src/app/api/payroll-report/route.ts | GET → laporan rekap payroll periode |
| recruitment CV route | Controller (REST) | src/app/api/recruitment/cv/route.ts | POST upload CV kandidat ke Blob |
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
| employee-document.service.ts | Service | src/lib/services/employee-document.service.ts | Upload/delete dokumen via Vercel Blob |
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
