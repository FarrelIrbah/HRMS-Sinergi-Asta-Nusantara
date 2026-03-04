# Phase 2: Employee Data Management - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

HR Admin manages complete employee profiles with all Indonesian HR fields, documents, and emergency contacts. Each role sees only the employee data their access level permits: Manager sees department-only employee lists, Employee sees their own profile in read-only mode.

Creating an employee profile automatically creates their login account (Employee role). Audit logging applies to all create/update/deactivate actions.

</domain>

<decisions>
## Implementation Decisions

### Profile form structure
- Tabbed layout with 5 tabs: **Personal Info**, **Employment Details**, **Tax & BPJS**, **Documents**, **Emergency Contacts**
- Single scrollable form is too long for a full Indonesian HR profile; wizard is overkill; tabs allow HR to jump to any section directly

### Required fields on creation
- Minimum required to save: nama lengkap, email, department, position, join date, employment status (PKWT/PKWTT)
- Tax & BPJS fields (NIK/KTP, NPWP, BPJS Kesehatan, BPJS Ketenagakerjaan, PTKP category) are optional on creation — HR may not have them during onboarding
- No draft state — required fields are minimal enough that a profile can always be completed

### Auto-create login account on employee creation
- When HR Admin creates an employee profile, the system automatically creates a User account with Employee role using the employee's email
- HR sets the initial password at creation time (or system generates one — Claude's discretion on mechanism)
- Eliminates the extra step of separately creating a user in /users and then linking

### Employee list
- Columns: Nama, NIK (Nomor Induk Karyawan / internal employee ID), Department, Position, Employment Status (Active/Inactive), Contract Type (PKWT/PKWTT), Join Date, Actions (view/edit)
- Filters: Department, Position, Employment Status, Contract Type
- Search bar: by name or NIK
- Uses the existing DataTable component

### Document management
- Documents live in a dedicated **Documents tab** on the employee profile — not inline in other sections
- Accepted types: PDF, JPG, PNG only (scan documents: KTP, NPWP, BPJS card, contracts — no Word/Excel needed)
- Max file size: 5MB per file
- Document tab has its own upload/view/download/delete UI

### Role-gated access
- Manager's employee list is **pre-filtered to their own department** — no 403 page, just department-scoped data
- Manager sees profiles of employees in their department; attempting to access outside their department returns not found / access denied silently
- Employee views their own profile in **read-only mode** — including salary components, PTKP category, and BPJS numbers (their right to verify these are correct)
- Employee cannot edit any field on their own profile

### Claude's Discretion
- NIK/employee ID format and generation (e.g., EMP-0001 sequential, or year-based)
- Initial password generation mechanism (random string, or HR-typed at creation)
- Emergency contact fields and maximum count per employee
- Termination/deactivation modal design (confirmation, termination date, reason field)
- Exact error messaging for out-of-department access attempts

</decisions>

<specifics>
## Specific Ideas

- "Tabs let HR jump to any section" — navigation between tabs should preserve unsaved changes or warn before leaving (Claude's discretion on approach)
- Hiding out-of-department employees entirely (pre-filtered list) is preferred over showing them with an access denied error — cleaner UX, less confusion
- Employee seeing their own salary/BPJS is intentional — reduces HR inquiry burden when employees want to verify their data

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-employee-data-management*
*Context gathered: 2026-03-04*
