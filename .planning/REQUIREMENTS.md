# Requirements: HRMS PT. Sinergi Asta Nusantara

**Defined:** 2026-02-27
**Core Value:** HR staff can manage the complete employee lifecycle in one integrated system — from recruitment through payroll — with accurate Indonesian tax and social insurance compliance, accessible to each role at the appropriate level.

---

## v1 Requirements

### Authentication (AUTH)

- [ ] **AUTH-01**: User can log in with email and password
- [ ] **AUTH-02**: System redirects user to a role-specific dashboard after successful login
- [ ] **AUTH-03**: User session persists across browser refresh
- [ ] **AUTH-04**: User can log out from any page

### User Account Management (USER)

- [ ] **USER-01**: Super Admin can create user accounts with an assigned role (Super Admin / HR Admin / Manager / Employee)
- [ ] **USER-02**: Super Admin can deactivate or reactivate user accounts
- [ ] **USER-03**: Super Admin can change the role of an existing user account

### Master Data (MASTER)

- [ ] **MASTER-01**: Super Admin can create, edit, and delete departments (divisi/departemen)
- [ ] **MASTER-02**: Super Admin can create, edit, and delete positions (jabatan) linked to departments
- [ ] **MASTER-03**: Super Admin can configure office locations with name, allowed IP range(s), and GPS coordinates + radius for attendance restriction
- [ ] **MASTER-04**: Super Admin can configure leave types (name, annual quota, paid/unpaid, gender restriction if any)

### Audit Log (AUDIT)

- [ ] **AUDIT-01**: System records create, update, and delete actions with the acting user, timestamp, and before/after values
- [ ] **AUDIT-02**: Super Admin can view the audit log with filters by user, date range, and module

### Employee Data Management (EMP)

- [ ] **EMP-01**: HR Admin can create an employee profile with personal information (nama lengkap, NIK KTP, tanggal lahir, jenis kelamin, agama, alamat, nomor HP, email)
- [ ] **EMP-02**: HR Admin can record employment details per employee (nomor karyawan, departemen, jabatan, jenis kontrak PKWT/PKWTT, tanggal masuk, status kerja aktif)
- [ ] **EMP-03**: HR Admin can edit any field on an employee profile
- [ ] **EMP-04**: HR Admin can deactivate (terminate) an employee with a termination date and reason
- [ ] **EMP-05**: HR Admin can upload employee documents (KTP, NPWP, kartu BPJS, kontrak kerja, foto) per employee
- [ ] **EMP-06**: HR Admin can view and download uploaded employee documents
- [ ] **EMP-07**: HR Admin can add and edit emergency contact(s) per employee (name, relationship, phone)
- [ ] **EMP-08**: HR Admin can set and update an employee's PTKP category (TK/0, K/0, K/1, K/2, K/3) and store their BPJS Kesehatan and BPJS Ketenagakerjaan numbers
- [ ] **EMP-09**: Manager can view employee profiles for employees within their own department only
- [ ] **EMP-10**: Employee can view their own profile (read-only)

### Attendance Management (ATT)

- [ ] **ATT-01**: Employee can clock in via the web — server validates that the request originates from the employee's assigned office location (IP range match or GPS coordinates within configured radius)
- [ ] **ATT-02**: Employee can clock out via the web — same IP/GPS validation as clock-in
- [ ] **ATT-03**: System flags late arrival when clock-in time is after the employee's scheduled start time
- [ ] **ATT-04**: System flags early departure when clock-out time is before the employee's scheduled end time
- [ ] **ATT-05**: System calculates overtime hours when clock-out time exceeds scheduled end time by at least a configurable minimum threshold
- [ ] **ATT-06**: HR Admin can view a monthly attendance recap per employee (clock-in/out times, late/early flags, total hours, overtime)
- [ ] **ATT-07**: HR Admin can export the attendance report as PDF or Excel
- [ ] **ATT-08**: Manager can view attendance records for employees in their department

### Leave Management (LEAVE)

- [ ] **LEAVE-01**: Employee can submit a leave request specifying type, date range, and reason
- [ ] **LEAVE-02**: System supports all Indonesian statutory leave types per UU No. 13 Tahun 2003: cuti tahunan (12 hari kerja), cuti sakit (with doctor's note), cuti melahirkan (3 bulan), cuti keguguran (1.5 bulan), cuti haid (2 hari pertama), cuti pernikahan (3 hari), cuti pernikahan anak (2 hari), cuti khitan/baptis anak (2 hari), cuti kematian keluarga inti (2 hari), cuti kematian anggota keluarga (1 hari), cuti menjalankan ibadah wajib (durasi sesuai kebutuhan)
- [ ] **LEAVE-03**: Manager or HR Admin can approve or reject a leave request with optional notes; employee is notified of the decision
- [ ] **LEAVE-04**: Employee sees remaining leave balance per leave type in real time
- [ ] **LEAVE-05**: System automatically deducts from leave balance when a leave request is approved
- [ ] **LEAVE-06**: HR Admin can view a leave usage report per employee or department for a given period

### Payroll Management (PAY)

- [ ] **PAY-01**: HR Admin can initiate monthly payroll calculation for all active employees for a given month/year
- [ ] **PAY-02**: Calculation computes gross pay: base salary + all configured allowances + overtime pay − deductions for unpaid absences
- [ ] **PAY-03**: Calculation deducts BPJS Kesehatan: 4% employer, 1% employee (applied to salary up to the maximum basis cap)
- [ ] **PAY-04**: Calculation deducts BPJS Ketenagakerjaan — JHT: 3.7% employer + 2% employee; JP: 2% employer + 1% employee (salary cap applies); JKK: rate based on PT SAN's risk class; JKM: 0.3% employer
- [ ] **PAY-05**: PPh 21 is calculated using the TER (Tarif Efektif Rata-rata) method per PP 58/2023: months January through November use the monthly TER rate lookup table (TER A/B/C based on PTKP category); December applies full annualization true-up
- [ ] **PAY-06**: PPh 21 calculation references each employee's PTKP category (TK/0, K/0, K/1, K/2, K/3) stored in their profile
- [ ] **PAY-07**: Employee can download their monthly payslip as a PDF; payslip displays: earnings breakdown, all BPJS deductions (employer and employee portions), PPh 21, and net take-home pay
- [ ] **PAY-08**: HR Admin can view and download a monthly payroll summary report listing all employees with gross pay, total deductions, and net pay
- [ ] **PAY-09**: HR Admin can calculate THR (Tunjangan Hari Raya) for all employees — amount equals 1 month gross salary for ≥ 12 months service; prorated (masa kerja / 12 × 1 bulan gaji) for < 12 months; holiday is determined by employee's registered religion

### Recruitment Management (REC)

- [ ] **REC-01**: HR Admin can create a job vacancy with title, department, job description, requirements, and open date
- [ ] **REC-02**: HR Admin can change vacancy status (Buka / Tutup)
- [ ] **REC-03**: HR Admin can add a candidate to a vacancy with contact details and resume/CV upload
- [ ] **REC-04**: HR Admin can update a candidate's pipeline status (Melamar → Seleksi Berkas → Interview → Penawaran → Diterima / Ditolak)
- [ ] **REC-05**: HR Admin can schedule an interview for a candidate (tanggal, waktu, catatan, pewawancara)
- [ ] **REC-06**: HR Admin can generate and download an offer letter PDF for a candidate with Diterima status
- [ ] **REC-07**: HR Admin can convert an accepted candidate into a new employee profile (pre-fills from candidate data)

### Dashboard (DASH)

- [ ] **DASH-01**: Each role sees a role-appropriate dashboard — HR Admin: headcount, pending leave approvals, open vacancies, payroll status; Manager: today's team attendance, pending leave requests; Employee: today's attendance status, leave balance summary

---

## v2 Requirements

### Notifications

- **NOTIF-01**: In-app notification when leave request status changes
- **NOTIF-02**: Email notification for leave approval/rejection
- **NOTIF-03**: Email delivery of payslip PDF

### Performance Management

- **PERF-01**: HR Admin can set performance evaluation periods
- **PERF-02**: Manager can submit performance rating for direct reports

### Payroll Enhancements

- **PAY-V2-01**: Bonus payment outside regular monthly payroll cycle
- **PAY-V2-02**: Payroll proration for mid-month hire or resignation
- **PAY-V2-03**: Gross-up method for PPh 21 (employer bears tax)

### Attendance Enhancements

- **ATT-V2-01**: Work schedule configuration (shift patterns, different hours per department)
- **ATT-V2-02**: WFH / remote work mode with optional location relaxation

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Biometric attendance | No hardware at PT SAN; web IP/GPS is sufficient |
| Email delivery of payslips/offer letters | Avoids SMTP infrastructure for thesis scope; download only |
| OAuth / SSO login | PT SAN has no Google Workspace; credentials auth is sufficient |
| Native mobile app | Web-responsive covers mobile access |
| Real-time messaging / chat | Not part of HR core workflow |
| Severance (pesangon) calculation | Legally complex, termination-reason-dependent; disproportionate scope |
| Payroll prorate for mid-month (v1) | Deferred to v2 to keep payroll phase focused |
| Employee self-service profile editing | HR Admin owns data accuracy for thesis scope |
| ICONIX artifacts in-system | Methodology artifacts are thesis documentation only |

---

## Traceability

Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 – AUTH-04 | Phase 1 | Pending |
| USER-01 – USER-03 | Phase 1 | Pending |
| MASTER-01 – MASTER-04 | Phase 1 | Pending |
| AUDIT-01 – AUDIT-02 | Phase 1 | Pending |
| EMP-01 – EMP-10 | Phase 2 | Pending |
| ATT-01 – ATT-08 | Phase 3 | Pending |
| LEAVE-01 – LEAVE-06 | Phase 3 | Pending |
| PAY-01 – PAY-09 | Phase 4 | Pending |
| REC-01 – REC-07 | Phase 5 | Pending |
| DASH-01 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 55 total
- Mapped to phases: 55
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-27*
*Last updated: 2026-02-27 after initial definition*
