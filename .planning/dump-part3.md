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
- Upload via `EmployeeDocumentForm` → POST `/api/employees/[id]/documents` (multipart) → simpan ke Vercel Blob, lalu insert `EmployeeDocument` row.
- Delete via DELETE `/api/employees/[id]/documents/[docId]` → hapus dari Blob + cascade delete row.
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
2. Form: leaveTypeId, startDate, endDate, reason, attachment (optional).
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
12. Return `{ success: true, data: { payrollRunId, entryCount, warnings: [] } }`.
13. Client redirect ke `/payroll/[periodId]` untuk preview.

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
3. CV upload: client POST file ke `/api/recruitment/cv` (multipart) → response `{ cvPath }` (Vercel Blob URL).
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
3. Client redirect ke `/employees/new?candidateId=...` dengan query string prefill.
4. Form karyawan baru auto-fill data dari candidate.
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
- **Validasi**: tidak boleh delete kalau masih ada Employee yang memakai department/position/officeLocation tersebut. Service throw error "Tidak dapat menghapus karena masih digunakan oleh X karyawan".

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
| baseSalary | Gaji pokok (Decimal 15,2) | Decimal | No | 0 | - |
| isTaxBorneByCompany | PPh 21 ditanggung perusahaan | Boolean | No | false | - |
| createdAt | - | DateTime | No | now() | - |
| updatedAt | - | DateTime | No | @updatedAt | - |

**Relasi**: `user` (1:1), `department` (N:1), `position` (N:1), `officeLocation` (N:1 optional), `documents` (1:N), `emergencyContacts` (1:N), `attendances` (1:N), `leaveRequests` (1:N), `leaveBalances` (1:N), `allowances` (1:N), `payrollEntries` (1:N).

---

### 8.9 Model: EmployeeDocument (`employee_documents`)

Dokumen karyawan (PDF/image), file disimpan di Vercel Blob.

| Field | Deskripsi | Tipe Data | Nullable | Default | Relasi |
|---|---|---|---|---|---|
| id | PK | String | No | cuid() | PK |
| employeeId | FK Employee | String | No | - | FK (cascade delete) |
| documentType | Jenis dokumen | DocumentType | No | - | - |
| fileName | Nama asli file | String | No | - | - |
| filePath | URL Vercel Blob | String | No | - | - |
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
| attachmentPath | URL Blob lampiran | String | Yes | null | - |
| attachmentName | Nama file lampiran | String | Yes | null | - |
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

### 8.14 Model: EmployeeAllowance (`employee_allowances`)

Tunjangan tetap per karyawan (legacy dari Phase 4 awal sebelum pivot — saat ini tidak dipakai untuk kalkulasi karena payroll sudah pivot ke Excel).

| Field | Deskripsi | Tipe Data | Nullable | Default | Relasi |
|---|---|---|---|---|---|
| id | PK | String | No | cuid() | PK |
| employeeId | FK Employee | String | No | - | FK (cascade) |
| name | Nama tunjangan | String | No | - | - |
| amount | Nominal (Decimal 15,2) | Decimal | No | - | - |
| isFixed | Fixed atau variable | Boolean | No | true | - |
| createdAt | - | DateTime | No | now() | - |
| updatedAt | - | DateTime | No | @updatedAt | - |

---

### 8.15 Model: PayrollRun (`payroll_runs`)

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
| cvPath | URL Blob CV | String | Yes | null | - |
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
