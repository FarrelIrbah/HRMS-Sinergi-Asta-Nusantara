---
phase: 02-employee-data-management
verified: 2026-03-05T08:00:00Z
status: human_needed
score: 5/5 must-haves verified
gaps: []
human_verification:
  - test: Create a full employee profile as HR Admin
    expected: Form accepts NIK KTP, birth info, dept/position/contract type, PTKP, BPJS; redirects to new profile with NIK in EMP-YYYY-NNNN format
    why_human: Database transaction required to verify NIK auto-generation and User+Employee atomic creation
  - test: Upload a document and then download it
    expected: Upload succeeds; document appears in Dokumen tab; download button streams file and triggers browser save
    why_human: Filesystem write and HTTP file streaming require running server with Docker/PostgreSQL
  - test: Deactivate an employee and check active employee list
    expected: Employee badge changes to Nonaktif; filtering to Aktif hides deactivated employee
    why_human: Atomic Employee+User deactivation transaction requires running server
  - test: Log in as Manager and attempt to view employee from another department
    expected: Manager sees only own dept employees; cross-dept navigation redirects to /employees
    why_human: canManagerAccessEmployee() DB lookup and session role check require live session
  - test: Log in as Employee and verify read-only profile access
    expected: /employees redirects to own profile; all inputs disabled; Save buttons hidden; cross-navigation to /dashboard
    why_human: Employee routing guard and disabled form state require running browser session
---

# Phase 2: Employee Data Management -- Verification Report

**Phase Goal:** HR Admin can manage complete employee profiles with all Indonesian HR fields, documents, and emergency contacts, and each role sees only the employee data their access level permits.
**Verified:** 2026-03-05T08:00:00Z
**Status:** human_needed -- all automated structural checks passed; 5 items require human testing with a live server
**Re-verification:** Yes -- supersedes previous 2026-03-05 report (that report had only frontmatter, no body)

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | HR Admin can create a full employee profile with all Indonesian HR fields | VERIFIED | create-employee-form.tsx (614 lines): 4-section form with NIK KTP, birth info, gender/marital/religion enums, dept/position/contract type, joinDate, NPWP/PTKP/BPJS. createEmployeeAction uses Prisma transaction for atomic User+Employee creation with generateEmployeeNIK() |
| 2 | HR Admin can upload documents and view/download them | VERIFIED | documents-tab.tsx (306 lines): upload via POST /api/employees/[id]/documents with FormData; download via GET streaming Uint8Array(fileBuffer); delete via DELETE. Both API routes fully implemented with auth, validation, filesystem ops |
| 3 | HR Admin can add emergency contacts, deactivate employee, terminated employee excluded from active list | VERIFIED | emergency-contacts-tab.tsx (340 lines): inline add/edit/delete calling 3 server actions. deactivate-employee-dialog.tsx (162 lines): calls deactivateEmployeeAction -- atomic transaction setting isActive=false on Employee and User. Employee list reads isActive URL param for WHERE clause |
| 4 | Manager sees only dept-scoped employees; cross-dept access denied | VERIFIED | employees/page.tsx MANAGER branch calls getEmployeesForManager scoping by departmentId. employees/[id]/page.tsx MANAGER branch calls canManagerAccessEmployee and redirects to /employees if false |
| 5 | Employee sees own profile read-only; cannot edit; cross-navigation denied | VERIFIED | employees/page.tsx EMPLOYEE branch redirects to own profile. employees/[id]/page.tsx EMPLOYEE branch checks ownEmployee.id \!== id -- redirect to /dashboard; sets mode=readonly. All 5 tabs have inputs disabled and Save buttons hidden in readOnly |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| prisma/schema.prisma | Employee, EmployeeDocument, EmergencyContact models + 6 enums | VERIFIED | Lines 163-230: 3 models with 25+ fields; cascading deletes; 6 enums (Gender, Religion, MaritalStatus, ContractType, PTKPStatus, DocumentType) |
| src/lib/validations/employee.ts | 6 Zod schemas for all employee forms | VERIFIED | 122 lines: createEmployeeSchema, updatePersonalInfoSchema, updateEmploymentSchema, updateTaxBpjsSchema, emergencyContactSchema, deactivateEmployeeSchema with Indonesian error messages |
| src/lib/services/employee.service.ts | CRUD service with NIK generation, dept scoping, access control | VERIFIED | 502 lines: 10 exported functions including generateEmployeeNIK, getEmployees, getEmployeesForManager, canManagerAccessEmployee, deactivateEmployee (atomic transaction) |
| src/lib/actions/employee.actions.ts | Server actions with HR_ADMIN auth gate | VERIFIED | 174 lines: 5 actions -- requireHRAdmin then safeParse then service call then revalidatePath |
| src/lib/services/employee-document.service.ts | Document CRUD with filesystem + DB | VERIFIED | 94 lines: getDocumentsByEmployeeId, getDocumentById, createDocumentRecord, deleteDocument (file + DB + audit log) |
| src/lib/actions/employee-document.actions.ts | Emergency contact server actions | VERIFIED | 156 lines: create/update/deleteEmergencyContactAction -- max-3 enforcement, auth gate, audit logging |
| src/app/(dashboard)/employees/page.tsx | Role-scoped employee list with filters | VERIFIED | 146 lines: EMPLOYEE redirects to own profile; MANAGER uses getEmployeesForManager; HR_ADMIN uses getEmployees with all filters |
| src/app/(dashboard)/employees/new/page.tsx | HR-Admin-guarded creation page | VERIFIED | 34 lines: auth + role check; fetches depts/positions; renders CreateEmployeeForm |
| src/app/(dashboard)/employees/new/_components/create-employee-form.tsx | Full multi-section creation form | VERIFIED | 614 lines: 4 card sections (Akun, Pribadi, Pekerjaan, Pajak and BPJS); all Indonesian HR fields; createEmployeeAction on submit |
| src/app/(dashboard)/employees/[id]/page.tsx | Role-gated profile detail page | VERIFIED | 149 lines: EMPLOYEE owns-check; MANAGER dept-check; HR_ADMIN edit mode; DeactivateEmployeeDialog for active employees |
| src/app/(dashboard)/employees/[id]/_components/employee-profile-tabs.tsx | 5-tab profile with all sub-components | VERIFIED | 134 lines: nuqs tab state; 5 tabs all wired with readOnly prop |
| src/app/(dashboard)/employees/[id]/_components/personal-info-tab.tsx | Personal info form read/edit | VERIFIED | 343 lines: all personal fields with readOnly handling; calls updatePersonalInfoAction |
| src/app/(dashboard)/employees/[id]/_components/employment-details-tab.tsx | Employment details form read/edit | VERIFIED | 283 lines: dept/position/contractType/joinDate with readOnly handling; calls updateEmploymentAction |
| src/app/(dashboard)/employees/[id]/_components/tax-bpjs-tab.tsx | Tax and BPJS form read/edit | VERIFIED | 191 lines: NPWP/PTKP/BPJS fields with readOnly handling; calls updateTaxBpjsAction |
| src/app/(dashboard)/employees/[id]/_components/documents-tab.tsx | Document upload/download/delete UI | VERIFIED | 306 lines: upload section hidden in readOnly; download via fetch-blob-anchor; delete with ConfirmDialog |
| src/app/(dashboard)/employees/[id]/_components/emergency-contacts-tab.tsx | Emergency contacts CRUD UI | VERIFIED | 340 lines: contact cards; inline add/edit form; delete with ConfirmDialog; action buttons hidden in readOnly |
| src/app/(dashboard)/employees/[id]/_components/deactivate-employee-dialog.tsx | Deactivation dialog for HR Admin | VERIFIED | 162 lines: destructive dialog; date picker + textarea form; calls deactivateEmployeeAction |
| src/app/api/employees/[id]/documents/route.ts | Document upload API (POST) | VERIFIED | 134 lines: HR_ADMIN/SUPER_ADMIN only; mime-type + size validation; filesystem write; DB record |
| src/app/api/employees/[id]/documents/[docId]/route.ts | Document download (GET) and delete (DELETE) | VERIFIED | 170 lines: role-based access; file streaming with Uint8Array; DELETE removes DB + filesystem |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| create-employee-form.tsx | createEmployeeAction | onSubmit | WIRED | await createEmployeeAction(data); on success router.push to new employee profile |
| createEmployeeAction | createEmployee service | import + call | WIRED | requireHRAdmin then safeParse then createEmployee(parsed.data, actorId) returns { id } |
| createEmployee service | PostgreSQL via Prisma | atomic transaction | WIRED | tx.user.create + tx.employee.create with NIK generated inside transaction |
| personal-info-tab.tsx | updatePersonalInfoAction | form submit | WIRED | await updatePersonalInfoAction(employee.id, data) |
| employment-details-tab.tsx | updateEmploymentAction | form submit | WIRED | await updateEmploymentAction(employee.id, data) |
| tax-bpjs-tab.tsx | updateTaxBpjsAction | form submit | WIRED | await updateTaxBpjsAction(employee.id, data) |
| documents-tab.tsx | POST /api/employees/[id]/documents | fetch FormData | WIRED | fetch POST with file + documentType fields; response handled with toast + router.refresh() |
| documents-tab.tsx | GET /api/employees/[id]/documents/[docId] | fetch to blob | WIRED | fetch GET then response.blob() then URL.createObjectURL then auto-click anchor |
| documents-tab.tsx | DELETE /api/employees/[id]/documents/[docId] | fetch DELETE | WIRED | fetch with method DELETE; handled with toast + router.refresh() |
| emergency-contacts-tab.tsx | create/update/deleteEmergencyContactAction | form submit/button | WIRED | Direct server action calls with employeeId; all with toast + router.refresh() |
| deactivate-employee-dialog.tsx | deactivateEmployeeAction | form submit | WIRED | await deactivateEmployeeAction(employeeId, values); success toast + router.refresh() |
| deactivateEmployee service | Employee + User tables | Prisma transaction | WIRED | tx.employee.update(isActive=false, terminationDate, terminationReason) + tx.user.update(isActive=false) |
| employees/page.tsx | getEmployeesForManager for MANAGER | role check branch | WIRED | role === MANAGER branches to getEmployeesForManager; otherwise getEmployees with all URL params |
| employees/[id]/page.tsx | canManagerAccessEmployee for MANAGER | role check guard | WIRED | canManagerAccessEmployee(session.user.id, id); redirect to /employees if false |
| employees/[id]/page.tsx | own-profile check for EMPLOYEE | role check guard | WIRED | getEmployeeByUserId then ownEmployee.id \!== id check; redirect to /dashboard |
| isActive URL param | getEmployees WHERE isActive | URL param to boolean | WIRED | params.isActive parsed to boolean; service applies WHERE isActive condition |

---

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| EMP-01: Create employee profile with Indonesian HR fields | SATISFIED | None |
| EMP-02: Edit personal information | SATISFIED | None |
| EMP-03: Edit employment details | SATISFIED | None |
| EMP-04: Edit tax and BPJS information | SATISFIED | None |
| EMP-05: Upload/download/delete documents | SATISFIED | None |
| EMP-06: Manage emergency contacts (CRUD, max 3) | SATISFIED | None |
| EMP-07: Deactivate employee with termination date/reason | SATISFIED | None |
| EMP-08: Active/inactive filter on employee list | SATISFIED | None |
| EMP-09: Manager sees only own-department employees | SATISFIED | None |
| EMP-10: Employee read-only own-profile access | SATISFIED | None |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| All form components | Various | placeholder= on Input/SelectValue | INFO | HTML input placeholders for UX guidance, not stub code |
| (none) | - | No TODO/FIXME/placeholder comments | - | Clean codebase |
| (none) | - | No empty return null / return {} | - | All components render substantive JSX |
| (none) | - | No console.log-only handlers | - | All onSubmit handlers make real API calls |

No blockers or warnings found.

---

### Human Verification Required

All 5 items require a running server with Docker/PostgreSQL active and seed data applied (npx prisma db seed).

#### 1. Create Full Employee Profile

**Test:** Log in as HR Admin. Navigate to /employees/new. Fill all 4 sections: email, password, full name, NIK KTP, birth place/date, gender, marital status, religion, phone, address, department, position, contract type, join date, NPWP, PTKP status, BPJS Kesehatan, BPJS Ketenagakerjaan. Submit.
**Expected:** Redirected to /employees/{id} with a system-generated NIK in EMP-2026-NNNN format. All entered data visible on the profile tabs.
**Why human:** Atomic User+Employee Prisma transaction and NIK sequential generation require a live PostgreSQL connection.

#### 2. Upload Document and Download

**Test:** On an employee profile as HR Admin. Open Dokumen tab. Select document type (e.g. KTP). Select a PDF file. Click Unggah Dokumen. After success, verify document appears in table. Click the download button.
**Expected:** Upload succeeds with success toast. Document appears in table with correct type label, file name, size, upload date. Download triggers browser file save with the original filename.
**Why human:** writeFile to disk and HTTP file streaming with Uint8Array response body require a running Next.js server.

#### 3. Deactivate Employee and Verify Filter

**Test:** On an active employee profile as HR Admin. Click Nonaktifkan Karyawan. Enter termination date and reason. Confirm. Navigate to /employees and filter status to Aktif.
**Expected:** Employee badge changes to Nonaktif with inactive banner showing termination date and reason. The deactivated employee disappears from the list when filtering to Aktif. Employee user account can no longer log in.
**Why human:** Atomic Employee+User deactivation transaction and UI state after router.refresh() require a live server.

#### 4. Manager Department Scope Enforcement

**Test:** Log in as a Manager account. Navigate to /employees. Note which employees are visible. Copy the URL of an employee from a different department and paste it in the browser address bar.
**Expected:** Employee list shows only employees from the manager own department. The department filter control is not shown. Navigating to cross-department employee URL redirects to /employees.
**Why human:** canManagerAccessEmployee() does a DB lookup comparing departmentIds and requires a live session with PostgreSQL.

#### 5. Employee Read-Only Profile Access

**Test:** Log in as an Employee account. Navigate to /employees. Then try navigating to /employees/{another-employee-id}.
**Expected:** Navigating to /employees automatically redirects to /employees/{own-id}. All form inputs on all tabs are grayed out and cannot be edited. No Simpan (Save) buttons are visible. Navigating to /employees/{another-id} redirects to /dashboard.
**Why human:** Session-based getEmployeeByUserId routing and disabled form rendering require a running browser session.

---

### Gaps Summary

No gaps found. All 5 phase goal truths are structurally verified:

- **Truth 1 (HR Admin create profile):** create-employee-form.tsx is a 614-line production form covering every Indonesian HR field. The createEmployee service uses a Prisma transaction for atomic User+Employee creation with NIK auto-generation inside the transaction.
- **Truth 2 (Document upload/download):** Full round-trip verified: upload API validates mime type and size, writes to disk, creates DB record; download API enforces role-based access, reads file, streams as Uint8Array; documents-tab.tsx uses the fetch-blob-anchor pattern.
- **Truth 3 (Emergency contacts + deactivation + active filter):** All three concerns fully implemented. The deactivation service atomically sets both Employee.isActive and User.isActive to false. The isActive filter is wired from URL param through server component to Prisma WHERE clause.
- **Truth 4 (Manager dept scope):** Two enforcement points: list page scopes query via getEmployeesForManager; detail page calls canManagerAccessEmployee and redirects on failure. Filter UI hides dept selector for managers.
- **Truth 5 (Employee read-only):** Two redirect guards in place. All 5 tab components verified to disable inputs and hide Save buttons when readOnly prop is true.

---

_Verified: 2026-03-05T08:00:00Z_
_Verifier: Claude (gsd-verifier)_

