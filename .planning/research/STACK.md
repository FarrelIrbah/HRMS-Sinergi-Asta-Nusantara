# Stack Research: HRMS PT. Sinergi Asta Nusantara

**Researched:** 2026-02-27
**Mode:** Stack dimension -- HRMS-specific libraries within chosen stack
**Overall Confidence:** MEDIUM (training data only -- WebSearch/WebFetch/Context7 unavailable)

> **Caveat:** This research is based on training data (cutoff ~May 2025). All version numbers
> and library recommendations should be verified against npm/official docs before installation.
> No live verification was possible during this research session.

---

## Core Stack (Already Decided)

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14 (App Router) | Full-stack framework |
| TypeScript | 5.x | Type safety |
| PostgreSQL | 16 | Primary database |
| Prisma ORM | 5.x | Database access & migrations |
| Tailwind CSS | 3.x | Styling |
| shadcn/ui | latest | Component library |
| NextAuth.js | v5 (Auth.js) | Authentication |
| React Hook Form | 7.x | Form management |
| Zod | 3.x | Schema validation |
| Vercel | -- | Deployment platform |

No changes recommended to the core stack. It is well-suited for an HRMS application.

---

## HRMS-Specific Libraries

### 1. PDF Generation (Payslips, Offer Letters)

**Recommendation:** `@react-pdf/renderer` for structured document PDFs

| Option | Verdict | Rationale |
|--------|---------|-----------|
| **@react-pdf/renderer** | **USE THIS** | React-native syntax for PDF layout. Works server-side in Node.js (Next.js API routes / Server Actions). No browser dependency. Produces clean, styled PDFs. Perfect for payslip templates with consistent formatting. |
| puppeteer / playwright | AVOID | Requires headless Chromium -- too heavy for Vercel serverless. Works for HTML-to-PDF but adds ~300MB+ dependency. Not viable on Vercel's 50MB function size limit. |
| jsPDF | AVOID | Client-side oriented. Poor support for complex layouts, non-Latin characters (Indonesian diacritics). Not ideal for server-side generation. |
| pdfkit | ALTERNATIVE | Lower-level Node.js PDF generation. More control but more code. Use only if @react-pdf/renderer cannot handle a specific layout need. |
| pdf-lib | ALTERNATIVE | Good for modifying existing PDFs or filling PDF forms. Could complement @react-pdf/renderer if you need to fill pre-designed PDF templates. |

**Implementation pattern:**

```typescript
// app/api/payslip/[id]/route.ts (Route Handler)
import { renderToBuffer } from '@react-pdf/renderer';
import { PayslipDocument } from '@/lib/pdf/payslip-template';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const payslipData = await getPayslipData(params.id);
  const buffer = await renderToBuffer(<PayslipDocument data={payslipData} />);

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="payslip-${params.id}.pdf"`,
    },
  });
}
```

**Key consideration:** @react-pdf/renderer uses its own layout engine (yoga-layout), not CSS. Tailwind classes do NOT work inside PDF components. You must use the library's own `StyleSheet.create()` API. Plan separate style definitions for PDF templates.

**Confidence:** HIGH -- @react-pdf/renderer is the standard React PDF solution and is well-established.

---

### 2. Tax Calculation (Indonesian PPh 21)

**Recommendation:** Manual implementation with a dedicated utility module. No reliable npm library exists for this.

**Why manual:**
- Indonesian tax law (PPh 21) changes frequently (most recently the TER/Tarif Efektif Rata-rata system introduced January 2024)
- Any npm package would likely be outdated or unmaintained
- The calculation logic is domain-critical -- you need full control and auditability
- The tax brackets and PTKP values are configuration data, not library logic

**Implementation approach:**

```typescript
// lib/payroll/pph21/calculator.ts

// PPh 21 TER (Tarif Efektif Rata-rata) -- effective January 2024
// Reference: PP No. 58 Tahun 2023, PMK No. 168 Tahun 2023

export interface PPh21Input {
  grossMonthlyIncome: number;    // Penghasilan bruto bulanan
  ptkpCategory: PTKPCategory;     // TK/0, K/0, K/1, K/2, K/3
  isResident: boolean;            // NPWP holder / resident
  hasNPWP: boolean;               // 20% surcharge if no NPWP
}

export type PTKPCategory = 'TK/0' | 'TK/1' | 'TK/2' | 'TK/3'
                         | 'K/0' | 'K/1' | 'K/2' | 'K/3';

// PTKP values (as of 2024 -- verify against latest regulation)
const PTKP: Record<PTKPCategory, number> = {
  'TK/0': 54_000_000,
  'TK/1': 58_500_000,
  'TK/2': 63_000_000,
  'TK/3': 67_500_000,
  'K/0': 58_500_000,
  'K/1': 63_000_000,
  'K/2': 67_500_000,
  'K/3': 72_000_000,
};

// TER categories (A, B, C) based on PTKP status
// Store TER rate tables as configuration, not hardcoded
// This allows admin updates when regulations change
```

**Key design decisions:**
1. Store tax rate tables in the database (not hardcoded) so they can be updated without code deployment when regulations change
2. Log every calculation with inputs and outputs for audit trail
3. Support both the old progressive method and new TER method (company may need both for comparison/transition)
4. Include Biaya Jabatan (5% cap at Rp 500,000/month) and Iuran JHT deductions

**Supplementary library:** `decimal.js` or `dinero.js` for precise currency calculations. Floating point math will cause rounding errors in payroll.

**Confidence:** MEDIUM -- The manual approach is correct, but the specific TER rates and PTKP values from my training data should be verified against the latest PMK regulations before implementation.

---

### 3. File Upload (Employee Documents)

**Recommendation:** `uploadthing` for the upload infrastructure, with files stored in Vercel Blob or a similar S3-compatible store.

| Option | Verdict | Rationale |
|--------|---------|-----------|
| **uploadthing** | **RECOMMENDED** | Purpose-built for Next.js. Handles file validation, type checking, size limits. Clean API with both client and server components. Free tier sufficient for HRMS scale. |
| Vercel Blob | **ALTERNATIVE** | Native Vercel storage. Simpler API. Good if you want to stay fully within Vercel ecosystem. Use `@vercel/blob` package. |
| multer | AVOID | Express middleware. Does not work with Next.js App Router (no req.pipe). Would need custom adapter. |
| formidable | AVOID | Same issue as multer -- designed for Express/Node HTTP, not Next.js App Router. |
| AWS S3 direct | OVERKILL | More infrastructure to manage. Use only if you have specific AWS requirements. |

**For this project, I recommend Vercel Blob** over uploadthing because:
- PT SAN is already deploying on Vercel
- Fewer external dependencies
- Direct integration with Vercel infrastructure
- Simpler billing (part of Vercel plan)

**Implementation pattern:**

```typescript
// app/api/upload/route.ts
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  // Validate file type and size
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    return Response.json({ error: 'Invalid file type' }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    return Response.json({ error: 'File too large' }, { status: 400 });
  }

  const blob = await put(`employees/${employeeId}/${file.name}`, file, {
    access: 'public', // or use signed URLs for private access
  });

  return Response.json(blob);
}
```

**Security considerations for HRMS:**
- Employee documents (KTP, NPWP, contracts) are PII -- use private/signed URLs, not public
- Implement access control: only HR and the employee themselves can access their documents
- Consider encrypting sensitive documents at rest
- Set reasonable file size limits (5-10MB for scanned documents)

**Confidence:** MEDIUM -- Vercel Blob API is stable but verify current pricing and limits. uploadthing is also viable.

---

### 4. Attendance Geo/IP Restriction

**Recommendation:** Custom implementation using the browser Geolocation API + server-side IP validation. No single library solves this.

**Architecture:**

```
Client (Browser)                    Server (API Route)
-----------------                   ------------------
1. navigator.geolocation           4. Validate IP against
   .getCurrentPosition()              office IP whitelist
2. Send lat/lng + timestamp        5. Validate coordinates
3. POST /api/attendance/clock-in      against office geo-fence
                                   6. Record attendance with
                                      metadata (IP, coords, method)
```

**Libraries needed:**

| Library | Purpose | Why |
|---------|---------|-----|
| `geolib` | Server-side distance calculation between coordinates | Lightweight (~5KB). `isPointWithinRadius()` for geo-fence checking. Pure math, no external API calls. |
| Native `Request.headers` | IP extraction from request | Use `x-forwarded-for` header (Vercel provides this). No library needed. |

**Implementation pattern:**

```typescript
// lib/attendance/geo-validation.ts
import { isPointWithinRadius } from 'geolib';

interface OfficeLocation {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;      // Geo-fence radius (e.g., 100m)
  allowedIPs: string[];       // Office static IPs
}

export function validateAttendanceLocation(
  employeeLat: number,
  employeeLng: number,
  clientIP: string,
  officeLocations: OfficeLocation[]
): { valid: boolean; method: 'GPS' | 'IP' | 'BOTH' | 'NONE'; office?: string } {

  for (const office of officeLocations) {
    const gpsValid = isPointWithinRadius(
      { latitude: employeeLat, longitude: employeeLng },
      { latitude: office.latitude, longitude: office.longitude },
      office.radiusMeters
    );
    const ipValid = office.allowedIPs.includes(clientIP);

    if (gpsValid || ipValid) {
      return {
        valid: true,
        method: gpsValid && ipValid ? 'BOTH' : gpsValid ? 'GPS' : 'IP',
        office: office.name,
      };
    }
  }

  return { valid: false, method: 'NONE' };
}
```

**Important considerations:**
- GPS can be spoofed on mobile devices. IP validation provides a second factor.
- Store office locations in the database (admin-configurable)
- Log all attendance attempts (both successful and failed) with full metadata for audit
- Consider allowing admins to override/approve attendance for edge cases (field work, remote)
- Vercel edge functions can access `request.ip` directly

**Confidence:** HIGH -- geolib is well-established. The Geolocation Web API is a browser standard. IP validation from headers is standard practice.

---

### 5. Reporting & Data Export

**Recommendation:** Multi-library approach depending on output format.

| Library | Purpose | Version (approx) |
|---------|---------|-------------------|
| `xlsx` (SheetJS Community) | Excel export for tabular reports | 0.18.x |
| `@react-pdf/renderer` | PDF reports (reuse from payslip) | (same as above) |
| `recharts` | Dashboard charts and visualizations | 2.x |
| `@tanstack/react-table` | Interactive data tables with sorting, filtering, pagination | 8.x |

**Why these specifically:**

- **xlsx (SheetJS):** HR managers expect Excel downloads for attendance summaries, payroll reports, employee lists. SheetJS is the standard for this. The community edition is free and sufficient.
- **recharts:** Built on React and D3. Works well with Next.js. Good for dashboard visualizations (attendance trends, headcount charts, payroll summaries).
- **@tanstack/react-table:** Headless table library -- pairs perfectly with shadcn/ui's Table component. Handles large datasets with virtual scrolling. Essential for the employee list, attendance records, payroll history views.

**Implementation pattern for Excel export:**

```typescript
// lib/reports/excel-export.ts
import * as XLSX from 'xlsx';

export function generateAttendanceReport(data: AttendanceRecord[]): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(data.map(record => ({
    'Nama Karyawan': record.employeeName,
    'Tanggal': record.date,
    'Jam Masuk': record.clockIn,
    'Jam Keluar': record.clockOut,
    'Status': record.status,
    'Lokasi': record.office,
  })));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Absensi');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
```

**Note on SheetJS licensing:** The community edition (npm `xlsx`) uses Apache 2.0 license. The Pro edition has additional features but requires a commercial license. The community edition is sufficient for basic report exports.

**Confidence:** HIGH for recharts and @tanstack/react-table. MEDIUM for xlsx (verify current npm package name and license status -- SheetJS has changed distribution methods).

---

### 6. Date/Time Handling (Indonesian Timezones)

**Recommendation:** `date-fns` with `date-fns-tz` for timezone-aware operations.

| Option | Verdict | Rationale |
|--------|---------|-----------|
| **date-fns + date-fns-tz** | **USE THIS** | Tree-shakeable (only import what you use). Immutable. Excellent TypeScript support. Handles WIB/WITA/WIT via IANA timezone identifiers. |
| dayjs | ALTERNATIVE | Smaller bundle but plugin system is less ergonomic. Adequate if bundle size is critical. |
| moment.js | AVOID | Deprecated. Mutable API. Massive bundle. Do not use for new projects. |
| Temporal API | NOT YET | Still Stage 3 TC39 proposal. Not available in Node.js without polyfills. Future standard but not ready. |
| Luxon | ALTERNATIVE | Good API but larger than date-fns. Less tree-shakeable. |

**Indonesian timezone identifiers:**

| Zone | IANA Identifier | Offset |
|------|-----------------|--------|
| WIB (Waktu Indonesia Barat) | `Asia/Jakarta` | UTC+7 |
| WITA (Waktu Indonesia Tengah) | `Asia/Makassar` | UTC+8 |
| WIT (Waktu Indonesia Timur) | `Asia/Jayapura` | UTC+9 |

**Implementation pattern:**

```typescript
// lib/utils/datetime.ts
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

const INDONESIA_TIMEZONES = {
  WIB: 'Asia/Jakarta',
  WITA: 'Asia/Makassar',
  WIT: 'Asia/Jayapura',
} as const;

// Default timezone for PT SAN (Jakarta-based)
const DEFAULT_TZ = INDONESIA_TIMEZONES.WIB;

export function formatDateIndonesian(date: Date | string, formatStr: string = 'dd MMMM yyyy'): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(parsed, DEFAULT_TZ, formatStr, { locale: id });
}

export function formatTimeWIB(date: Date | string): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(parsed, DEFAULT_TZ, 'HH:mm', { locale: id });
}

// For attendance: ensure clock-in time is in the correct office timezone
export function getOfficeTime(date: Date, officeTimezone: keyof typeof INDONESIA_TIMEZONES): Date {
  return toZonedTime(date, INDONESIA_TIMEZONES[officeTimezone]);
}
```

**Database strategy:** Store all timestamps as UTC in PostgreSQL (`timestamptz`). Convert to local timezone only at display time. This is critical for correctness when offices span WIB/WITA/WIT.

**Confidence:** HIGH -- date-fns is the standard modern date library. IANA timezone identifiers for Indonesia are stable.

---

### 7. Currency Formatting (Indonesian Rupiah)

**Recommendation:** Native `Intl.NumberFormat` -- no library needed.

```typescript
// lib/utils/currency.ts
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
// Output: "Rp 5.000.000"

export function formatRupiahCompact(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    notation: 'compact',
    minimumFractionDigits: 0,
  }).format(amount);
// Output: "Rp 5 jt" (approximately)
}
```

**For payroll calculations:** Use `Decimal.js` or store amounts as integers (smallest unit). PostgreSQL `DECIMAL(15,2)` or `BIGINT` (storing in Rupiah, no fractional cents needed for IDR).

**Confidence:** HIGH -- Intl.NumberFormat is a browser/Node.js standard with full id-ID locale support.

---

### 8. Precise Arithmetic for Payroll

**Recommendation:** `decimal.js` for all payroll calculations.

| Option | Verdict | Rationale |
|--------|---------|-----------|
| **decimal.js** | **USE THIS** | Arbitrary-precision decimal arithmetic. Prevents floating-point rounding errors in salary, tax, deduction calculations. Well-maintained. |
| dinero.js | ALTERNATIVE | Money-specific library. Good API but more opinionated. decimal.js is more flexible. |
| big.js | ALTERNATIVE | Simpler API, smaller. Less features than decimal.js. |
| Native Number | AVOID | `0.1 + 0.2 !== 0.3`. Floating point errors are unacceptable in payroll. |

```typescript
import Decimal from 'decimal.js';

// Example: PPh 21 calculation with precise arithmetic
const grossSalary = new Decimal(8_500_000);
const biayaJabatan = Decimal.min(grossSalary.mul(0.05), new Decimal(500_000));
const netBeforeTax = grossSalary.sub(biayaJabatan);
```

**Prisma consideration:** Prisma maps PostgreSQL `Decimal` to `Prisma.Decimal` (which is based on decimal.js). This is seamless.

**Confidence:** HIGH -- decimal.js is the standard for precise arithmetic in JS. Prisma's built-in Decimal support confirms this choice.

---

### 9. Multi-Step Forms (Next.js App Router Patterns)

**Recommendation:** React Hook Form (already chosen) + `zustand` for cross-step state persistence.

**Why zustand over React Context for form wizards:**
- Survives navigation between steps (if using separate routes per step)
- No prop drilling or context nesting
- Tiny (~1KB). Simple API.
- Works with both client and server components

**Pattern for multi-step employee onboarding form:**

```typescript
// stores/employee-form-store.ts
import { create } from 'zustand';

interface EmployeeFormState {
  step: number;
  personalData: Partial<PersonalData>;
  employmentData: Partial<EmploymentData>;
  documentData: Partial<DocumentData>;
  setStep: (step: number) => void;
  updatePersonalData: (data: Partial<PersonalData>) => void;
  updateEmploymentData: (data: Partial<EmploymentData>) => void;
  reset: () => void;
}

export const useEmployeeFormStore = create<EmployeeFormState>((set) => ({
  step: 1,
  personalData: {},
  employmentData: {},
  documentData: {},
  setStep: (step) => set({ step }),
  updatePersonalData: (data) => set((s) => ({
    personalData: { ...s.personalData, ...data }
  })),
  updateEmploymentData: (data) => set((s) => ({
    employmentData: { ...s.employmentData, ...data }
  })),
  reset: () => set({ step: 1, personalData: {}, employmentData: {}, documentData: {} }),
}));
```

**Each step validates independently with Zod:**

```typescript
// lib/validations/employee.ts
export const personalDataSchema = z.object({
  namaLengkap: z.string().min(1, 'Nama lengkap wajib diisi'),
  nik: z.string().length(16, 'NIK harus 16 digit'),
  tempatLahir: z.string().min(1),
  tanggalLahir: z.coerce.date(),
  jenisKelamin: z.enum(['L', 'P']),
  // ...
});

export const employmentDataSchema = z.object({
  nomorKaryawan: z.string().min(1),
  jabatan: z.string().min(1),
  departemen: z.string().min(1),
  tanggalMasuk: z.coerce.date(),
  statusKaryawan: z.enum(['TETAP', 'KONTRAK', 'PROBATION']),
  // ...
});
```

**Confidence:** HIGH -- zustand + React Hook Form + Zod is a well-established pattern.

---

### 10. Additional Utilities

| Library | Purpose | Confidence |
|---------|---------|------------|
| `bcryptjs` | Password hashing (for NextAuth credentials) | HIGH |
| `nanoid` | Short unique ID generation (employee IDs, reference numbers) | HIGH |
| `slugify` | URL-safe strings from Indonesian text | MEDIUM |
| `next-intl` or manual | Indonesian locale strings (if future i18n needed) | LOW -- probably not needed if UI is Indonesian-only |
| `cron` or `node-cron` | Scheduled tasks (monthly payroll processing) | MEDIUM -- verify if Vercel Cron Jobs suffice |
| `nodemailer` | Email notifications (optional, future) | HIGH (if needed) |
| `sonner` | Toast notifications (works with shadcn/ui) | HIGH |
| `nuqs` | Type-safe URL search params for Next.js | MEDIUM |

**Vercel Cron Jobs:** For scheduled payroll processing, Vercel supports cron jobs natively via `vercel.json`. No need for a separate cron library. Configure API routes to run on schedule.

```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/payroll-reminder",
    "schedule": "0 8 25 * *"
  }]
}
```

---

## Complete Installation Command

```bash
# Core (already decided -- included for completeness)
npm install next@14 react react-dom typescript
npm install @prisma/client next-auth@5
npm install tailwindcss postcss autoprefixer
npm install react-hook-form @hookform/resolvers zod

# HRMS-specific libraries
npm install @react-pdf/renderer          # PDF generation
npm install decimal.js                    # Precise payroll arithmetic
npm install date-fns date-fns-tz         # Date/time with timezone
npm install geolib                        # Geo-fence distance calculation
npm install xlsx                          # Excel report export
npm install zustand                       # Multi-step form state
npm install recharts                      # Dashboard charts
npm install @tanstack/react-table        # Data tables
npm install bcryptjs                      # Password hashing
npm install nanoid                        # ID generation
npm install sonner                        # Toast notifications
npm install @vercel/blob                  # File upload storage

# Dev dependencies
npm install -D prisma
npm install -D @types/bcryptjs
```

---

## Confidence Assessment

| Recommendation | Confidence | Reason |
|----------------|------------|--------|
| @react-pdf/renderer | HIGH | Well-established, widely used, fits the use case perfectly |
| Manual PPh 21 calculation | HIGH (approach) / MEDIUM (specific rates) | Correct approach; tax rate values need verification against latest regulation |
| Vercel Blob for uploads | MEDIUM | Verify current pricing/limits; uploadthing is equally viable |
| geolib for geo-fencing | HIGH | Stable library, simple math operations, no external dependencies |
| date-fns + date-fns-tz | HIGH | Standard modern date library, excellent timezone support |
| xlsx (SheetJS) | MEDIUM | Verify current npm distribution method and license terms |
| decimal.js | HIGH | Standard for precise arithmetic, Prisma-compatible |
| zustand for form state | HIGH | Proven pattern with React Hook Form |
| recharts | HIGH | Standard React charting library |
| @tanstack/react-table | HIGH | De facto standard for React tables |
| Intl.NumberFormat for IDR | HIGH | Native API, no library needed |

---

## What NOT to Use

| Library/Approach | Why Avoid |
|------------------|-----------|
| **moment.js** | Deprecated. Massive bundle. Use date-fns instead. |
| **puppeteer/playwright for PDF** | Too heavy for Vercel serverless (300MB+ Chromium). Use @react-pdf/renderer. |
| **jsPDF** | Client-side focused, poor complex layout support, weak non-ASCII handling. |
| **multer / formidable** | Express middleware. Incompatible with Next.js App Router request handling. |
| **Native JS Number for money** | Floating point errors. Rp 1 rounding errors in payroll are unacceptable. Use decimal.js. |
| **Any npm PPh 21 library** | Likely unmaintained or outdated. Indonesian tax regulations change frequently. Own your calculation logic. |
| **moment-timezone** | Deprecated along with moment.js. Use date-fns-tz. |
| **Redux / Redux Toolkit** | Overkill for form state management. Zustand is simpler and sufficient. |
| **chart.js** | Less React-native than recharts. Requires wrapper library (react-chartjs-2). More configuration. |
| **ag-Grid** | Commercial license for advanced features. @tanstack/react-table + shadcn/ui is free and sufficient. |

---

## Sources & Verification Notes

All recommendations are based on training data (cutoff ~May 2025). The following items specifically need live verification before implementation:

1. **@react-pdf/renderer** -- Verify latest version on npm. Check if any breaking changes since v3.x.
2. **PPh 21 TER rates** -- Verify against latest PMK (Peraturan Menteri Keuangan). The TER system was introduced Jan 2024 via PP 58/2023 and PMK 168/2023. Check if any 2025/2026 updates exist.
3. **PTKP values** -- Verify current PTKP thresholds. These can change with new tax regulations.
4. **xlsx npm package** -- SheetJS has changed distribution methods. Verify the correct npm package name and that the community edition still exists.
5. **@vercel/blob** -- Verify current Vercel Blob pricing, storage limits, and API.
6. **NextAuth v5** -- Verify stable release status. As of training data, v5 was in beta. May now be stable under the `next-auth@5` or `@auth/nextjs` package name.

> **Action required:** Before starting implementation, run `npm info [package]` for each library to confirm current versions and availability.
