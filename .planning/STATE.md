# Project State

## Project Reference
See: .planning/PROJECT.md (updated 2026-02-27)

**Core value:** HR staff can manage the complete employee lifecycle in one integrated system with accurate Indonesian tax and social insurance compliance.
**Current focus:** Phase 4

## Phase Status

| Phase | Name | Status | Requirements |
|-------|------|--------|--------------|
| 1 | Foundation | Complete | 14 |
| 2 | Employee Data Management | ● Complete (8/8 plans) | 10 |
| 3 | Attendance and Leave Management | ● Complete (9/9 plans) | 14 |
| 4 | Payroll Management | ○ Pending | 9 |
| 5 | Recruitment Management | ○ Pending | 7 |

## Current Work

Phase: 4 of 5 (Payroll Management) — In progress
Plan: 3 of 8
Status: Plan 04-03 complete. Payroll batch engine, server actions, and Gaji & Tunjangan tab built.
Last activity: 2026-03-07 - Completed 04-03-PLAN.md (payroll.service.ts + payroll.actions.ts + salary-tab.tsx)

Progress: [█████████████████████████░] 3/8 Phase 4 plans complete (Phase 1: 9/9, Phase 2: 8/8, Phase 3: 9/9, Phase 4: 3/8)

## Decisions

| # | Decision | Rationale | Plan |
|---|----------|-----------|------|
| 1 | Prisma 6 client imports from `@/generated/prisma/client` | Prisma 6 generates to src/generated/prisma/ without barrel export | 01-01 |
| 2 | Seed config in package.json#prisma (deprecated) | prisma.config.ts does not have typed seed property yet | 01-01 |
| 3 | prisma.config.ts excluded from tsconfig | Prisma's own type system conflicts with project strict TS | 01-01 |
| 4 | Shared PostgreSQL Docker container (cms-postgres) | Reused existing container on port 5432, created hrms_ptsan database | 01-01 |
| 5 | Zod 4.x with @hookform/resolvers v5 | Latest versions, compatible | 01-01 |
| 6 | Cast JSON fields to Prisma InputJsonValue for Prisma 6 compatibility | Record<string, unknown> not assignable to Prisma 6 JSON types | 01-04 |
| 7 | Explicit audit logging via helper, not middleware | Prevents infinite recursion; service functions call createAuditLog explicitly | 01-04 |
| 8 | Auth config split: auth.config.ts (Edge) and auth.ts (Node) | Middleware runs in Edge runtime which cannot use Prisma/bcrypt | 01-02 |
| 9 | 8-hour JWT maxAge for work-day sessions | Matches typical work day; balances security and UX | 01-02 |
| 10 | Generic login error message for all failures | Security: never reveal whether email exists in system | 01-02 |
| 11 | SessionProvider as separate client component for dashboard routes only | Keeps root layout clean; session context only where needed | 01-03 |
| 12 | Dark sidebar theme (slate-800/900) for visual distinction | Contrasts with white content area for clear navigation affordance | 01-03 |
| 13 | DataTable defaults to 25 rows matching DEFAULT_PAGE_SIZE | Consistent with constants.ts page size convention | 01-03 |
| 14 | Zod 4 uses `error` not `errorMap` for nativeEnum; `issues` not `errors` on ZodError | Zod 4 breaking API change from Zod 3 | 01-05 |
| 15 | Separate create/edit forms in single dialog component | Avoids optional password complexity in shared schema | 01-05 |
| 16 | requireSuperAdmin() helper in server actions | Centralizes auth check pattern for admin-only operations | 01-05 |
| 17 | Service/action files structured with section comments for Plan 07 append | Prevents merge conflicts when parallel plans modify same files | 01-06 |
| 18 | Read actions with date serialization for client components | Client components cannot call service functions directly; dates must be serialized | 01-06 |
| 19 | NuqsAdapter added to root layout for nuqs v2 | nuqs v2 requires provider wrapper for useQueryState to work | 01-06 |
| 20 | dateTo end-of-day adjustment (setHours 23:59:59:999) | Makes date-to filter inclusive of the full selected day | 01-08 |
| 21 | nuqs _all sentinel for Select empty state | Empty string not valid as SelectItem value; _all maps to empty URL param | 01-08 |
| 22 | DiffView renders union of old+new keys | All keys aligned vertically in both columns even when key only in one side | 01-08 |
| 23 | Client-safe enums in src/types/enums.ts | Role/AuditAction as plain const objects; Prisma runtime cannot bundle in browser (node: scheme URIs) | 01-09 |
| 24 | getDashboardData() takes no arguments | All roles use same DB queries; role-specific rendering at component level | 01-09 |
| 25 | Seed uses findFirst-before-create for master data | No unique name constraint on departments/positions/locations/leave-types | 01-09 |
| 26 | Migration pending Docker/PostgreSQL start | Prisma migrate requires live database; schema and client generation succeeded without it | 02-01 |
| 27 | requireHRAdmin() auth helper for employee actions | Allows both HR_ADMIN and SUPER_ADMIN; separate from requireSuperAdmin() | 02-02 |
| 28 | NIK generated inside $transaction to prevent race conditions | EMP-YYYY-NNNN format; sequential within year | 02-02 |
| 29 | Use prisma directly for employee lookup in document access check | Plan 02-02 creates employee.service.ts in parallel; avoids import errors | 02-03 |
| 30 | Position selector filters by selected department | UX: prevents invalid department+position combos; resets position when department changes | 02-05 |
| 31 | Resolver type assertion for zod coerce.date() schemas | z.coerce.date().optional().or(literal) infers unknown; cast needed for react-hook-form v5 compatibility | 02-05 |
| 32 | Resolver double-cast (as unknown as Resolver<T>) for coerce.date() schemas | react-hook-form v5 dual-type resolution conflict with zod coerce.date().optional().or(literal) | 02-06 |
| 33 | next.config.mjs used (not next.config.ts) for server action body limit | Project uses .mjs extension; plan referenced .ts but .mjs is the actual file | 03-01 |
| 34 | Local interface for attendance history records with officeLocation relation | getEmployeeAttendance returns Prisma include with officeLocation; local AttendanceRecordWithLocation interface is cleaner than Prisma.AttendanceRecordGetPayload | 03-04 |
| 35 | GPS-first with IP fallback in ClockInButton | navigator.geolocation with 8s timeout; on error or denial falls back to server-side IP verification in clockInAction/clockOutAction | 03-04 |
| 36 | Resolver<T> single cast for zodResolver with coerce.date() schemas | `as Resolver<SubmitLeaveInput>` (not ReturnType<typeof zodResolver>) matches established project pattern; prevents TS2322 on FormField control | 03-05 |
| 37 | LeaveBalanceCard accepts leaveTypes + balances props | Shows cards for all leave types even if balance row not yet created in DB; balanceMap lookup with fallback to lt.annualQuota | 03-05 |
| 38 | Reject notes validated client-side before server action call | Avoids round-trip for obvious empty-notes validation; server action (rejectLeaveSchema) also validates for defense in depth | 03-07 |
| 39 | pendingCount computed from already-fetched serialized list | No extra DB count query needed; list already filtered by status | 03-07 |
| 40 | ManualRecordDialog created in Task 1 commit (not Task 2) to avoid tsc failure | attendance-summary-table.tsx imports it; creating in same commit keeps type checking clean between tasks | 03-06 |
| 41 | Resolver<ManualAttendanceInput> single cast for zodResolver on manualAttendanceSchema | coerce.date() schema pattern; matches Decision 36 convention established in 03-05 | 03-06 |
| 42 | React.createElement cast to ReactElement<DocumentProps> for renderToStream | renderToStream parameter type is more specific than FunctionComponentElement return; cast resolves without runtime impact | 03-08 |
| 43 | Buffer converted to new Uint8Array(buffer) for Route Handler Response | Web API BodyInit does not include Node.js Buffer; Uint8Array satisfies BodyInit and works at runtime | 03-08 |
| 44 | ExportButtons restricted to isHRAdmin (not MANAGER) | Matches API route auth check which also restricts to HR_ADMIN/SUPER_ADMIN | 03-08 |
| 45 | upcomingLeave for employee fetched in dashboard/page.tsx and passed as prop | Avoids breaking getDashboardData no-args Decision #24 while supporting per-employee data | 03-09 |
| 46 | pendingLeaveRequests kept for backward compat; pendingLeaveCount is canonical Phase 3 field | super-admin-dashboard uses pendingLeaveRequests; hr-admin and manager use pendingLeaveCount | 03-09 |
| 47 | Seed attendance records use dynamic date calculation relative to today | Seed is date-agnostic; always seeds last week's data regardless of run date | 03-09 |
| 48 | PayrollEntry uses snapshot pattern — all calculation fields stored at run time | Ensures payslip history is immutable even if BPJS/TER rates change; avoids recomputation | 04-01 |
| 49 | TER_TABLE_C row 8 anomaly preserved verbatim from PP 58/2023 | Row 8 (10,950,000-11,200,000) = 1.75% lower than row 7's 2%; matches official lampiran | 04-01 |
| 50 | decimal.js imported in constants.ts for all monetary rate/cap constants | Avoids floating-point errors; new Decimal("string") gives exact representation | 04-01 |
| 51 | annualBpjsEmployee in calculateDecemberPPh21 includes only JHT + JP (not kesEmp) | BPJS Kesehatan is not deductible for PPh 21 per PMK 168/2023 | 04-02 |
| 52 | decemberPPh21 floored at 0 in service layer; engine handles refund | Keeps pure calculation service clean; business logic (refund vs carry-forward) belongs in engine | 04-02 |
| 53 | No NPWP surcharge in monthly TER; only in December annualization | PMK 168/2023 §9: 20% surcharge applies only at annual true-up step | 04-02 |
| 54 | Absence = AttendanceRecord.clockIn IS NULL | AttendanceStatus enum has no ABSENT value; admin-created absent records have no clockIn | 04-03 |
| 55 | requireHRAdmin() defined locally in payroll.actions.ts | No auth-utils.ts file exists; employee.actions.ts defines it locally — same pattern | 04-03 |
| 56 | Native checkbox for isFixed in salary-tab | shadcn Checkbox component not installed in this project | 04-03 |
| 57 | salaryData prop optional on EmployeeProfileTabs; tab hidden unless present | Only HR_ADMIN/SUPER_ADMIN see the Gaji & Tunjangan tab | 04-03 |

## Blockers / Concerns

- PostgreSQL requires Docker Desktop running (uses existing cms-postgres container on port 5432)
- Prisma deprecation warning on seed config is cosmetic but noisy

## Session Continuity

Last session: 2026-03-07T12:34:29Z
Stopped at: Completed 04-03-PLAN.md — payroll batch engine, server actions, Gaji & Tunjangan tab
Resume file: None

## Notes

- **Depth:** Comprehensive (5 phases derived from natural module boundaries and data dependencies)
- **Critical path:** Phase 1 > Phase 2 > Phase 3 > Phase 4. Phase 5 (Recruitment) depends only on Phase 2 and could theoretically run after Phase 2, but is sequenced last because it is the most independent module and Payroll is the highest-risk, most-scrutinized feature for thesis defense.
- **Research flag for Phase 4:** PPh 21 TER rate table values and BPJS salary caps must be verified against official 2026 sources before any payroll calculation code is written. See research/SUMMARY.md "Gaps to Address Before Implementation" for the full list.
- **Requirement count note:** Actual v1 requirement count is 54 (not 55 as previously stated in REQUIREMENTS.md traceability section).
- **Pattern note:** All future plans must import Prisma types from `@/generated/prisma/client`, NOT `@prisma/client`.
- **Service layer pattern:** Query services go in `src/lib/services/`. The audit service establishes this convention.
- **Layout pattern:** Dashboard layout uses server component for auth check, wraps children in SessionProvider. Client components use useSession().
- **Shared components:** Reusable UI components in `src/components/shared/` (StatCard, DataTable, ConfirmDialog with loading prop, loading skeletons).
- **Client-safe enums pattern:** ALWAYS import enums from `@/types/enums` in client components; only import from `@/generated/prisma/client` in server-only files (services, actions, auth). Now includes Gender, Religion, MaritalStatus, ContractType, PTKPStatus, DocumentType, AttendanceStatus, LeaveStatus.
- **Dashboard pattern:** Role switching is server-side in dashboard/page.tsx; each role has its own _components/[role]-dashboard.tsx receiving DashboardData props.
- **Attendance schema pattern:** clockActionSchema for GPS coords (optional), manualAttendanceSchema for admin override with reason required.
- **Leave schema pattern:** submitLeaveSchema uses .refine() for date range validation (endDate >= startDate).

- **Leave approval pattern:** Role-gated server page fetches and serializes; client table handles URL filter updates; approve/reject dialogs use useTransition with single mode prop controlling variant, label, and notes validation requirement.

- **Pure calculation service pattern:** Payroll services in src/lib/services/ that import only Decimal, constants, and enums (never Prisma) are the canonical pattern for tax/BPJS logic. Batch engine calls these; they never call DB.

---
*Last updated: 2026-03-07T12:34:29Z*
