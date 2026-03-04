---
phase: 02-employee-data-management
plan: 02
subsystem: employee-service-layer
tags: [prisma, service, actions, crud, transaction, audit]
dependency-graph:
  requires: ["02-01"]
  provides: ["employee-service", "employee-actions"]
  affects: ["02-03", "02-04", "02-05", "02-06", "02-07", "02-08"]
tech-stack:
  added: []
  patterns: ["ServiceResult return type", "prisma.$transaction for atomic operations", "requireHRAdmin auth helper"]
key-files:
  created:
    - src/lib/services/employee.service.ts
    - src/lib/actions/employee.actions.ts
  modified: []
decisions: []
metrics:
  duration: "~10 minutes"
  completed: "2026-03-04"
---

# Phase 2 Plan 2: Employee Service Layer & Server Actions Summary

**One-liner:** Employee CRUD service with transactional User+Employee creation, department-scoped manager queries, NIK auto-generation, and 5 server actions with HR_ADMIN/SUPER_ADMIN auth gates.

## What Was Built

### employee.service.ts (9 exported functions)

| Function | Purpose |
|----------|---------|
| `getEmployees(params)` | Paginated list with search (namaLengkap/nik), departmentId, positionId, isActive, contractType filters |
| `getEmployeesForManager(userId)` | Looks up manager's department, returns scoped employee list |
| `getEmployeeById(id)` | Full employee with department, position, documents, emergencyContacts |
| `getEmployeeByUserId(userId)` | Find by userId for self-view and manager lookups |
| `createEmployee(data, actorId)` | Atomic `$transaction`: check email, generate NIK, hash password, create User (EMPLOYEE role), create Employee |
| `updatePersonalInfo(id, data, actorId)` | Update name, NIK KTP, birth info, gender, marital status, religion, address, phone |
| `updateEmploymentDetails(id, data, actorId)` | Update department, position, contract type, join date, office location |
| `updateTaxBpjs(id, data, actorId)` | Update NPWP, PTKP status, BPJS numbers |
| `deactivateEmployee(id, data, actorId)` | Atomic `$transaction`: set isActive=false + terminationDate/Reason on Employee, deactivate linked User |
| `canManagerAccessEmployee(userId, empId)` | Compare department IDs between manager and employee |

### employee.actions.ts (5 exported actions)

All actions follow the pattern: `requireHRAdmin()` -> `safeParse(formData)` -> service call -> `revalidatePath("/employees")` -> return `ServiceResult`.

| Action | Schema | Service |
|--------|--------|---------|
| `createEmployeeAction` | createEmployeeSchema | createEmployee |
| `updatePersonalInfoAction` | updatePersonalInfoSchema | updatePersonalInfo |
| `updateEmploymentAction` | updateEmploymentSchema | updateEmploymentDetails |
| `updateTaxBpjsAction` | updateTaxBpjsSchema | updateTaxBpjs |
| `deactivateEmployeeAction` | deactivateEmployeeSchema | deactivateEmployee |

## Key Patterns

- **NIK generation** uses `EMP-{YYYY}-{NNNN}` format, generated inside `$transaction` to prevent race conditions
- **createEmployee** creates User + Employee atomically; audit log is written outside the transaction
- **deactivateEmployee** deactivates both Employee and User atomically
- **Manager scoping** looks up the manager's own Employee record to determine department, returns empty if no Employee record
- **Auth helper** `requireHRAdmin()` allows both HR_ADMIN and SUPER_ADMIN roles
- **All mutations** produce audit log entries with old/new values

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 04a7ee3 | feat(02-02): create employee service with all CRUD operations |
| 2 | 9cf1737 | feat(02-02): create server actions for employee mutations |

## Next Phase Readiness

All downstream plans (02-03 through 02-08) can now import from:
- `@/lib/services/employee.service` for direct Prisma queries
- `@/lib/actions/employee.actions` for server actions with auth + validation

No blockers identified.
