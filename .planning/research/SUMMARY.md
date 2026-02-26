# Project Research Summary

**Project:** HRMS PT. Sinergi Asta Nusantara
**Domain:** Human Resource Management System (Indonesian market, single-company, thesis scope)
**Researched:** 2026-02-27
**Confidence:** MEDIUM (all research from training data; WebSearch unavailable — verify Indonesian tax/BPJS numbers before implementation)

---

## Executive Summary

This is a standard single-company HRMS covering four modules: Employee Data Management, Recruitment, Attendance & Leave, and Payroll. The tech stack (Next.js 14 App Router, PostgreSQL, Prisma, NextAuth.js v5, shadcn/ui) is already decided and well-suited to the domain. What distinguishes this project from a generic web app is the Indonesian regulatory layer: PPh 21 TER-based income tax (effective January 2024), BPJS Kesehatan and Ketenagakerjaan contributions with salary caps, 11 legally-mandated leave types under UU No. 13/2003 and UU Cipta Kerja, and THR (holiday allowance) obligations. Every one of these compliance requirements is more complex than it appears at first look.

The recommended approach is sequential module completion driven by data dependency: Foundation (auth, layout, settings) first, then Employee Data (every other module references it), then Attendance and Leave (Payroll depends on overtime hours and absence data), then Payroll (the most complex and highest-risk module), with Recruitment slotted in after Employee Data since it is the most independent module. The payroll calculation engine — specifically PPh 21 using the TER method for January-November and a full annualization true-up in December — should be built as an isolated, fully-tested service function before any UI is attached to it. This is the single most scrutinized feature in an HRMS thesis defense.

The main risks are: (1) getting Indonesian tax/BPJS rates wrong due to regulatory changes since the training data cutoff, (2) Vercel serverless infrastructure issues (connection pooling, no persistent filesystem, no headless Chrome), and (3) scope creep destroying the thesis timeline. All three are preventable with upfront decisions: verify 2026 tax numbers before coding begins, set up Prisma Accelerate/PgBouncer and Vercel Blob in Phase 0, and enforce a hard out-of-scope list from day one.

---

## Key Findings

### Stack

The core stack requires no changes. HRMS-specific library additions are straightforward and well-established.

**Core (already decided):**

| Technology | Purpose |
|------------|---------|
| Next.js 14 App Router | Full-stack framework — route groups organize by access level without duplicating routes |
| TypeScript 5.x | Type safety across all layers |
| PostgreSQL 16 + Prisma 5.x | Database with migrations; `Decimal` type maps directly to payroll precision needs |
| NextAuth.js v5 (Auth.js) | Authentication with credentials provider + role-based session |
| React Hook Form + Zod | Form management and schema validation |
| Tailwind CSS + shadcn/ui | Styling and component library |

**HRMS-specific additions:**

| Library | Purpose | Decision |
|---------|---------|---------|
| `@react-pdf/renderer` | Payslip and offer letter PDF generation | USE — server-side, no Chromium, works on Vercel serverless |
| `decimal.js` | Precise payroll arithmetic | USE — floating-point errors in salary calculations are unacceptable |
| `date-fns` + `date-fns-tz` | Date/time with WIB/WITA/WIT timezone support | USE — IANA `Asia/Jakarta` identifier, immutable, tree-shakeable |
| `geolib` | Server-side GPS geofence distance calculation | USE — lightweight, `isPointWithinRadius()` is all that's needed |
| `xlsx` (SheetJS community) | Excel report export | USE — HR managers expect Excel downloads |
| `@vercel/blob` | Employee document storage | USE — native Vercel integration, no persistent filesystem on serverless |
| `zustand` | Multi-step employee form state | USE — survives route navigation between form steps |
| `recharts` | Dashboard charts | USE — React-native, works with Next.js |
| `@tanstack/react-table` | Sortable, filterable data tables | USE — pairs with shadcn/ui Table component |
| `Intl.NumberFormat('id-ID')` | Indonesian Rupiah formatting | USE — no library needed, native browser API |

**Do not use:** moment.js (deprecated), puppeteer/playwright for PDF (Chromium too large for Vercel), multer/formidable (Express-only, incompatible with App Router), any npm PPh 21 library (unmaintained/outdated), native Number for money math (floating-point errors).

For scheduled tasks (monthly payroll reminders), use Vercel Cron Jobs via `vercel.json` — no separate cron library needed.

See `STACK.md` for complete installation command and detailed rationale.

---

### Table Stakes (Must Be in v1)

**Employee Data Management:**
- Employee profile CRUD with all Indonesian fields: NIK, agama, status perkawinan, jumlah tanggungan, NPWP flag, BPJS membership numbers, PTKP status (TK/0 through K/3)
- PKWT vs PKWTT contract type tracking with expiry alerts
- Document upload (KTP, NPWP, BPJS cards, contracts) via Vercel Blob with private/signed URLs
- Role-based visibility: HR Admin sees all, Manager sees department, Employee sees own profile
- Employment status tracking (aktif, resign, PHK, kontrak habis) — inactive employees stay in DB for historical records

**Recruitment Management:**
- Job posting CRUD (internal only — no public career page needed)
- Candidate pipeline: Applied > Screening > Interview > Offered > Hired / Rejected
- Interview scheduling with notes per stage
- Offer letter PDF generation via `@react-pdf/renderer`
- Convert hired candidate to employee record (eliminates double data entry)

**Attendance & Leave Management:**
- Daily clock-in / clock-out with IP restriction (primary) and GPS geofencing (secondary/mobile)
- All 11 Indonesian leave types per UU 13/2003 and UU Cipta Kerja (see Indonesian-Specific section)
- Leave request submission and approval workflow (two-level: Employee > Manager or HR)
- Leave balance tracking with annual reset
- Monthly attendance report (hadir, absen, terlambat, lembur hours) feeding payroll

**Payroll Management:**
- Monthly payroll batch calculation for all active employees
- BPJS Kesehatan (1% employee / 4% employer) and BPJS Ketenagakerjaan (JHT, JKK, JKM, JP) with salary caps
- PPh 21 TER method (Jan-Nov) + December annualization true-up
- THR calculation integrated into the relevant month's payroll run
- Payslip PDF per employee via `@react-pdf/renderer`
- Draft > Finalized state machine — payroll is immutable once finalized
- Payroll audit trail: snapshot salary and rate values at calculation time

**Should ship (strong thesis):**
- Overtime request and approval workflow feeding payroll (1/173 hourly rate)
- Payroll draft/preview before finalization
- Attendance calendar view (very demo-friendly)
- Holiday calendar management (national + company holidays)
- Year-to-date PPh 21 summary per employee

**Defer to v2+:**
- Employee timeline/audit log, org chart visualization, bulk Excel import
- Recruitment analytics dashboard, candidate scoring
- GPS geofencing (build IP-only first; add GPS as secondary)
- BPJS contribution report formatted for BPJS submission

**Anti-features (do not build):**
Multi-tenant, performance management/KPI, training LMS, bank transfer integration, multi-level approval chains, shift scheduling, biometric integration, native mobile app, email/SMTP, severance calculator, e-SPT export, salary advance/kasbon.

See `FEATURES.md` for full feature breakdown with legal bases and complexity notes.

---

### Architecture Approach

The application uses a single `(dashboard)` route group (not separate groups per role) to avoid route duplication — all roles access the same URLs but see filtered data. Business logic lives in a `lib/services/` layer called by both Server Actions and API routes, making it testable independently of the request/response cycle. The three-layer architecture — Route/Page > Service function > Prisma query — is the maximum complexity allowed; no repository interfaces or abstract patterns are needed.

**Major components:**

| Component | Responsibility |
|-----------|---------------|
| `(auth)/login` | Public route, minimal layout, credentials sign-in |
| `(dashboard)/layout.tsx` | Sidebar + header + session guard for all authenticated routes |
| `lib/services/pph21.service.ts` | Isolated PPh 21 tax calculation engine — pure functions, fully testable |
| `lib/services/bpjs.service.ts` | BPJS contribution calculation with salary cap enforcement |
| `lib/services/payroll.service.ts` | Batch payroll orchestration — calls pph21 and bpjs services |
| `lib/services/attendance.service.ts` | IP/GPS validation + attendance record management |
| `app/api/pdf/payslip/[id]/route.ts` | Payslip PDF generation via `@react-pdf/renderer` |
| `app/api/pdf/offer-letter/[id]/route.ts` | Offer letter PDF generation |
| `app/api/upload/route.ts` | File upload handler writing to Vercel Blob |
| `middleware.ts` | Authentication check + coarse route-level RBAC |

**RBAC is enforced at three layers:** middleware (route-level, authentication + coarse role check), Server Actions (action-level, `requireRole()` guard before any mutation), and UI (hide buttons/links the user cannot use). Data-level scoping (Manager sees own department only, Employee sees own record only) is enforced in service functions, not middleware.

**Key database design decisions:**
- `User` and `Employee` are separate models — User holds auth credentials, Employee holds HR data. A Super Admin can be a User without an Employee record.
- All monetary fields use Prisma `Decimal` (maps to PostgreSQL `NUMERIC`) — never `Float`.
- `PayrollItem` stores a full snapshot of calculated values — it does not reference current Employee salary (which may change). Denormalization is intentional.
- `@@unique([employeeId, date])` on `AttendanceRecord` enforces one clock-in per employee per day at the database level.
- `@@unique([month, year])` on `PayrollPeriod` prevents duplicate payroll runs.
- BPJS rates and PPh 21 PTKP values should be stored in config tables (not hardcoded) so rate changes don't require code deployment.

See `ARCHITECTURE.md` for complete folder structure, Prisma schema, and data flow diagrams.

---

### Critical Pitfalls

**Top 5 — will break the system or the thesis:**

1. **PPh 21 calculation errors (CRIT-1)** — The TER method (Jan-Nov) and December annualization true-up are two distinct algorithms. Common failures: applying a flat monthly rate, wrong mid-year hire annualization, missing December reconciliation, mixing gross vs net-up methods. Prevention: build `pph21.service.ts` as a pure function with explicit parameters and write unit tests against DJP reference values before touching any UI.

2. **BPJS salary cap enforcement (CRIT-3)** — BPJS Kesehatan and Jaminan Pensiun both have salary caps. Calculating on uncapped salary overcharges high earners. Also: employee BPJS contributions (JHT + JP) must be subtracted from gross income before PPh 21 calculation — forgetting this produces incorrect tax. Prevention: `Math.min(salary, cap)` before every rate multiplication; unit test with a salary above cap.

3. **Prisma connection exhaustion on Vercel serverless (CRIT-4)** — Every cold function start can create a new PrismaClient with its own connection pool, exhausting PostgreSQL's connection limit under moderate load. Works perfectly in development; breaks in production. Prevention: singleton PrismaClient pattern + Prisma Accelerate or PgBouncer connection pooler, set from day one.

4. **Payroll race conditions (CRIT-5)** — Two simultaneous "Run Payroll" clicks produce duplicate payslip records for the same period. Prevention: `@@unique([payrollPeriodId, employeeId])` DB constraint + `payroll_runs` status machine (DRAFT > PROCESSING > COMPLETED > LOCKED) + disable the UI button while processing.

5. **Scope creep (THESIS-1)** — The single biggest risk to thesis delivery. HRMS has infinite surface area. Email notifications, complex dashboards, biometric integration, multi-level approvals — each adds 1-3 weeks with no thesis value. Prevention: the out-of-scope list in this document is the law. Complete each module fully before starting the next one.

**High-priority pitfalls (will cause significant issues):**
- Timezone mismatch WIB vs UTC in attendance timestamps (HIGH-1) — store UTC, convert at display only
- NextAuth v5 role not appearing in session (HIGH-2) — requires explicit type augmentation + jwt/session callbacks
- PDF generation via Puppeteer fails on Vercel (HIGH-3) — use `@react-pdf/renderer` from the start, never Puppeteer
- File uploads saved to local filesystem disappear (HIGH-4) — use Vercel Blob from day one
- Leave balance edge cases: overlapping requests, cancelled-then-restored balances (HIGH-5)

See `PITFALLS.md` for complete pitfall registry with code-level prevention patterns.

---

## Indonesian-Specific Implementation Requirements

These items directly affect implementation design — not optional, not deferrable.

### PPh 21 TER Method (Effective January 2024)

**Legal basis:** PP No. 58 Tahun 2023, PMK No. 168 Tahun 2023

**January-November:** Apply TER (Tarif Efektif Rata-rata) percentage directly to gross monthly income. TER category is based on PTKP status: Category A (TK/0 through TK/3), Category B (K/0 through K/2), Category C (K/3). TER lookup table has ~50+ rows; store in the database as a configurable rate table.

**December:** Full annualization true-up — calculate actual annual PPh 21 using progressive brackets, subtract sum of PPh 21 already withheld Jan-Nov. Result can be negative (employee gets a refund). Handle gracefully.

**Progressive tax brackets (verify for 2026):**
- Rp 0 - 60,000,000: 5%
- Rp 60,000,001 - 250,000,000: 15%
- Rp 250,000,001 - 500,000,000: 25%
- Rp 500,000,001 - 5,000,000,000: 30%
- Above Rp 5,000,000,000: 35%

**PTKP values (as of 2024 — verify if updated for 2026):**

| Status | Annual PTKP |
|--------|-------------|
| TK/0 | Rp 54,000,000 |
| TK/1 | Rp 58,500,000 |
| TK/2 | Rp 63,000,000 |
| TK/3 | Rp 67,500,000 |
| K/0 | Rp 58,500,000 |
| K/1 | Rp 63,000,000 |
| K/2 | Rp 67,500,000 |
| K/3 | Rp 72,000,000 |

**No NPWP penalty:** Employees without NPWP pay 20% higher PPh 21 (multiply calculated tax by 1.2). Flag this in the Employee model and apply multiplier in the calculation engine.

**Biaya Jabatan deduction:** 5% of annual gross, capped at Rp 6,000,000/year (Rp 500,000/month). Deducted before applying PTKP.

### BPJS Rates (Verify for 2026)

**BPJS Kesehatan:**
- Employee: 1% of (gaji pokok + tunjangan tetap), max basis Rp 12,000,000/month
- Employer: 4% of (gaji pokok + tunjangan tetap), max basis Rp 12,000,000/month

**BPJS Ketenagakerjaan:**

| Program | Employer | Employee | Notes |
|---------|----------|----------|-------|
| JHT | 3.7% | 2.0% | No salary cap |
| JKK | 0.24% - 1.74% | 0% | Office work (PT SAN): likely 0.24%. Confirm with company |
| JKM | 0.30% | 0% | No salary cap |
| JP | 2.0% | 1.0% | Salary cap ~Rp 10,042,300/month (adjust annually). **Verify current cap** |

**PPh 21 chain:** Employee JHT + JP contributions are deducted from gross income before applying PTKP. Missing this step produces incorrect tax — a common and critical error.

### Indonesian Leave Types (UU 13/2003 + UU Cipta Kerja)

Store these in a `leave_types` seed table. Each type must have: name, is_paid, default_quota (null = unlimited), requires_attachment, gender_specific.

| Leave Type | Name | Entitlement | Paid |
|------------|------|-------------|------|
| Annual leave | Cuti Tahunan | 12 days/year (after 12 months service) | Yes |
| Sick leave | Cuti Sakit | As needed with surat dokter | Yes (tiered reduction for extended sick) |
| Maternity | Cuti Melahirkan | 3 months | Yes |
| Miscarriage | Cuti Keguguran | 1.5 months | Yes |
| Menstrual | Cuti Haid | 2 days/month | Yes |
| Marriage | Cuti Menikah | 3 days | Yes |
| Child's marriage | Cuti Pernikahan Anak | 2 days | Yes |
| Child's circumcision/baptism | Cuti Khitanan/Pembaptisan Anak | 2 days | Yes |
| Family death (inti) | Cuti Kematian (spouse, parent, child) | 2 days | Yes |
| Family death (extended) | Cuti Kematian (other family) | 1 day | Yes |
| Overtime / rest day work | Lembur | By approval | Compensated at 1.5x-2x hourly rate |

### THR (Tunjangan Hari Raya)

**Legal basis:** Permenaker No. 6/2016

- Eligibility: >= 1 month of service
- Amount (>= 12 months): 1x monthly salary (gaji pokok + tunjangan tetap)
- Amount (1-12 months): prorated by masa kerja: (months / 12) x monthly salary
- Payment deadline: 7 days before the religious holiday
- Which holiday: based on `agama` field in Employee record
- Tax treatment: THR added to gross income in the month paid; changes TER bracket for that month

**Implementation:** Integrate THR as a special income component in the normal monthly payroll run for the relevant month. Do not build a separate THR payroll system.

### Work Schedule Concept (Required for Attendance)

A base work schedule model (jam masuk, jam pulang, hari kerja per week) is required before late/early/overtime can be calculated. Start with a single company-wide schedule. Overtime hourly rate = baseSalary / 173 (standard for 40-hour/week schedule). Overtime rates: 1.5x first hour, 2x subsequent hours on workdays.

---

## Implications for Roadmap

Based on module dependencies identified in ARCHITECTURE.md:

### Phase 0: Foundation (Auth, Settings, Layout)

**Rationale:** Nothing can be demoed or built without login working and roles enforced. Infrastructure issues (connection pooling, file storage, timezone utilities) kill later modules if not solved here.

**Delivers:**
- NextAuth.js v5 with credentials provider, role in JWT/session, type augmentation
- Dashboard layout (sidebar, header, breadcrumbs, RoleGate component)
- Prisma setup with singleton pattern + PgBouncer/Prisma Accelerate connection pooler
- Vercel Blob integration (used by Employee Documents and Recruitment later)
- Formatting utilities: `formatRupiah()`, `formatDateIndonesian()`, `APP_TIMEZONE = 'Asia/Jakarta'`
- Department, Position, OfficeLocation CRUD (needed by Employee Data)
- Seed: Super Admin account, PT SAN departments, initial leave types

**Avoids:** CRIT-4 (connection exhaustion), HIGH-2 (auth role issues), HIGH-4 (file upload filesystem problem), MED-5 (locale formatting scattered across codebase)

**Research flag:** Standard patterns. No additional research needed.

---

### Phase 1: Employee Data Management

**Rationale:** Every subsequent module references the Employee entity. Payroll needs `baseSalary` and `maritalStatus`. Attendance needs `officeLocationId`. Recruitment ends with creating an Employee. Build this fully before anything else.

**Delivers:**
- Employee CRUD with all Indonesian fields (NIK, agama, PTKP status, NPWP flag, BPJS numbers, PKWT/PKWTT contract type)
- Document upload (KTP, NPWP, contracts) to Vercel Blob with signed URL access
- Emergency contacts
- Role-based data scoping (HR Admin: all, Manager: department, Employee: self)
- PKWT contract expiry alerts
- Department/Position master data

**Uses:** `@vercel/blob`, `zustand` (multi-step employee creation form), Zod schemas with NIK validation (16 digits), `maritalStatus` enum for PPh 21

**Avoids:** CRIT-2 (PTKP field design), MED-5 (locale formatting)

**Research flag:** Standard CRUD patterns. No additional research needed.

---

### Phase 2: Attendance and Leave

**Rationale:** Payroll depends on overtime hours and absence data from Attendance. Must be complete and correct before Payroll is built.

**Delivers:**
- Clock-in/clock-out with IP validation (primary) and GPS geofencing via `geolib` (secondary)
- `date-fns-tz` timezone utility: store UTC, display WIB — enforced throughout
- Leave request submission with all 11 Indonesian leave types
- Two-level approval workflow (Employee > Manager/HR)
- Leave balance tracking with overlap validation and cancellation restoration
- Monthly attendance recap feeding payroll (overtime hours, absent days)
- Holiday calendar management

**Avoids:** HIGH-1 (timezone mismatch), HIGH-5 (leave balance edge cases), MED-1 (IP/GPS fails silently)

**Research flag:** GPS spoofing is a known limitation of web-based attendance. Document this limitation in the thesis — it is expected and acceptable at this scope.

---

### Phase 3: Payroll

**Rationale:** Depends on Employee (salary, PTKP) and Attendance (overtime hours, absences). Must be built last. PPh 21 is the highest-complexity feature in the entire system.

**Delivers:**
- BPJS calculation service with salary cap enforcement (`Math.min(salary, cap)`)
- PPh 21 calculation engine as isolated pure function (`pph21.service.ts`) with unit tests against DJP reference values
- TER method (Jan-Nov) + December annualization true-up
- Payroll batch runner with DRAFT > CALCULATED > FINALIZED state machine
- PayrollItem stores complete snapshot of all values (denormalized, immutable once finalized)
- THR integration as a payroll component for the relevant month
- Payslip PDF via `@react-pdf/renderer` (note: PDF templates use `StyleSheet.create()`, not Tailwind)
- Monthly payroll summary report + Excel export via `xlsx`
- Payroll draft/preview before finalization

**Avoids:** CRIT-1 (PPh 21 errors), CRIT-3 (BPJS cap errors), CRIT-5 (race conditions), MED-3 (missing audit trail)

**Research flag:** PPh 21 TER rate table values need verification against official DJP publication (Lampiran PP 58/2023) and any 2026 updates before implementation. BPJS caps need verification against current official rates. This is the one phase where getting real PT SAN payroll data (anonymized) for comparison testing is strongly recommended.

---

### Phase 4: Recruitment

**Rationale:** Most independent module — only touches Employee at the end (hiring). Can be built after Payroll or in parallel with Attendance if developer capacity allows.

**Delivers:**
- Job posting CRUD (internal, no public career page)
- Candidate application tracking with full pipeline status
- Interview scheduling with notes
- Offer letter PDF generation via `@react-pdf/renderer` (reuses PDF infrastructure from Payroll)
- Convert hired candidate to Employee record (pre-populates form)

**Avoids:** HIGH-3 (Puppeteer PDF on Vercel — already solved in Payroll phase with @react-pdf/renderer)

**Research flag:** Standard patterns. No additional research needed.

---

### Phase Ordering Rationale

The order is driven by data dependencies:
- Employee is the central entity — referenced by every other module
- Attendance overtime data is a required input to Payroll calculation
- Payroll is the most complex, riskiest, and most scrutinized module — build last when all dependencies are stable
- Recruitment is the most isolated — defer it or parallelize with Attendance

This order also minimizes rework: building Payroll before Attendance would require stubbing attendance data, which then has to be replaced with real integration later.

---

### Research Flags Summary

| Phase | Research Needed | Reason |
|-------|----------------|--------|
| Phase 0 | No | Standard Next.js + Prisma + NextAuth setup |
| Phase 1 | No | Standard CRUD with documented Indonesian fields |
| Phase 2 | No (document GPS limitations) | Attendance patterns well-established; GPS limitation is expected |
| Phase 3 | YES — before coding | PPh 21 TER rate table and BPJS caps for 2026 must be verified against official sources before any calculation code is written |
| Phase 4 | No | Standard pipeline pattern; PDF library already chosen |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core stack is established. HRMS-specific library choices (@react-pdf/renderer, decimal.js, date-fns-tz, geolib) are well-documented and stable. Verify SheetJS npm distribution method before using xlsx. |
| Features | MEDIUM | Feature categories (table stakes vs differentiators vs anti-features) are HIGH confidence. Indonesian law specifics (leave entitlements, BPJS rates, PTKP values) are MEDIUM — regulations are well-documented but may have 2025/2026 updates. |
| Architecture | MEDIUM | Next.js App Router patterns are stable and well-established. Module dependency order and data model design are HIGH confidence. Specific Prisma/NextAuth v5 APIs should be verified against current docs (v5 was in beta as of training data). |
| Pitfalls | HIGH (patterns) / MEDIUM (specific numbers) | The categories of risk are highly reliable (connection pooling, serverless constraints, PPh 21 complexity). Specific tax rates and BPJS caps need live verification for 2026. |

**Overall confidence:** MEDIUM

---

### Gaps to Address Before Implementation

These items cannot be resolved from training data and require manual verification:

1. **2026 PPh 21 TER rate table** — Source from DJP Lampiran PP 58/2023 and check for any 2025/2026 PMK updates. The entire January-November payroll calculation depends on this lookup table.

2. **2026 PTKP values** — Current values (TK/0 = Rp 54,000,000) have been stable since 2016 but should be confirmed against the latest PP before implementation.

3. **2026 JP (Jaminan Pensiun) salary cap** — Adjusts annually (was ~Rp 10,042,300 in 2024). Verify current cap from BPJS Ketenagakerjaan official site.

4. **2026 BPJS Kesehatan salary cap** — Confirm Rp 12,000,000/month maximum basis is still current.

5. **JKK risk class for PT SAN** — Office/collection management industry. Likely Risk Class I (0.24%) but confirm with the company. Wrong rate affects every employer BPJS calculation.

6. **NextAuth v5 stable release** — As of training data, v5 was still in beta under `next-auth@5`. Verify the current stable package name (`next-auth@5` vs `@auth/nextjs`) and check for any breaking changes in the final release.

7. **UU Cipta Kerja leave amendments** — Verify whether any leave entitlements in UU 13/2003 were materially changed by UU Cipta Kerja No. 6/2020 beyond what is documented in FEATURES.md.

8. **PT SAN's actual company policies** — Prorate method (calendar days vs working days), annual leave carryover policy, leave during probation policy, WFH approval mechanism. These are business rules that must be decided with the client before implementation.

---

## Sources

### Primary (architecture/library patterns — HIGH confidence)
- Training knowledge of Next.js 14 App Router documentation patterns
- Training knowledge of Prisma ORM documentation (connection pooling, migrations, Decimal type)
- Training knowledge of NextAuth.js v5 / Auth.js patterns
- Training knowledge of `@react-pdf/renderer`, `decimal.js`, `date-fns-tz`, `geolib` libraries

### Secondary (Indonesian regulatory — MEDIUM confidence)
- UU No. 13 Tahun 2003 (Ketenagakerjaan) — leave entitlements
- UU No. 6 Tahun 2020 (Cipta Kerja) + PP 35/2021 — PKWT/PKWTT rules, leave amendments
- PP No. 58 Tahun 2023 + PMK No. 168 Tahun 2023 — PPh 21 TER method
- Permenaker No. 6 Tahun 2016 — THR rules
- BPJS Kesehatan and BPJS Ketenagakerjaan rate regulations (training data, 2024 values)
- KEP.102/MEN/VI/2004 — overtime calculation standard

### Tertiary (verify before use)
- PTKP values — stable since 2016, but confirm for 2026 tax year
- JP salary cap — adjusts annually, 2024 value used here
- TER rate table values — must be sourced directly from DJP Lampiran PP 58/2023

---

*Research completed: 2026-02-27*
*Ready for roadmap: yes*
