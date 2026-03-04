# Phase 2 Plan 5: Employee Creation Page Summary

**One-liner:** Employee creation form with 4-section card layout, react-hook-form + zod validation, department-filtered position selector, and password toggle

## What Was Done

### Task 1: Create employee creation page and form
- **Server page** (`/employees/new`): Auth-guarded for HR_ADMIN and SUPER_ADMIN, fetches departments and positions from master data service, renders page header and form component
- **Client form** (`CreateEmployeeForm`): Multi-section form using Card components:
  - **Informasi Akun**: Email + password with show/hide toggle
  - **Informasi Pribadi**: Full name (required), NIK KTP, birth place/date, gender, marital status, religion, phone, address
  - **Detail Pekerjaan**: Department (required), position filtered by department (required), contract type (required), join date (required)
  - **Pajak & BPJS**: NPWP, PTKP status, BPJS Kesehatan/Ketenagakerjaan numbers
- Calls `createEmployeeAction` on submit, redirects to new employee profile on success
- Inline validation errors via react-hook-form, toast notifications via sonner

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] createEmployeeAction return type**
- **Found during:** Task 1
- **Issue:** `createEmployeeAction` returned `ServiceResult<null>` but form needs employee ID to redirect to `/employees/${id}`
- **Fix:** Changed return type to `ServiceResult<{ id: string }>` and returned `result.data!.id` from service result
- **Files modified:** `src/lib/actions/employee.actions.ts`
- **Commit:** 6ebe8ea

**2. [Rule 2 - Missing Critical] Textarea UI component**
- **Found during:** Task 1
- **Issue:** No `textarea` component existed in `src/components/ui/` for the address field
- **Fix:** Created standard shadcn-style Textarea component
- **Files modified:** `src/components/ui/textarea.tsx`
- **Commit:** 6ebe8ea

**3. [Rule 2 - Missing Critical] Breadcrumb labels for employee routes**
- **Found during:** Task 1
- **Issue:** Breadcrumb component had no labels for "employees" or "new" URL segments
- **Fix:** Added `employees: "Karyawan"` and `new: "Tambah"` to segmentLabels
- **Files modified:** `src/components/layout/breadcrumbs.tsx`
- **Commit:** 6ebe8ea

**4. [Rule 1 - Bug] zodResolver type incompatibility with z.coerce.date()**
- **Found during:** Task 1
- **Issue:** `z.coerce.date().optional().or(z.literal(""))` infers as `unknown` which breaks `zodResolver` generic typing with react-hook-form v5
- **Fix:** Added explicit `Resolver<CreateEmployeeInput>` type assertion to zodResolver call
- **Files modified:** `src/app/(dashboard)/employees/new/_components/create-employee-form.tsx`
- **Commit:** 6ebe8ea

## Decisions Made

| # | Decision | Rationale |
|---|----------|-----------|
| 30 | Position selector filters by selected department | UX: prevents invalid department+position combos; resets position when department changes |
| 31 | Resolver type assertion for zod coerce.date() schemas | z.coerce.date().optional().or(literal) infers unknown; cast needed for react-hook-form v5 compatibility |

## Files Changed

### Created
- `src/app/(dashboard)/employees/new/page.tsx` - Server page with auth guard
- `src/app/(dashboard)/employees/new/_components/create-employee-form.tsx` - Client form component
- `src/components/ui/textarea.tsx` - Reusable textarea UI component

### Modified
- `src/lib/actions/employee.actions.ts` - Return employee ID from createEmployeeAction
- `src/components/layout/breadcrumbs.tsx` - Add employees/new breadcrumb labels

## Verification
- `npx tsc --noEmit` passes with zero errors

## Duration
~5 minutes

## Completed
2026-03-04
