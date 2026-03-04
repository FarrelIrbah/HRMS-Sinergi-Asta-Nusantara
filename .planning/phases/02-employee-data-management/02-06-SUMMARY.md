---
phase: 02-employee-data-management
plan: 06
subsystem: employee-detail
tags: [employee-profile, tabs, react-hook-form, role-based-access]
dependency-graph:
  requires: ["02-04", "02-05"]
  provides: ["employee-detail-page", "employee-edit-tabs", "role-based-view-edit"]
  affects: ["02-07", "02-08"]
tech-stack:
  added: []
  patterns: ["tabbed-profile-page", "role-based-mode-switching", "serialized-date-props"]
key-files:
  created:
    - src/app/(dashboard)/employees/[id]/page.tsx
    - src/app/(dashboard)/employees/[id]/_components/employee-profile-tabs.tsx
    - src/app/(dashboard)/employees/[id]/_components/personal-info-tab.tsx
    - src/app/(dashboard)/employees/[id]/_components/employment-details-tab.tsx
    - src/app/(dashboard)/employees/[id]/_components/tax-bpjs-tab.tsx
  modified: []
decisions:
  - id: 32
    title: "Resolver double-cast for zod coerce.date() schemas"
    detail: "zodResolver cast as unknown then as Resolver<T> to bypass react-hook-form dual-type resolution issue with z.coerce.date().optional().or(literal)"
metrics:
  duration: ~10min
  completed: 2026-03-05
---

# Phase 2 Plan 6: Employee Detail/Edit Page Summary

Employee detail page with tabbed layout, role-based view/edit modes, and independent per-tab save actions using react-hook-form + zod validation.

## What Was Built

### Task 1: Employee Detail Page with Role-Based Access
- **Server component** at `/employees/[id]` with auth check and role-based mode determination
- **EMPLOYEE** role: can only view own profile (readonly)
- **MANAGER** role: can view employees in own department (readonly)
- **HR_ADMIN / SUPER_ADMIN**: full edit mode
- Page header with employee name, NIK, active/inactive badge, back link
- Date serialization for client component props (Decision #18 pattern)
- **EmployeeProfileTabs** client component with nuqs URL-persisted tab state
- 5 tabs: Data Pribadi, Detail Pekerjaan, Pajak & BPJS, Dokumen (placeholder), Kontak Darurat (placeholder)

### Task 2: Tab Form Components
- **PersonalInfoTab**: namaLengkap, nikKtp, tempatLahir, tanggalLahir, jenisKelamin, statusPernikahan, agama, alamat, nomorHp + email display-only
- **EmploymentDetailsTab**: departmentId/positionId (filtered), contractType, joinDate + NIK/status display-only
- **TaxBpjsTab**: npwp, ptkpStatus, bpjsKesehatanNo, bpjsKetenagakerjaanNo
- All tabs follow shared pattern: react-hook-form + zodResolver, disabled inputs in readOnly mode, hidden save button in readOnly mode
- Each tab saves independently via its own server action (updatePersonalInfoAction, updateEmploymentAction, updateTaxBpjsAction)
- Success: toast + router.refresh(), Error: toast.error

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed non-existent uploadedAt field from document serialization**
- **Found during:** Task 1
- **Issue:** Plan assumed EmployeeDocument model had `uploadedAt` field, but schema only has `createdAt`/`updatedAt`
- **Fix:** Removed uploadedAt from serialization, using createdAt/updatedAt only
- **Commit:** 9033c7d

**2. [Note] Plan 02-07 already executed tab implementations**
- **Found during:** Task 2
- **Issue:** Plan 02-07 commits (154fbb6, cb70996) had already replaced stub tab components with full implementations, including documents and emergency contacts tabs
- **Impact:** Task 2 changes were already in the codebase; no additional commit needed

## Decisions Made

| # | Decision | Rationale |
|---|----------|-----------|
| 32 | Resolver double-cast (as unknown as Resolver<T>) for coerce.date() schemas | react-hook-form v5 dual-type resolution conflict with zod coerce.date().optional().or(literal) -- same pattern as Decision #31 |

## Verification

- `npx tsc --noEmit` passes with zero errors
- All tab components properly typed with SerializedEmployee interface
- Role-based access control verified at page level (server component)

## Next Phase Readiness

Plan 02-06 is complete. The employee detail page serves as the foundation for:
- Plan 02-07 (documents/emergency contacts) -- already executed
- Plan 02-08 (remaining employee management features)
