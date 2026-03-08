## Plan 05-01: Prisma Schema, Enums, Zod Validation

**Phase:** Recruitment Management
**Completed:** 2026-03-08
**Status:** Complete

### Deliverables

- `prisma/schema.prisma` — Added `VacancyStatus` and `CandidateStage` Prisma enums; added `Vacancy`, `Candidate`, and `Interview` models; added `vacancies Vacancy[]` relation to `Department` model
- `prisma/migrations/20260308081802_add_recruitment_models/migration.sql` — Applied migration creating `vacancies`, `candidates`, and `interviews` tables plus PostgreSQL enum types
- `src/types/enums.ts` — Added client-safe `VacancyStatus` and `CandidateStage` const objects with TypeScript types
- `src/lib/validations/recruitment.ts` — Created Zod schemas: `createVacancySchema`, `updateVacancySchema`, `createCandidateSchema`, `updateCandidateStageSchema`, `updateOfferSchema`, `createInterviewSchema`

### Commits

| Task | Commit | Files |
|------|--------|-------|
| Prisma schema — recruitment models and enums | `1aa7673` | `prisma/schema.prisma` |
| Prisma migration | `0ef5d94` | `prisma/migrations/20260308081802_add_recruitment_models/migration.sql` |
| Client-safe enums for recruitment | `f41009d` | `src/types/enums.ts` |
| Zod validation schemas for recruitment | `2432de9` | `src/lib/validations/recruitment.ts` |

### Decisions

- `vacancies`, `candidates`, and `interviews` table names follow lowercase plural convention matching all prior models (`@@map` directives)
- Prisma client DLL regeneration failed with EPERM (dev server holds the lock) but TypeScript types were fully regenerated — existing binary continues to work; next server restart will pick up the new binary from any subsequent generate
- All validation schemas use Indonesian-language error messages consistent with the rest of the project

### Issues

- `prisma generate` binary copy failed with `EPERM: operation not permitted` because `query_engine-windows.dll.node` was locked by the running Next.js dev server. The TypeScript type files (`enums.ts`, `models.ts`, model-specific files) were successfully regenerated. TypeScript compilation passes with no errors. This is cosmetic — no functional impact.
