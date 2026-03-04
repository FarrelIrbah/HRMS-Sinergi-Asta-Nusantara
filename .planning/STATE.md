# Project State

## Project Reference
See: .planning/PROJECT.md (updated 2026-02-27)

**Core value:** HR staff can manage the complete employee lifecycle in one integrated system with accurate Indonesian tax and social insurance compliance.
**Current focus:** Phase 2

## Phase Status

| Phase | Name | Status | Requirements |
|-------|------|--------|--------------|
| 1 | Foundation | Complete | 14 |
| 2 | Employee Data Management | ◐ In Progress (7/8 plans) | 10 |
| 3 | Attendance and Leave Management | ○ Pending | 14 |
| 4 | Payroll Management | ○ Pending | 9 |
| 5 | Recruitment Management | ○ Pending | 7 |

## Current Work

Phase: 2 of 5 (Employee Data Management)
Plan: 7 of 8
Status: In progress
Last activity: 2026-03-05 - Completed 02-06-PLAN.md (filled gap; 02-07 was already done)

Progress: [████████████████░] 16/17 plans complete (Phase 1: 9/9, Phase 2: 7/8)

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

## Blockers / Concerns

- PostgreSQL requires Docker Desktop running (uses existing cms-postgres container on port 5432)
- Prisma deprecation warning on seed config is cosmetic but noisy
- **02-01 migration not yet applied** -- must run `npx prisma migrate dev --name add-employee-models` before starting 02-02

## Session Continuity

Last session: 2026-03-05T05:18:00Z
Stopped at: Completed 02-06-PLAN.md
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
- **Client-safe enums pattern:** ALWAYS import enums from `@/types/enums` in client components; only import from `@/generated/prisma/client` in server-only files (services, actions, auth). Now includes Gender, Religion, MaritalStatus, ContractType, PTKPStatus, DocumentType.
- **Dashboard pattern:** Role switching is server-side in dashboard/page.tsx; each role has its own _components/[role]-dashboard.tsx receiving DashboardData props.

---
*Last updated: 2026-03-05T05:18:00Z*
