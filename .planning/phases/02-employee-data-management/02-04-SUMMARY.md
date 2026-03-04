---
phase: 02-employee-data-management
plan: 04
subsystem: employee-list
tags: [datatable, filters, sidebar, role-scoping, nuqs]
depends_on:
  requires: ["02-02"]
  provides: ["employee-list-page", "sidebar-karyawan-nav", "employee-filters"]
  affects: ["02-05", "02-06"]
tech-stack:
  added: []
  patterns: ["role-based-data-scoping", "server-component-data-loading", "nuqs-url-filters", "date-serialization-for-client"]
key-files:
  created:
    - src/app/(dashboard)/employees/page.tsx
    - src/app/(dashboard)/employees/_components/employee-columns.tsx
    - src/app/(dashboard)/employees/_components/employee-table.tsx
    - src/app/(dashboard)/employees/_components/employee-filters.tsx
  modified:
    - src/components/layout/sidebar.tsx
    - src/lib/services/employee.service.ts
metrics:
  duration: ~8min
  completed: 2026-03-04
---

# Phase 02 Plan 04: Employee List Page Summary

**One-liner:** Role-scoped employee list page with DataTable, URL-based filters (department, position, status, contract type), and sidebar navigation for all roles.

## What Was Built

1. **Employee list page** (`/employees`) as server component with role-based routing:
   - EMPLOYEE role redirects to own profile page
   - MANAGER sees only their department's employees (pre-filtered)
   - HR_ADMIN/SUPER_ADMIN see all employees with full filters
   - "Tambah Karyawan" button visible only to HR_ADMIN/SUPER_ADMIN

2. **DataTable columns** with proper formatting:
   - Nama Lengkap (with email subtext), NIK, Departemen, Jabatan
   - Status badge (green Aktif / red Nonaktif)
   - Contract type badge (blue PKWT / purple PKWTT)
   - Join date formatted with Indonesian locale
   - Action dropdown: Lihat Detail, Edit (HR_ADMIN/SUPER_ADMIN only)

3. **Filter controls** using nuqs URL state:
   - Search input (name/NIK), department select, position select (filtered by department)
   - Employment status select (Semua/Aktif/Nonaktif), contract type select (Semua/PKWT/PKWTT)
   - _all sentinel pattern for empty Select values (Decision #21)
   - Manager view hides department filter (already scoped)

4. **Sidebar navigation** updated with "Karyawan" link visible to all roles

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | ea91324 | feat(02-04): employee list page with role-based routing and sidebar nav |
| 2 | b80a748 | feat(02-04): employee DataTable columns, table wrapper, and filters |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed getEmployeesForManager missing filter params**
- **Found during:** Task 1
- **Issue:** `getEmployeesForManager` only accepted `userId` and did not forward search/filter parameters, making manager search/filter non-functional
- **Fix:** Added `params: Omit<GetEmployeesParams, "departmentId">` parameter and spread it into `getEmployees` call
- **Files modified:** src/lib/services/employee.service.ts
- **Commit:** ea91324

## Decisions Made

None new -- followed existing patterns (Decision #18 date serialization, Decision #21 _all sentinel, Decision #23 client-safe enums).

## Next Phase Readiness

- Employee list page ready for 02-05 (create employee form, /employees/new)
- Column "Lihat Detail" links to /employees/{id} which will be built in 02-06
- Filter infrastructure ready for position filtering by department
