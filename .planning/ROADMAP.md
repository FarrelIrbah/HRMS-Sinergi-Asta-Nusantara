# Roadmap: HRMS PT. Sinergi Asta Nusantara

**Created:** 2026-02-27
**Total phases:** 5
**Total v1 requirements:** 54

---

## Phases

### Phase 1: Foundation (Auth, User Management, Master Data, Audit, Dashboard)

**Goal:** Super Admin can log in, manage users and master data, and all roles see a role-appropriate dashboard skeleton -- establishing the infrastructure every subsequent module depends on.

**Dependencies:** None (first phase)

**Plans:** 9 plans

Plans:
- [x] 01-01-PLAN.md -- Project scaffold, Prisma schema, dependencies, base config
- [x] 01-02-PLAN.md -- NextAuth v5 config, login page, middleware, session provider
- [x] 01-03-PLAN.md -- Dashboard layout shell (sidebar, header, breadcrumbs, shared components)
- [x] 01-04-PLAN.md -- Audit logging infrastructure (createAuditLog helper, audit query service)
- [x] 01-05-PLAN.md -- User management CRUD (create, edit, deactivate/reactivate, role change)
- [x] 01-06-PLAN.md -- Master data: departments and positions (tabbed page, CRUD, soft delete)
- [x] 01-07-PLAN.md -- Master data: office locations and leave types (IP/GPS config, quotas)
- [x] 01-08-PLAN.md -- Audit log viewer (filterable table, before/after detail view)
- [x] 01-09-PLAN.md -- Role-specific dashboards, seed data, end-to-end verification

**Requirements:**
- AUTH-01, AUTH-02, AUTH-03, AUTH-04
- USER-01, USER-02, USER-03
- MASTER-01, MASTER-02, MASTER-03, MASTER-04
- AUDIT-01, AUDIT-02
- DASH-01

**Success Criteria:**
1. HR Admin can log in with email and password and is redirected to the HR dashboard showing summary widgets (headcount placeholder, pending leave placeholder, open vacancies placeholder, payroll status placeholder)
2. Super Admin can create a new user account with a role, deactivate it, reactivate it, and change its role -- and the affected user's access changes immediately on next login
3. Super Admin can create departments, positions linked to departments, office locations with IP/GPS config, and leave types with quotas -- and these values appear as dropdown options throughout the system
4. Every create, update, and delete action across the system is recorded in the audit log, and Super Admin can filter the log by user, date range, and module to find specific entries
5. Manager logs in and sees a Manager-specific dashboard; Employee logs in and sees an Employee-specific dashboard -- each role sees only the widgets relevant to them

---

### Phase 2: Employee Data Management

**Goal:** HR Admin can manage complete employee profiles with all Indonesian HR fields, documents, and emergency contacts, and each role sees only the employee data their access level permits.

**Dependencies:** Phase 1 (departments, positions, office locations, and user accounts must exist)

**Plans:** 8 plans

Plans:
- [ ] 02-01-PLAN.md -- Prisma schema (Employee, EmployeeDocument, EmergencyContact models), Zod validations, constants
- [ ] 02-02-PLAN.md -- Employee service layer (CRUD, NIK generation, atomic User+Employee creation, audit logging)
- [ ] 02-03-PLAN.md -- Document management API routes (upload/download/delete with local filesystem storage)
- [ ] 02-04-PLAN.md -- Employee list page with role-based scoping, sidebar navigation, DataTable with filters
- [ ] 02-05-PLAN.md -- Employee creation form (single-page form with all required and optional fields)
- [ ] 02-06-PLAN.md -- Employee detail/edit page with tabbed layout (Personal Info, Employment, Tax/BPJS)
- [ ] 02-07-PLAN.md -- Documents tab and Emergency Contacts tab (complete the 5-tab profile)
- [ ] 02-08-PLAN.md -- Employee deactivation, seed data, dashboard integration, end-to-end verification

**Requirements:**
- EMP-01, EMP-02, EMP-03, EMP-04, EMP-05, EMP-06, EMP-07, EMP-08, EMP-09, EMP-10

**Success Criteria:**
1. HR Admin can create a full employee profile (personal info with NIK, employment details with department/position/contract type, PTKP category, BPJS numbers) and later edit any field on that profile
2. HR Admin can upload documents (KTP, NPWP, contract, foto) to an employee's profile, then view and download those documents at any time
3. HR Admin can add emergency contacts to an employee, deactivate an employee with a termination date and reason, and the terminated employee no longer appears in active employee lists
4. Manager can browse and view employee profiles but only sees employees in their own department -- attempting to view employees outside their department is denied
5. Employee can view their own profile in read-only mode -- they see all their personal info, employment details, documents, and emergency contacts but cannot edit anything

---

### Phase 3: Attendance and Leave Management

**Goal:** Employees can clock in/out with location verification and submit leave requests through an approval workflow, giving HR Admin accurate attendance and leave data that feeds into payroll.

**Dependencies:** Phase 2 (employee profiles with office location assignments must exist)

**Requirements:**
- ATT-01, ATT-02, ATT-03, ATT-04, ATT-05, ATT-06, ATT-07, ATT-08
- LEAVE-01, LEAVE-02, LEAVE-03, LEAVE-04, LEAVE-05, LEAVE-06

**Success Criteria:**
1. Employee can clock in and clock out from the web -- the system accepts the action only when the request comes from an allowed IP range or GPS coordinates within the configured radius for the employee's assigned office, and rejects it otherwise with a clear error message
2. System automatically flags late arrivals and early departures based on the employee's scheduled work hours, calculates overtime when clock-out exceeds the scheduled end time, and these flags appear in the attendance record
3. Employee can submit a leave request for any of the Indonesian statutory leave types (cuti tahunan, cuti sakit, cuti melahirkan, etc.), see their remaining balance per leave type in real time, and the balance decreases automatically when a request is approved
4. Manager or HR Admin can approve or reject a leave request with optional notes, and the employee sees the updated status and any notes on their request
5. HR Admin can view a monthly attendance recap per employee showing clock-in/out times, late/early flags, total hours, and overtime -- and can export this report as PDF or Excel; Manager can view attendance records for their department

---

### Phase 4: Payroll Management

**Goal:** HR Admin can run monthly payroll with accurate BPJS deductions and PPh 21 tax calculation (TER method January-November, full annualization true-up in December), and employees can download their payslips as PDF.

**Dependencies:** Phase 2 (employee salary, PTKP category, BPJS numbers) and Phase 3 (overtime hours, absence data)

**Requirements:**
- PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, PAY-06, PAY-07, PAY-08, PAY-09

**Success Criteria:**
1. HR Admin can initiate a monthly payroll run for all active employees -- the system calculates gross pay (base salary + allowances + overtime - unpaid absence deductions), BPJS Kesehatan (4% employer / 1% employee with salary cap), BPJS Ketenagakerjaan (JHT, JP with salary cap, JKK, JKM), and PPh 21 using the TER method, arriving at a correct net take-home pay
2. PPh 21 calculation correctly uses the employee's PTKP category to select the TER rate for January-November, and performs the full annualization true-up in December (recalculating annual tax, subtracting year-to-date withholdings, producing a final December adjustment that may be positive or negative)
3. Employee can download a monthly payslip PDF that clearly shows: earnings breakdown, all BPJS deductions (both employer and employee portions), PPh 21 withholding, and net take-home pay
4. HR Admin can view and download a monthly payroll summary report listing all employees with their gross pay, total deductions, and net pay
5. HR Admin can calculate THR (Tunjangan Hari Raya) for all eligible employees -- full month salary for those with 12+ months service, prorated for those with less, based on the employee's registered religion for holiday determination

---

### Phase 5: Recruitment Management

**Goal:** HR Admin can manage the full recruitment pipeline from job posting through hiring, including generating offer letters and converting accepted candidates into employee profiles.

**Dependencies:** Phase 2 (employee profile creation used when converting a hired candidate)

**Requirements:**
- REC-01, REC-02, REC-03, REC-04, REC-05, REC-06, REC-07

**Success Criteria:**
1. HR Admin can create a job vacancy with title, department, description, requirements, and open date -- and can change its status between open and closed
2. HR Admin can add candidates to a vacancy with contact details and uploaded CV, and move each candidate through the pipeline stages (Melamar, Seleksi Berkas, Interview, Penawaran, Diterima/Ditolak)
3. HR Admin can schedule an interview for a candidate with date, time, notes, and interviewer assignment
4. HR Admin can generate and download an offer letter as PDF for a candidate with "Diterima" status
5. HR Admin can convert an accepted candidate into a new employee profile, with candidate data pre-filling the employee creation form to eliminate double data entry

---

## Coverage

| Category | Requirements | Phase | Count |
|----------|-------------|-------|-------|
| Authentication | AUTH-01 to AUTH-04 | Phase 1 | 4 |
| User Management | USER-01 to USER-03 | Phase 1 | 3 |
| Master Data | MASTER-01 to MASTER-04 | Phase 1 | 4 |
| Audit Log | AUDIT-01 to AUDIT-02 | Phase 1 | 2 |
| Dashboard | DASH-01 | Phase 1 | 1 |
| Employee Data | EMP-01 to EMP-10 | Phase 2 | 10 |
| Attendance | ATT-01 to ATT-08 | Phase 3 | 8 |
| Leave | LEAVE-01 to LEAVE-06 | Phase 3 | 6 |
| Payroll | PAY-01 to PAY-09 | Phase 4 | 9 |
| Recruitment | REC-01 to REC-07 | Phase 5 | 7 |
| **Total** | | | **54** |

**Mapped:** 54/54
**Orphaned:** 0

---

## Progress

| Phase | Name | Status | Requirements |
|-------|------|--------|--------------|
| 1 | Foundation | Complete (9 plans) | 14 |
| 2 | Employee Data Management | Planned (8 plans) | 10 |
| 3 | Attendance and Leave Management | Not Started | 14 |
| 4 | Payroll Management | Not Started | 9 |
| 5 | Recruitment Management | Not Started | 7 |

---
*Roadmap created: 2026-02-27*
