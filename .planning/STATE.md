# Project State

## Project Reference
See: .planning/PROJECT.md (updated 2026-02-27)

**Core value:** HR staff can manage the complete employee lifecycle in one integrated system with accurate Indonesian tax and social insurance compliance.
**Current focus:** Phase 1

## Phase Status

| Phase | Name | Status | Requirements |
|-------|------|--------|--------------|
| 1 | Foundation | ◐ In Progress (2/9 plans) | 14 |
| 2 | Employee Data Management | ○ Pending | 10 |
| 3 | Attendance and Leave Management | ○ Pending | 14 |
| 4 | Payroll Management | ○ Pending | 9 |
| 5 | Recruitment Management | ○ Pending | 7 |

## Current Work

Phase: 1 of 5 (Foundation)
Plan: 4 of 9
Status: In progress
Last activity: 2026-02-27 - Completed 01-04-PLAN.md (Audit Infrastructure)

Progress: [██░░░░░░░] 2/9 plans (~22%)

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

## Blockers / Concerns

- PostgreSQL requires Docker Desktop running (uses existing cms-postgres container on port 5432)
- Prisma deprecation warning on seed config is cosmetic but noisy

## Session Continuity

Last session: 2026-02-27T16:25:30Z
Stopped at: Completed 01-04-PLAN.md
Resume file: None

## Notes

- **Depth:** Comprehensive (5 phases derived from natural module boundaries and data dependencies)
- **Critical path:** Phase 1 > Phase 2 > Phase 3 > Phase 4. Phase 5 (Recruitment) depends only on Phase 2 and could theoretically run after Phase 2, but is sequenced last because it is the most independent module and Payroll is the highest-risk, most-scrutinized feature for thesis defense.
- **Research flag for Phase 4:** PPh 21 TER rate table values and BPJS salary caps must be verified against official 2026 sources before any payroll calculation code is written. See research/SUMMARY.md "Gaps to Address Before Implementation" for the full list.
- **Requirement count note:** Actual v1 requirement count is 54 (not 55 as previously stated in REQUIREMENTS.md traceability section).
- **Pattern note:** All future plans must import Prisma types from `@/generated/prisma/client`, NOT `@prisma/client`.
- **Service layer pattern:** Query services go in `src/lib/services/`. The audit service establishes this convention.

---
*Last updated: 2026-02-27T16:25:30Z*
