# Pitfalls Research: HRMS PT. Sinergi Asta Nusantara

**Domain:** Human Resource Management System (Indonesian payroll/attendance)
**Stack:** Next.js 14 App Router, PostgreSQL 16 + Prisma, NextAuth.js v5, Vercel
**Researched:** 2026-02-27
**Overall confidence:** MEDIUM (based on training data; WebSearch/WebFetch unavailable for live verification)

> **Confidence note:** Web research tools were unavailable during this research. All findings are based on training knowledge (cutoff May 2025). Indonesian tax rates, BPJS rates, and Prisma/NextAuth APIs should be verified against official sources before implementation. The *patterns* of pitfalls are stable; the *exact numbers* may have changed for 2026 tax year.

---

## Critical Pitfalls (Will Break the System)

### CRIT-1: PPh 21 Annualization Logic Errors

**What goes wrong:** PPh 21 (Indonesian income tax) requires annualizing monthly income to determine the progressive tax bracket, then de-annualizing back to monthly. Teams commonly make one or more of these mistakes:
1. **Flat monthly rate instead of annualization** -- applying tax rates directly to monthly income produces wrong amounts at bracket boundaries
2. **Wrong annualization for mid-year hires** -- an employee who joins in July should have income annualized over 6 months (multiply by 12/6), not 12 months. Using 12 months under-taxes them.
3. **December correction missing** -- the last month of the year must reconcile actual annual tax vs. sum of monthly withholdings. Skipping this means employees overpay or underpay for the year.
4. **Net vs. gross method confusion** -- PPh 21 can be calculated on gross (employee bears tax) or gross-up/net (employer bears tax). Mixing these in the same calculation produces nonsensical results.

**Warning signs:**
- Tax amounts look identical for employees at different salary levels near bracket boundaries
- December payslip shows a wildly different tax amount (either huge or negative) compared to other months
- Mid-year hire tax amounts match full-year employees at the same salary

**Prevention:**
- Implement a dedicated `calculatePPh21()` function with explicit parameters: `monthlyTaxableIncome`, `monthsWorked`, `ptkpStatus`, `method` (gross/net/grossup)
- Write unit tests with known correct values from official DJP (Direktorat Jenderal Pajak) examples
- Test edge cases: first month, mid-year hire, December reconciliation, bracket boundary salaries
- Store the full calculation breakdown per payslip (not just final number) for audit trail

**Phase to address:** Payroll module -- must be correct from the first payroll run. Build calculation engine with tests BEFORE building the UI.

**Severity:** CRITICAL -- incorrect tax withholding creates legal liability for PT SAN

---

### CRIT-2: PTKP Tier Lookup Errors

**What goes wrong:** PTKP (Penghasilan Tidak Kena Pajak / non-taxable income) depends on marital status and number of dependents. The tiers are:
- TK/0 (single, no dependents): Rp 54,000,000/year
- K/0 (married, no dependents): Rp 58,500,000/year
- K/1: Rp 63,000,000/year
- K/2: Rp 67,500,000/year
- K/3: Rp 72,000,000/year

Common mistakes:
1. **Hardcoding values without a lookup table** -- when rates change (and they do change periodically), every calculation is wrong
2. **Not capping dependents at 3** -- PTKP maxes out at 3 dependents. Adding more dependents should not reduce tax further.
3. **Ignoring K/I category** -- married employees whose spouse also works use a different PTKP path
4. **Not updating PTKP when employee status changes mid-year** -- marriage or new child should trigger PTKP recalculation

**Warning signs:**
- Employee with 5 dependents gets lower tax than employee with 3 dependents at same salary
- PTKP values are scattered across codebase instead of in a config table

**Prevention:**
- Create a `ptkp_rates` database table or config file with year, status code, and amount
- Validate that dependents cap at 3 in the employee data model (Zod schema)
- Write a lookup function that takes `(year, maritalStatus, dependentCount)` and returns the correct PTKP
- Log which PTKP value was used in each payslip calculation for audit

**Phase to address:** Employee Data module (status fields) + Payroll module (calculation)

**Severity:** CRITICAL -- wrong PTKP = wrong tax = legal liability

> **Confidence:** MEDIUM on exact 2026 PTKP amounts. The values listed above are from 2024-2025 rates. Verify against PP (Peraturan Pemerintah) for 2026 tax year before implementation.

---

### CRIT-3: BPJS Calculation Rate and Cap Errors

**What goes wrong:** BPJS has multiple programs with different rates and salary caps:

**BPJS Kesehatan (Health):**
- Rate: 5% of salary (4% employer, 1% employee)
- Salary cap: Rp 12,000,000/month (as of 2024 -- VERIFY for 2026)
- Minimum: based on UMP (provincial minimum wage)

**BPJS Ketenagakerjaan (Employment):**
- JHT (Jaminan Hari Tua): 5.7% (3.7% employer, 2% employee)
- JKK (Jaminan Kecelakaan Kerja): 0.24%-1.74% depending on industry risk class
- JKM (Jaminan Kematian): 0.30% employer
- JP (Jaminan Pensiun): 3% (2% employer, 1% employee) -- salary cap Rp 10,042,300/month (as of 2024 -- VERIFY)

Common mistakes:
1. **Ignoring salary caps** -- BPJS Kesehatan and JP have salary ceilings. Calculating on full salary for high earners overcharges.
2. **Wrong JKK risk class** -- collection management is likely risk class II or III, not class I. Using the wrong class means wrong employer contribution.
3. **Not separating employer vs. employee portions** -- the payslip must show both. Lumping them together is incorrect.
4. **Forgetting that BPJS Ketenagakerjaan employee portion (JHT + JP) is deductible from gross for PPh 21** -- this affects the tax calculation chain.

**Warning signs:**
- High-salary employees have disproportionately large BPJS deductions
- PPh 21 calculation does not subtract employee BPJS contributions before computing taxable income
- JKK rate does not match company's industry classification

**Prevention:**
- Create a `bpjs_rates` config table with: program, year, employer_rate, employee_rate, salary_cap, risk_class
- Apply `Math.min(salary, cap)` before rate multiplication
- Confirm PT SAN's JKK risk class with the company (collection management industry)
- In PPh 21 calculation, explicitly subtract employee-portion BPJS (JHT + JP) from gross income before annualization
- Unit test: employee with salary above cap should have same BPJS amount as employee at exactly the cap

**Phase to address:** Payroll module. BPJS config should be set up during Employee Data phase (company settings).

**Severity:** CRITICAL -- affects both employee take-home pay and company's BPJS compliance

> **Confidence:** MEDIUM on exact 2026 caps and rates. Pattern of calculation is stable; specific numbers must be verified.

---

### CRIT-4: Prisma Connection Exhaustion on Vercel Serverless

**What goes wrong:** Each Vercel serverless function invocation can create a new Prisma Client instance, which opens its own database connection pool. With concurrent requests, this quickly exhausts PostgreSQL's connection limit (typically 20-100 depending on plan). Symptoms:
- `Too many connections` errors under moderate load
- Random 500 errors that "fix themselves" (when functions are garbage collected)
- Database becomes unresponsive during payroll batch processing

**Warning signs:**
- Works perfectly in development, fails in production under load
- Intermittent database errors that correlate with traffic spikes
- Payroll run for all employees fails partway through

**Prevention:**
1. **Use Prisma Accelerate or PgBouncer** -- a connection pooler is mandatory for serverless. Prisma Accelerate is the first-party solution; alternatively use Supabase's built-in pgbouncer or a self-hosted PgBouncer.
2. **Singleton Prisma Client pattern** -- ensure only one PrismaClient instance per serverless function lifecycle:
   ```typescript
   // lib/prisma.ts
   import { PrismaClient } from '@prisma/client'

   const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

   export const prisma = globalForPrisma.prisma ?? new PrismaClient()

   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
   ```
3. **Set connection_limit in DATABASE_URL** -- `?connection_limit=5` to limit per-instance connections
4. **Use a managed database with pooling** -- Supabase, Neon, or Railway all offer built-in connection pooling suitable for serverless

**Phase to address:** Infrastructure setup (Phase 1). This must be correct from day one.

**Severity:** CRITICAL -- system becomes unusable under real multi-user load

**Confidence:** HIGH -- this is a well-documented, consistent issue with Prisma + Vercel

---

### CRIT-5: Payroll Calculation Race Conditions

**What goes wrong:** If two HR admins trigger payroll calculation for the same period simultaneously, or if payroll processing takes long and the user retries, you get:
- Duplicate payslip records for the same employee/period
- Partial payroll runs (some employees processed twice, others missed)
- Inconsistent totals that don't reconcile

**Warning signs:**
- Duplicate entries in payroll table for same employee + same period
- Payroll total doesn't match sum of individual payslips
- Users complain that "running payroll again gave different numbers"

**Prevention:**
1. **Database unique constraint** on `(employee_id, payroll_period)` -- prevents duplicate records at the DB level
2. **Payroll run status machine** -- create a `payroll_runs` table with states: `DRAFT -> PROCESSING -> COMPLETED -> LOCKED`. Only one run can be in `PROCESSING` for a given period.
3. **Optimistic locking** -- check status before processing, use `WHERE status = 'DRAFT'` in the update query
4. **Idempotent calculation** -- `upsert` instead of `create` for individual payslip records
5. **UI: disable the "Run Payroll" button** while processing is in progress, show status

**Phase to address:** Payroll module design. The data model for payroll_runs must be designed upfront.

**Severity:** CRITICAL -- duplicate or inconsistent payroll causes real financial harm

---

## High-Priority Pitfalls (Will Cause Significant Issues)

### HIGH-1: Timezone Mismatch in Attendance (WIB vs UTC)

**What goes wrong:** Vercel serverless functions run in UTC. Jakarta is UTC+7 (WIB). If you store or compare timestamps without explicit timezone handling:
- An employee clocking in at 08:00 WIB (01:00 UTC) gets recorded as "January 1" when it's actually "January 1" in Jakarta but might cross date boundaries
- Worse: clock-in at 00:30 WIB (17:30 UTC previous day) gets attributed to the wrong date
- Attendance reports show wrong dates for early morning or late night entries
- Late/on-time calculations are wrong if compared against UTC times

**Warning signs:**
- Attendance records show wrong dates for employees who clock in early morning
- "On time" calculations seem off by hours
- Works correctly in local dev (where Node runs in system timezone) but wrong in production

**Prevention:**
1. **Store all timestamps as UTC in the database** (PostgreSQL `timestamptz`)
2. **Convert to WIB only at display time** using a consistent timezone utility
3. **For date-based queries (today's attendance), convert date boundaries to UTC first:**
   ```typescript
   // "Today" in WIB
   const startOfDayWIB = new Date('2026-02-27T00:00:00+07:00') // = 2026-02-26T17:00:00Z
   const endOfDayWIB = new Date('2026-02-27T23:59:59+07:00')   // = 2026-02-27T16:59:59Z
   ```
4. **Use a date library** -- `date-fns-tz` or `luxon` for timezone-aware operations. Do NOT use bare `new Date()` for business logic.
5. **Set application timezone constant:** `const APP_TIMEZONE = 'Asia/Jakarta'` -- never hardcode `+07:00` offsets

**Phase to address:** Attendance module. Timezone utility should be built in infrastructure phase.

**Severity:** HIGH -- wrong attendance data undermines system credibility and affects payroll (overtime, late deductions)

---

### HIGH-2: NextAuth.js v5 Session and Role Management

**What goes wrong:** NextAuth.js v5 (Auth.js) has significant API changes from v4. Common mistakes:
1. **Role not included in session/JWT by default** -- you must explicitly add `role` to the token in the `jwt` callback and to the session in the `session` callback. Forgetting this means `session.user.role` is undefined.
2. **Middleware route protection is limited** -- NextAuth v5 middleware can check if authenticated but cannot easily check roles. Teams try to put role-based logic in middleware and hit limitations.
3. **TypeScript type augmentation missing** -- `session.user.role` will throw TS errors unless you augment the `Session` and `JWT` types in `next-auth.d.ts`
4. **Credentials provider returns null without clear error** -- if your `authorize()` function has a subtle error, it silently returns null and the user just sees "login failed" with no debugging info

**Warning signs:**
- `session.user.role` is always `undefined` in components
- Middleware blocks/allows incorrectly
- TypeScript errors on `session.user.role` or `session.user.id`
- Login silently fails with no error messages in console

**Prevention:**
1. **Set up type augmentation immediately:**
   ```typescript
   // types/next-auth.d.ts
   import { DefaultSession } from 'next-auth'
   declare module 'next-auth' {
     interface Session {
       user: { id: string; role: string } & DefaultSession['user']
     }
     interface User { role: string }
   }
   declare module 'next-auth/jwt' {
     interface JWT { role: string }
   }
   ```
2. **Explicitly pass role through callbacks:**
   ```typescript
   callbacks: {
     jwt({ token, user }) {
       if (user) token.role = user.role
       return token
     },
     session({ session, token }) {
       session.user.role = token.role
       session.user.id = token.sub
       return session
     }
   }
   ```
3. **Use server-side checks for role-based access**, not middleware. Middleware should only check authentication (logged in or not). Role checks go in page components, layouts, or API routes.
4. **Add verbose logging in the `authorize()` function** during development

**Phase to address:** Authentication phase (Phase 1). Get this right before building any role-dependent features.

**Severity:** HIGH -- broken auth blocks all subsequent development

**Confidence:** HIGH -- these are well-documented v5 patterns

---

### HIGH-3: PDF Generation Fails on Vercel Serverless

**What goes wrong:** Puppeteer and headless Chrome do not work on Vercel serverless functions due to:
- Binary size exceeds Vercel's 50MB function size limit
- Serverless has no persistent filesystem to store Chrome binary
- Cold start with Chrome would be extremely slow even if it worked

Teams discover this only at deployment time after building their entire PDF pipeline locally with Puppeteer.

**Warning signs:**
- PDF generation works perfectly in local development
- Deployment fails with function size errors
- Or deploys but times out / crashes when generating PDF

**Prevention:**
Choose one of these approaches from the start:
1. **`@react-pdf/renderer`** (RECOMMENDED for this project) -- generates PDFs entirely in JavaScript, no browser needed. Works on serverless. Good for structured documents like payslips and offer letters.
2. **`jsPDF` + `jsPDF-AutoTable`** -- lightweight, works on serverless. Better for simple tabular documents.
3. **External PDF API** (e.g., Gotenberg, html-pdf-chrome as a separate service) -- only if you need pixel-perfect HTML-to-PDF. Adds infrastructure complexity.

Do NOT use:
- `puppeteer` / `playwright` on Vercel (won't work)
- `html-pdf` (uses PhantomJS, deprecated and broken on serverless)
- `wkhtmltopdf` (requires system binary)

**Phase to address:** Decide in Architecture phase. Implement in Payroll (payslips) and Recruitment (offer letters) phases.

**Severity:** HIGH -- discovering this late means rewriting the entire PDF pipeline

**Confidence:** HIGH -- Vercel serverless limitations are well-established

---

### HIGH-4: File Upload on Vercel Serverless (No Persistent Filesystem)

**What goes wrong:** Vercel serverless functions have a read-only filesystem (except `/tmp`, which is ephemeral and limited to ~512MB). If you try to save uploaded files (employee documents, KTP scans, NPWP photos) to the local filesystem:
- Files are lost after the function invocation ends
- `/tmp` files disappear between requests
- `fs.writeFile` to project directories fails in production

**Warning signs:**
- File uploads work in development but files disappear in production
- Uploaded documents return 404 after a few minutes
- Inconsistent behavior (sometimes works due to warm functions)

**Prevention:**
1. **Use cloud storage from day one:**
   - **Vercel Blob** (simplest, integrated with Vercel)
   - **AWS S3** or **Cloudflare R2** (more control, but more setup)
   - **Supabase Storage** (if using Supabase for database)
2. **Upload flow pattern:**
   - Client uploads to a presigned URL (direct to storage, bypasses serverless size limits)
   - Store only the file URL/key in the database
   - Serve files via signed URLs with expiry for security (employee documents are sensitive)
3. **Set upload size limits** in Next.js config and in the upload handler
4. **Validate file types** server-side (not just by extension -- check magic bytes for PDFs, images)

**Phase to address:** Infrastructure phase. Storage integration must be ready before Employee Data module needs document uploads.

**Severity:** HIGH -- fundamental architecture decision that affects multiple modules

---

### HIGH-5: Leave Balance Calculation Edge Cases

**What goes wrong:** Leave balance management has more edge cases than teams expect:
1. **Proration for mid-year hires** -- employee joins in August, gets 5/12 of annual leave, but what's the rounding rule? Ceil, floor, or round?
2. **Carry-over rules** -- unused leave carries over to next year (with a cap? with expiry?)
3. **Overlapping leave requests** -- employee submits two leave requests covering the same dates. Without validation, their balance is double-deducted.
4. **Approved then cancelled** -- employee's leave is approved, then later cancelled. Balance must be restored.
5. **Leave during probation** -- some companies don't grant leave during probation period
6. **Negative balance** -- can an employee go negative? What happens if a manager approves leave beyond the balance?

**Warning signs:**
- Leave balance goes negative unexpectedly
- Employee can submit overlapping leave requests
- Cancelled leave doesn't restore balance
- No clear policy encoded for proration rules

**Prevention:**
1. **Define business rules with PT SAN upfront** -- document: proration method, carry-over policy, probation rules, negative balance policy
2. **Validate overlapping dates in the submission handler:**
   ```sql
   SELECT COUNT(*) FROM leave_requests
   WHERE employee_id = ?
   AND status IN ('PENDING', 'APPROVED')
   AND daterange(start_date, end_date, '[]') && daterange(?, ?, '[]')
   ```
3. **Calculate balance dynamically** from transactions (grants + carry-overs - approved leaves + cancellation restorations) rather than maintaining a running counter that can desync
4. **Add a `leave_transactions` ledger table** -- every balance change is a transaction with type, amount, and reference

**Phase to address:** Attendance/Leave module. Business rules must be clarified before implementation.

**Severity:** HIGH -- incorrect leave balances erode employee trust in the system

---

## Medium Pitfalls (Will Cause Annoyance or Technical Debt)

### MED-1: GPS/IP Attendance Restriction Fails Silently

**What goes wrong:**
- **GPS:** Browser geolocation API requires HTTPS and explicit user permission. If denied, the system can't verify location. Teams often don't handle the "permission denied" case gracefully.
- **IP restriction:** If using Vercel, the server sees Vercel's edge/proxy IP, not the client's real IP. You must read `x-forwarded-for` or Vercel's `x-real-ip` header, and even then, employees behind corporate NAT all share one IP.
- **GPS spoofing:** Determined employees can fake GPS coordinates using browser dev tools or phone GPS spoofing apps. There is no perfect prevention for web-based GPS.

**Warning signs:**
- All employees appear to have the same IP address
- GPS check passes even when employee is clearly not in office
- Clock-in fails for employees who denied location permission with no helpful error message

**Prevention:**
1. **Read IP from `request.headers.get('x-forwarded-for')` or `x-real-ip`** in Vercel context
2. **Handle GPS permission denial gracefully** -- show clear message, potentially fall back to IP-only check
3. **Accept that GPS is "good enough" deterrence, not perfect security** -- document this limitation in the thesis. Web-based attendance cannot match biometric accuracy.
4. **Store both GPS coordinates AND IP with each clock-in** for audit trail regardless of which check is active
5. **Make office locations configurable** -- don't hardcode IP ranges or GPS coordinates

**Phase to address:** Attendance module

**Severity:** MEDIUM -- it's a deterrent, not a security system. Thesis should acknowledge limitations.

---

### MED-2: Next.js App Router Server/Client Component Confusion

**What goes wrong:** Teams mix server and client component patterns incorrectly:
1. **Using `useState`/`useEffect` in server components** -- causes cryptic build errors
2. **Putting `'use client'` on everything** -- loses SSR benefits, increases client bundle
3. **Trying to use Prisma in client components** -- Prisma can only run on the server
4. **Props serialization errors** -- passing non-serializable objects (Date, Prisma models with methods) from server to client components

**Warning signs:**
- "useState is not a function" errors
- Hydration mismatch warnings
- Client bundle is massive (contains code that should be server-only)
- Dates display as `[object Object]` or show hydration errors

**Prevention:**
1. **Rule of thumb:** default to Server Components. Add `'use client'` only when you need browser APIs (useState, onClick, etc.)
2. **Pattern: Server component fetches data, passes to client component for interactivity:**
   ```
   page.tsx (server) --> fetches data with Prisma
     └── DataTable.tsx (client, 'use client') --> receives serialized data as props
   ```
3. **Serialize dates to ISO strings** before passing to client components
4. **Use Server Actions** for mutations instead of API routes where possible
5. **Keep Prisma imports in server-only files** -- add `import 'server-only'` to database utility files

**Phase to address:** Phase 1 (project scaffold). Establish patterns before building features.

**Severity:** MEDIUM -- causes development friction and bugs, but fixable with discipline

---

### MED-3: Payroll Audit Trail Missing

**What goes wrong:** Payroll calculations are run, but there's no record of:
- What rates/formulas were used for a given month
- Who triggered the payroll run and when
- What the input values were (base salary, allowances at that point in time)
- Whether the payslip was recalculated or edited after initial generation

When an employee disputes their payslip 3 months later, there's no way to reconstruct what happened.

**Warning signs:**
- No `payroll_runs` table with metadata
- Payslip only stores final amounts, not calculation inputs
- No timestamp of when payroll was processed
- Salary changes retroactively affect past payslips (because payslip references current salary, not point-in-time salary)

**Prevention:**
1. **Snapshot salary data at payroll time** -- payslip record should contain the base salary, allowances, and rates USED for that calculation, not foreign keys to current values
2. **Create `payroll_runs` table:** run_id, period, status, triggered_by, triggered_at, completed_at, notes
3. **Link each payslip to a payroll run**
4. **Store calculation breakdown:** gross, each deduction line, each BPJS line, taxable income, PPh 21, net pay -- all as columns or JSON
5. **Make completed payroll runs immutable** -- require a new "correction run" rather than editing

**Phase to address:** Payroll module data model design

**Severity:** MEDIUM -- not a functional bug, but critical for real-world trust and compliance

---

### MED-4: Prisma Migration Conflicts and Schema Drift

**What goes wrong:**
- Running `prisma db push` in production instead of `prisma migrate deploy` -- causes untracked schema changes
- Editing migration SQL files after they've been applied -- Prisma detects drift and refuses to migrate
- Not committing migration files to git -- different environments have different schemas
- Adding required fields without defaults to existing tables -- migration fails on non-empty tables

**Warning signs:**
- "Migration history is not in sync" errors
- Schema works on one machine but not another
- `prisma migrate deploy` fails in production CI/CD

**Prevention:**
1. **Use `prisma migrate dev` locally, `prisma migrate deploy` in production** -- never `db push` in production
2. **Always commit the `prisma/migrations/` folder** to git
3. **When adding required fields to existing tables:** add as optional first, backfill data, then make required in a subsequent migration
4. **Test migrations on a copy of production data** before deploying
5. **Add `prisma migrate deploy` to Vercel build command:**
   ```json
   "build": "prisma generate && prisma migrate deploy && next build"
   ```

**Phase to address:** Infrastructure phase. Establish migration discipline from the first schema.

**Severity:** MEDIUM -- causes deployment failures and dev environment issues

---

### MED-5: Indonesian Locale and Currency Formatting

**What goes wrong:**
- Displaying salary as `12000000` instead of `Rp 12.000.000` (Indonesian uses period as thousands separator, comma as decimal)
- Date formats: Indonesian standard is DD/MM/YYYY or DD MMMM YYYY, not MM/DD/YYYY
- Inconsistent Bahasa Indonesia labels -- mixing English and Indonesian terms

**Warning signs:**
- Numbers displayed without proper formatting
- Dates in American format
- Mixed language in the UI

**Prevention:**
1. **Create a formatting utility early:**
   ```typescript
   export function formatRupiah(amount: number): string {
     return new Intl.NumberFormat('id-ID', {
       style: 'currency', currency: 'IDR',
       minimumFractionDigits: 0
     }).format(amount)
   }

   export function formatDate(date: Date): string {
     return new Intl.DateTimeFormat('id-ID', {
       day: 'numeric', month: 'long', year: 'numeric'
     }).format(date)
   }
   ```
2. **Use `id-ID` locale consistently** -- both `Intl.NumberFormat` and `Intl.DateTimeFormat`
3. **Create a glossary of Indonesian HR terms** used in the UI for consistency
4. **Store monetary values as integers (cents/rupiah)** in the database to avoid floating point issues. Since IDR has no cents, store as whole Rupiah integers.

**Phase to address:** Infrastructure phase (utility functions). Enforce in every subsequent module.

**Severity:** MEDIUM -- looks unprofessional but functionally works

---

## Thesis-Specific Pitfalls

### THESIS-1: Scope Creep into Non-Essential Features

**What goes wrong:** The biggest killer of undergraduate thesis projects. Common scope creep areas for HRMS:
- Adding email notifications (requires SMTP setup, deliverability testing, templates)
- Building a dashboard with complex charts and analytics
- Implementing real-time notifications with WebSockets
- Adding multi-language support (English + Indonesian)
- Building an employee self-service portal with too many features
- Implementing performance management / KPI tracking

Each of these adds 1-3 weeks of work and is NOT required for the thesis.

**Warning signs:**
- Working on "nice to have" features while core modules are incomplete
- Spending days on dashboard visualizations before payroll calculation works
- Adding features not listed in the original requirements document
- Comparing the project to commercial HRMS products (Talenta, Gadjian)

**Prevention:**
1. **Print the Out of Scope list from PROJECT.md and tape it to your monitor**
2. **Core modules MUST be complete before any enhancement:** Employee Data -> Recruitment -> Attendance/Leave -> Payroll. In that order.
3. **MVP rule:** if a feature is not in the Active requirements list, it does not get built
4. **Time-box each module:** allocate specific weeks to each module and stick to it
5. **"Would my dosen penguji (thesis examiner) fail me without this?"** -- if no, skip it

**Phase to address:** Every phase. Constant vigilance.

**Severity:** CRITICAL for thesis success -- scope creep is the #1 reason thesis projects are late

---

### THESIS-2: Over-Engineering the Architecture

**What goes wrong:** Implementing enterprise patterns that are unnecessary for a thesis-scale HRMS:
- Full microservices architecture (use monolith -- Next.js is already full-stack)
- Complex event sourcing for payroll (simple state machine is fine)
- GraphQL when REST/Server Actions work fine
- Docker/Kubernetes when Vercel deploys automatically
- Complex CI/CD pipelines when Vercel has built-in deployment
- Abstract repository pattern with interfaces for "testability" when direct Prisma calls are clear enough

**Warning signs:**
- More time spent on architecture than features
- Files like `IEmployeeRepository`, `EmployeeRepositoryImpl`, `EmployeeService`, `EmployeeController` for a simple CRUD
- Premature optimization for "scale" the thesis project will never reach
- Docker compose files for local development when `npx prisma migrate dev && npm run dev` works

**Prevention:**
1. **Next.js App Router IS your architecture.** Server components fetch data, client components handle interaction, Server Actions handle mutations, API routes for anything that doesn't fit.
2. **Maximum 3 layers:** Route/Page -> Service function -> Prisma query. No more.
3. **No abstraction without duplication** -- don't create a repository interface until you have two implementations
4. **If it works with a simple function, don't make it a class**

**Phase to address:** Architecture decisions in Phase 1. Resist refactoring into complexity later.

**Severity:** HIGH for thesis -- wastes weeks on plumbing instead of features

---

### THESIS-3: Incomplete Module Syndrome

**What goes wrong:** Building 80% of all four modules instead of 100% of each module sequentially. The thesis examiner sees:
- Employee CRUD works but can't upload documents
- Recruitment has job posting but no candidate pipeline
- Attendance clock-in works but leave management is half-done
- Payroll calculates salary but PPh 21 is hardcoded/wrong

Four incomplete modules is worse than three complete modules + one stub for the thesis defense.

**Warning signs:**
- Jumping between modules before finishing the current one
- "I'll come back to fix that" list growing longer
- Demo shows basic CRUD for all modules but complex workflows (leave approval, payroll run) are broken

**Prevention:**
1. **Sequential module completion** -- do not start the next module until the current one passes its acceptance criteria
2. **Define "done" for each module upfront:**
   - Employee Data: CRUD + documents + role-based visibility + search
   - Recruitment: full pipeline from posting to offer letter PDF
   - Attendance/Leave: clock-in + leave request + approval + balance tracking
   - Payroll: calculation + PPh 21 + BPJS + payslip PDF + monthly report
3. **Build in dependency order** -- Payroll needs Employee Data and Attendance. Recruitment is somewhat independent.
4. **If running out of time:** complete Employee Data + Payroll + Attendance/Leave fully. Recruitment can be simplified (it's the least coupled to Indonesian compliance requirements).

**Phase to address:** Project planning and milestone definition

**Severity:** HIGH for thesis -- examiners evaluate completeness of implemented features

---

### THESIS-4: Not Testing Payroll with Real Scenarios

**What goes wrong:** Payroll calculation is tested with one or two simple cases. Then during thesis defense or real use:
- Minimum wage employee has wrong calculations
- Employee with salary at a tax bracket boundary gets wrong tax
- Mid-year hire's December reconciliation is wildly off
- BPJS calculation for salary above cap is wrong

The examiner (or PT SAN) tries a realistic scenario and the numbers are wrong.

**Warning signs:**
- Only tested with round salary numbers (Rp 5,000,000, Rp 10,000,000)
- Never tested December reconciliation
- Never compared system output against manual calculation or existing payroll data

**Prevention:**
1. **Get sample payroll data from PT SAN** (anonymized) -- compare your system's output against their current calculation
2. **Test at least these salary levels:** minimum wage (UMK Jakarta), Rp 5jt, Rp 10jt, Rp 15jt (above BPJS cap), Rp 50jt (high bracket)
3. **Test all PTKP statuses:** TK/0, K/0, K/1, K/2, K/3
4. **Test full 12-month cycle** for at least one employee to verify December reconciliation
5. **Write automated unit tests** for the calculation function -- this is the one place where tests absolutely justify their cost

**Phase to address:** Payroll module -- testing phase

**Severity:** HIGH for thesis -- payroll accuracy is the most scrutinized aspect of an HRMS thesis

---

## Quick Reference

| # | Pitfall | Severity | Prevention Summary | Phase |
|---|---------|----------|-------------------|-------|
| CRIT-1 | PPh 21 annualization errors | Critical | Dedicated calc function + unit tests + DJP reference values | Payroll |
| CRIT-2 | PTKP tier lookup errors | Critical | Config table + cap dependents at 3 + type validation | Employee Data + Payroll |
| CRIT-3 | BPJS rate/cap errors | Critical | Config table + salary cap enforcement + correct deduction chain | Payroll |
| CRIT-4 | Prisma connection exhaustion on Vercel | Critical | Connection pooler (Prisma Accelerate/PgBouncer) + singleton pattern | Infrastructure (Phase 1) |
| CRIT-5 | Payroll race conditions | Critical | Unique constraints + status machine + idempotent upserts | Payroll data model |
| HIGH-1 | Timezone mismatch (WIB vs UTC) | High | Store UTC + convert at display + date-fns-tz | Infrastructure + Attendance |
| HIGH-2 | NextAuth v5 role management | High | Type augmentation + explicit callbacks + server-side role checks | Auth (Phase 1) |
| HIGH-3 | PDF generation fails on Vercel | High | Use @react-pdf/renderer, NOT Puppeteer | Architecture decision |
| HIGH-4 | File upload on serverless | High | Cloud storage (Vercel Blob/S3) from day one | Infrastructure |
| HIGH-5 | Leave balance edge cases | High | Transaction ledger + overlap validation + business rules doc | Attendance/Leave |
| MED-1 | GPS/IP restriction limitations | Medium | Read correct headers + handle permission denial + document limitations | Attendance |
| MED-2 | Server/Client component confusion | Medium | Default server components + established patterns | Phase 1 scaffold |
| MED-3 | Missing payroll audit trail | Medium | Snapshot values + payroll_runs table + immutable completed runs | Payroll data model |
| MED-4 | Prisma migration conflicts | Medium | migrate dev locally + migrate deploy in prod + commit migrations | Infrastructure |
| MED-5 | Indonesian locale formatting | Medium | Formatting utility with id-ID locale + integer currency storage | Infrastructure |
| THESIS-1 | Scope creep | Critical* | Stick to requirements list + sequential completion + time-boxing | All phases |
| THESIS-2 | Over-engineering | High* | 3-layer max + no premature abstraction + use Next.js conventions | Phase 1 |
| THESIS-3 | Incomplete modules | High* | Sequential completion + "done" criteria per module | Project planning |
| THESIS-4 | Untested payroll | High* | Real scenario testing + comparison with PT SAN data + unit tests | Payroll testing |

*Thesis severity = impact on thesis success, not system functionality

---

## Phase-Specific Pitfall Summary

| Phase | Top Pitfalls to Watch | Action Required |
|-------|----------------------|-----------------|
| Phase 1: Infrastructure | CRIT-4 (connections), HIGH-2 (auth), HIGH-4 (file storage), MED-4 (migrations) | Set up pooling, auth with roles, cloud storage, migration workflow |
| Phase 2: Employee Data | CRIT-2 (PTKP fields), MED-5 (formatting), HIGH-4 (document uploads) | Validate PTKP status fields, formatting utils, storage integration |
| Phase 3: Attendance/Leave | HIGH-1 (timezone), HIGH-5 (leave balance), MED-1 (GPS/IP) | Timezone utility, leave ledger, location verification with fallbacks |
| Phase 4: Payroll | CRIT-1 (PPh 21), CRIT-3 (BPJS), CRIT-5 (race conditions), MED-3 (audit trail) | Calculation engine with tests, rate configs, status machine, snapshots |
| Phase 5: Recruitment | HIGH-3 (PDF generation) | PDF library selection and offer letter template |
| All Phases | THESIS-1 (scope creep), THESIS-2 (over-engineering), THESIS-3 (incomplete modules) | Discipline, time-boxing, sequential completion |

---

## Sources and Confidence Notes

| Topic | Confidence | Source | Verification Needed |
|-------|-----------|--------|---------------------|
| PPh 21 calculation pattern | HIGH | Indonesian tax law (stable pattern) | Verify 2026 bracket rates with DJP |
| PTKP amounts | MEDIUM | Training data (2024-2025 values) | Verify current PP for 2026 tax year |
| BPJS rates and caps | MEDIUM | Training data (2024 values) | Verify 2026 rates with BPJS official site |
| Prisma + Vercel connection pooling | HIGH | Well-documented, stable issue | Check if Prisma 6.x changes this |
| NextAuth v5 patterns | HIGH | Auth.js documentation patterns | Verify against latest auth.js docs |
| Vercel serverless limitations | HIGH | Platform constraints (stable) | No change expected |
| @react-pdf/renderer on serverless | HIGH | Common serverless PDF pattern | Verify current version compatibility |
| Indonesian locale formatting | HIGH | Intl API (stable browser standard) | No verification needed |

> **Action item before implementation:** Verify all 2026 Indonesian tax/BPJS rates against official government publications (DJP for PPh 21/PTKP, BPJS official for contribution rates and salary caps). The calculation *patterns* documented here are correct; the specific *numbers* may have been updated for 2026.
