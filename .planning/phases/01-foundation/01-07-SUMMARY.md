---
phase: 01-foundation
plan: 07
subsystem: master-data
tags: [office-location, leave-type, crud, audit-log]

dependency-graph:
  requires: ["01-03", "01-04", "01-06"]
  provides: ["office-location-crud", "leave-type-crud", "complete-master-data-page"]
  affects: ["02-*", "03-*"]

tech-stack:
  added: []
  patterns: ["dynamic-field-array", "nullable-number-inputs"]

key-files:
  created:
    - src/app/(dashboard)/master-data/_components/office-location-tab.tsx
    - src/app/(dashboard)/master-data/_components/office-location-form-dialog.tsx
    - src/app/(dashboard)/master-data/_components/leave-type-tab.tsx
    - src/app/(dashboard)/master-data/_components/leave-type-form-dialog.tsx
  modified:
    - src/lib/services/master-data.service.ts
    - src/lib/actions/master-data.actions.ts
    - src/app/(dashboard)/master-data/_components/master-data-tabs.tsx

decisions: []

metrics:
  duration: "~25 min (including wait for Plan 06)"
  completed: "2026-02-27"
---

# Phase 1 Plan 7: Master Data -- Office Locations & Leave Types Summary

Office location CRUD with IP range and GPS config, leave type CRUD with annual quota and gender restriction, all four master data tabs wired and functional.

## What Was Done

### Task 1: Service Functions and Actions (e502be6)
- Added 10 service functions for office locations (get, getAll, create, update, delete) and leave types (get, getAll, create, update, delete)
- Added 8 server actions with auth guard, Zod validation, date serialization, and revalidatePath
- All mutations audit-logged with old/new value tracking
- Appended to existing files from Plan 06 without disrupting department/position functions

### Task 2: Office Location Tab UI (165672a)
- DataTable with columns: Nama, Alamat, IP Range (count), GPS (lat/long/radius), Tanggal Dibuat, Aksi
- Form dialog with dynamic IP list (add/remove fields) and GPS coordinate section
- IP section: dynamic array of text inputs for CIDR ranges
- GPS section: latitude, longitude, radius (meter) with number inputs
- Create, edit (pre-filled), and soft-delete with confirmation

### Task 3: Leave Type Tab & Tab Wiring (0c20448)
- DataTable with columns: Nama, Kuota Tahunan (X hari), Berbayar (Ya/Tidak badge), Pembatasan Gender, Tanggal Dibuat, Aksi
- Form dialog with name, annual quota (number + "hari" suffix), paid checkbox, gender restriction select (Semua/Pria/Wanita)
- Replaced placeholder divs in master-data-tabs.tsx with actual OfficeLocationTab and LeaveTypeTab components
- All 4 tabs now render real components

## Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| MASTER-03 (Office Location CRUD) | Complete | IP + GPS config, soft delete, audit log |
| MASTER-04 (Leave Type CRUD) | Complete | Quota, paid/unpaid, gender restriction, audit log |
| AUDIT-01 (Audit logging) | Complete | All create/update/delete operations logged |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Zod 4 error API change**
- **Found during:** Task 2
- **Issue:** `result.error.errors` does not exist in Zod 4; the property is `result.error.issues`
- **Fix:** Changed to `result.error.issues[0]?.message`
- **Files modified:** office-location-form-dialog.tsx
- **Commit:** 165672a

## Patterns Established

- **Dynamic field arrays:** useFieldArray from react-hook-form for the IP list in office location form, transforming to/from string[] for the API
- **Nullable number inputs:** Pattern for optional number fields (lat/long/radius) that convert empty string to null and vice versa
- **Parallel plan appending:** Successfully appended to Plan 06's files by waiting for them to be created, then using Edit tool to add content at placeholder comments

## Next Phase Readiness

All master data entities (departments, positions, office locations, leave types) now have full CRUD. Ready for:
- Phase 2: Employee data management (will reference office locations and leave types)
- Phase 3: Attendance (will use office location GPS/IP for check-in validation) and leave management (will use leave type quotas)
