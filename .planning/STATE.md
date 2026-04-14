# Project State

## Project Reference
See: .planning/PROJECT.md (updated 2026-02-27)

**Core value:** HR staff can manage the complete employee lifecycle in one integrated system with accurate Indonesian tax and social insurance compliance.
**Current focus:** Phase 5

## Phase Status

| Phase | Name | Status | Requirements |
|-------|------|--------|--------------|
| 1 | Foundation | Complete | 14 |
| 2 | Employee Data Management | ● Complete (8/8 plans) | 10 |
| 3 | Attendance and Leave Management | ● Complete (9/9 plans) | 14 |
| 4 | Payroll Management | ● Complete (8/8 plans) | 9 |
| 5 | Recruitment Management | ○ Pending | 7 |
| 6 | UI Enhancement (ad-hoc) | ◐ In progress (2 plans complete) | — |

## Current Work

Phase: 5 of 5 (Recruitment Management) — In progress
Plan: 6 of 7 (plans 01–06 complete)
Status: Phase 5 plan 06 complete (2026-03-08). Offer letter PDF generation and download wired to candidate detail page.
Last activity: 2026-04-14 - Plan 06-02: Manajemen SDM module redesign — Karyawan list (KPI bar, filter chips, avatar column) + Tambah Karyawan form (4-section nav sidebar, sticky action bar) + Rekrutmen list (card grid with pipeline progress bar) + Buat Lowongan form (3 sections + tips sidebar); services extended with getEmployeeStatsSummary, getVacanciesWithPipeline, getRecruitmentStatsSummary

Progress: [█████████████████████████████████████░░] 6/7 Phase 5 plans complete (Phase 1: 9/9, Phase 2: 8/8, Phase 3: 9/9, Phase 4: 8/8)

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
| 58 | Resolver<FormValues> single cast for z.coerce.number() schema in RunPayrollForm | as ReturnType<typeof zodResolver> fails with coerce; single cast matches Decision 36 pattern | 04-04 |
| 59 | Payslip download uses asChild + anchor when FINALIZED; span when DRAFT | Avoids invalid nested <a> inside <button>; Button disabled prop gates DRAFT state | 04-04 |
| 60 | Summary totals computed server-side by summing serialized entries | No extra DB aggregate query; entries already fetched for the table | 04-04 |
| 61 | { prisma } named import from @/lib/prisma (not default) | prisma.ts uses export const prisma; plan scaffold used default import which fails in strict TS | 04-05 |
| 62 | /payslip page for HR roles shows info redirect card to /payroll | HR do not need their own payslip; redirect gives clear affordance without 403 | 04-05 |
| 63 | THR basis = gaji pokok + tunjangan tetap (isFixed=true) only | Permenaker 6/2016; mirrors BPJS basis; non-fixed allowances excluded | 04-07 |
| 64 | Employees without agama field skipped gracefully in THR page and action | Returns ineligible with explanatory note rather than crashing; agama is nullable in schema | 04-07 |
| 65 | AddTHRForm is separate client component; page.tsx stays pure server component | Follows run-payroll-form.tsx separation pattern; keeps server component clean | 04-07 |
| 66 | Payslip download uses direct anchor + buttonVariants, not Button asChild | asChild + disabled={false} can cause Slot interaction issues; direct anchor is simpler and reliable | 04-08 |
| 67 | Recruitment validation schemas use Indonesian error messages | Consistent with all prior validation files in the project | 05-01 |
| 68 | createAuditLog called with module/targetId/newValue in recruitment actions | Actual signature in @/lib/prisma differs from plan scaffold (entity/entityId/newData); adapted to real implementation | 05-02 |
| 69 | Discriminated union narrowed with result.success check for convertCandidateToEmployeeAction | Action returns { success: true; prefill } or { success: false; error }; plan scaffold accessed result.error/result.prefill directly; narrowed via if (!result.success) | 05-05 |
| 70 | vacancyId prop kept in KanbanBoardProps but prefixed _vacancyId internally | updateCandidateStageAction resolves vacancy from candidateId; prop kept for API symmetry and future use | 05-04 |
| 71 | over.id disambiguation in handleDragEnd: candidates array first, then STAGE_ORDER, else no-op | @dnd-kit over.id is either a card CUID or a stage string depending on drop target; order of checks prevents wrong-stage assignment | 05-04 |
| 72 | offer-letter-pdf.tsx placed in src/lib/pdf/ not src/components/pdf/ | Established project convention — payslip-pdf.tsx and attendance-pdf.tsx both live in src/lib/pdf/; src/components/pdf/ does not exist | 05-06 |
| 73 | isTaxBorneByCompany on Employee model (not EmployeeAllowance) | Tax-bearing is per-employee, not per-allowance; company either bears full PPh 21 or doesn't | 04-10 |
| 74 | pph21 in PayrollEntry always stores full calculated amount | Even when company bears tax, the SPT reporting needs the actual tax figure; netPay/totalDeductions reflect employee perspective | 04-10 |
| 75 | addTHRToPayrollAction recalculates PPh 21 via calculateMonthlyPPh21 | THR shifts TER bracket; simple grossPay+THR addition without tax recalc causes underpayment | 04-11 |
| 76 | Pegawai harian lepas (TER Harian) out of scope | System only supports PKWT/PKWTT (TER Bulanan); keeps release timeline intact | 04-11 |
| 77 | Payslip PPh 21 shows Rp 0 with "(Ditanggung Perusahaan)" label when tax-borne | Full amount moved to Kontribusi Perusahaan section for transparency | 04-12 |
| 78 | BPJS JP cap = Rp 10.547.400 (Mar-2025 value), not Rp 10.042.300 (2024) | BPJS Ketenagakerjaan adjusts JP ceiling annually per inflation; system uses current effective value | 04-13 |
| 79 | SummaryTile + TONE_MAP pattern dipakai lintas halaman (dashboard, employees, recruitment) | 5-tone palette (emerald/sky/violet/amber/slate) konsisten; KPI bar structure identik mempermudah kognisi user | 06-02 |
| 80 | VacancyTable di-convert dari table ke card grid dengan pipeline progress bar | Lowongan punya multi-dimensi data (status, pipeline stages, counts, dates) yang sulit dibaca dalam row; card memberi visual hierarchy + at-a-glance pipeline | 06-02 |
| 81 | getVacanciesWithPipeline include candidates.stage (bukan groupBy server-side) | Count stage di-compute client-side dari array; Prisma groupBy perlu query terpisah per vacancy, overhead > savings untuk N vacancies kecil | 06-02 |
| 82 | Form panjang (Tambah Karyawan) dapat sticky section nav sidebar + anchor links | Navigasi cepat antar 4 section tanpa scroll manual; sticky tidak memakan ruang di mobile karena baru aktif di lg+ | 06-02 |
| 83 | Sticky action bar (sticky bottom-4 + backdrop-blur) di bawah form | User tidak perlu scroll ke bawah tiap submit; hint text + CTA terlihat terus; rounded card + shadow-lg memberi affordance "siap action" | 06-02 |
| 84 | Tips sidebar (emerald-50 Card) di halaman Buat Lowongan | HR baru butuh panduan menulis lowongan berkualitas; posisi lg:sticky agar tetap terlihat saat mengisi form panjang | 06-02 |

## Blockers / Concerns

- PostgreSQL requires Docker Desktop running (uses existing cms-postgres container on port 5432)
- Prisma deprecation warning on seed config is cosmetic but noisy

## Session Continuity

Last session: 2026-04-14T00:00:00Z
Stopped at: Plan 06-02 complete — Manajemen SDM module redesign (4 pages: Karyawan list + Tambah Karyawan form + Rekrutmen list + Buat Lowongan form) done, tsc clean (1 pre-existing error unrelated), documentation written
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
- **Client-safe enums pattern:** ALWAYS import enums from `@/types/enums` in client components; only import from `@/generated/prisma/client` in server-only files (services, actions, auth). Now includes Gender, Religion, MaritalStatus, ContractType, PTKPStatus, DocumentType, AttendanceStatus, LeaveStatus, PayrollStatus, VacancyStatus, CandidateStage.
- **Dashboard pattern:** Role switching is server-side in dashboard/page.tsx; each role has its own _components/[role]-dashboard.tsx receiving DashboardData props.
- **Attendance schema pattern:** clockActionSchema for GPS coords (optional), manualAttendanceSchema for admin override with reason required.
- **Leave schema pattern:** submitLeaveSchema uses .refine() for date range validation (endDate >= startDate).

- **Leave approval pattern:** Role-gated server page fetches and serializes; client table handles URL filter updates; approve/reject dialogs use useTransition with single mode prop controlling variant, label, and notes validation requirement.

- **Pure calculation service pattern:** Payroll services in src/lib/services/ that import only Decimal, constants, and enums (never Prisma) are the canonical pattern for tax/BPJS logic. Batch engine calls these; they never call DB.

- **UI redesign design system (Phase 06):** Canvas `bg-slate-50` with `-m-4 md:-m-6 p-4 md:p-6` full-bleed trick; emerald as primary with 5-tone KPI palette (emerald/sky/violet/amber/slate); SummaryTile + TONE_MAP sub-component pattern reused across dashboard, employees, recruitment; typography uses `text-2xl font-semibold tracking-tight` headings + `tabular-nums` for all numbers; accessibility via aria-label on pages/sections, aria-live on counters, role="progressbar" for stacked bars.

---
*Last updated: 2026-04-14T00:00:00Z*
