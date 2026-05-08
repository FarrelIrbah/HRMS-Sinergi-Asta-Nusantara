## 10. Tech Stack & Dependencies

### 10.A — Production Dependencies

Berasal dari `package.json` (versi sesuai snapshot):

| Package | Versi | Fungsi |
|---|---|---|
| @auth/prisma-adapter | ^2.11.1 | Adapter NextAuth ke database via Prisma (saat ini tidak aktif karena pakai JWT strategy + custom credentials) |
| @dnd-kit/core | ^6.3.1 | Engine drag-and-drop untuk Kanban kandidat di recruitment |
| @dnd-kit/sortable | ^10.0.0 | Sortable extension @dnd-kit untuk reorder dalam kolom |
| @dnd-kit/utilities | ^3.2.2 | Utility helper (CSS, transform) untuk @dnd-kit |
| @hookform/resolvers | ^5.2.2 | Bridge react-hook-form ↔ Zod (zodResolver) |
| @prisma/client | ^6.19.2 | Prisma runtime client (di-generate ke `src/generated/prisma`) |
| @radix-ui/react-alert-dialog | ^1.1.15 | Primitive alert dialog (basis shadcn/ui AlertDialog) |
| @radix-ui/react-avatar | ^1.1.11 | Primitive Avatar |
| @radix-ui/react-collapsible | ^1.1.12 | Primitive Collapsible (sidebar group) |
| @radix-ui/react-dialog | ^1.1.15 | Primitive Dialog |
| @radix-ui/react-dropdown-menu | ^2.1.16 | Primitive DropdownMenu |
| @radix-ui/react-label | ^2.1.8 | Primitive Label |
| @radix-ui/react-popover | ^1.1.15 | Primitive Popover (date picker, dll.) |
| @radix-ui/react-progress | ^1.1.8 | Primitive Progress bar |
| @radix-ui/react-scroll-area | ^1.2.10 | Primitive ScrollArea custom scrollbar |
| @radix-ui/react-select | ^2.2.6 | Primitive Select combobox |
| @radix-ui/react-separator | ^1.1.8 | Primitive Separator garis |
| @radix-ui/react-slot | ^1.2.4 | Slot polymorphic (asChild prop di shadcn Button) |
| @radix-ui/react-tabs | ^1.1.13 | Primitive Tabs |
| @radix-ui/react-toast | ^1.2.15 | Primitive Toast (legacy, akan di-deprecate ke Sonner) |
| @radix-ui/react-tooltip | ^1.2.8 | Primitive Tooltip |
| @react-pdf/renderer | ^4.3.2 | Generate PDF di server side untuk payslip, attendance report, offer letter |
| @tanstack/react-table | ^8.21.3 | Headless table (sorting, pagination, filter) untuk semua DataTable |
| bcryptjs | ^3.0.3 | Hash password user (cost factor 12) |
| class-variance-authority | ^0.7.1 | Definisi varian Tailwind class untuk Button/Badge |
| clsx | ^2.1.1 | Conditional class util (dipakai di `cn()`) |
| date-fns | ^4.1.0 | Manipulasi tanggal (format, eachDayOfInterval, isWeekend, startOfWeek, dst.) |
| date-fns-tz | ^3.2.0 | Timezone conversion UTC ↔ Asia/Jakarta (WIB) untuk attendance |
| decimal.js | ^10.6.0 | Aritmatika presisi tinggi (BPJS_RATES, PTKP_ANNUAL constants) |
| dotenv | ^17.3.1 | Load `.env` di seed script |
| ip-range-check | ^0.2.0 | Cek apakah IP berada dalam range CIDR (validasi clock-in) |
| lucide-react | ^0.575.0 | Ikon SVG (Building, User, Calendar, dll. di sidebar dan pages) |
| next | 14.2.35 | Next.js framework (App Router) |
| next-auth | ^5.0.0-beta.30 | Authentication library (versi 5 / Auth.js) |
| next-themes | ^0.4.6 | Theme switcher (light/dark — saat ini single light theme) |
| nuqs | ^2.8.8 | Type-safe URL search params untuk filter di list pages |
| react | ^18 | React core |
| react-day-picker | ^9.14.0 | Calendar picker (komponen `<Calendar/>`) |
| react-dom | ^18 | React DOM |
| react-hook-form | ^7.71.2 | Form state management |
| recharts | ^2.15.4 | Charting library (LineChart untuk dashboard trend) |
| sonner | ^2.0.7 | Toast notification (success/error feedback dari server actions) |
| tailwind-merge | ^3.5.0 | Merge Tailwind class tanpa konflik (dipakai di `cn()`) |
| tailwindcss-animate | ^1.0.7 | Plugin animasi Tailwind (slide-in, fade) |
| xlsx | ^0.18.5 | Parsing & generate Excel file (payroll import + template) |
| zod | ^4.3.6 | Runtime schema validation (semua form + server action input) |

### 10.B — DevDependencies

| Package | Versi | Fungsi |
|---|---|---|
| @types/bcryptjs | ^2.4.6 | TypeScript types untuk bcryptjs |
| @types/node | ^20 | TypeScript types untuk Node.js builtins |
| @types/react | ^18 | TS types React |
| @types/react-dom | ^18 | TS types ReactDOM |
| @types/xlsx | ^0.0.35 | TS types xlsx |
| eslint | ^8 | Linter |
| eslint-config-next | 14.2.35 | Konfigurasi ESLint Next.js (Core Web Vitals + React Hooks) |
| postcss | ^8 | CSS processor (Tailwind requires) |
| prisma | ^6.19.2 | Prisma CLI (migrate, generate, db push) |
| tailwindcss | ^3.4.1 | Utility-first CSS framework |
| tsx | ^4.21.0 | TypeScript executor untuk seed script (`npx tsx prisma/seed.ts`) |
| typescript | ^5 | TypeScript compiler |

### 10.C — Environment Variables

Berdasarkan grep `process.env.*` + referensi di schema.prisma + library yang digunakan:

| Nama | Wajib | Sumber | Fungsi |
|---|---|---|---|
| DATABASE_URL | Yes | `prisma/schema.prisma` `datasource db { url = env("DATABASE_URL") }` | Connection string PostgreSQL (host, port, user, password, db name, schema) |
| NODE_ENV | Auto | `src/lib/prisma.ts` (Prisma log level), Next.js core | "development"/"production"/"test" |
| AUTH_SECRET | Yes | NextAuth v5 (Auth.js) — required signing secret | Random string untuk sign JWT cookie session |
| NEXTAUTH_URL | Optional (auto-detect) | NextAuth | URL canonical aplikasi (e.g. `http://localhost:3000` di dev, `https://hrms.example.com` di prod) — biasanya auto-detect di Vercel |

Catatan: tidak ada referensi `process.env` lain di `src/`. Tidak ada Vercel Blob token, tidak ada SMTP, tidak ada API key external. File upload (employee documents) menggunakan local filesystem (`fs/promises.unlink`, `path.join(process.cwd(), filePath)`). Storage path mengikuti `process.cwd()` relatif.

### 10.D — Konfigurasi Build & Deployment

**`next.config.mjs`**:
```js
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};
```
Hanya menaikkan body size limit Server Actions ke 5 MB (default 1 MB) supaya bisa upload Excel payroll + dokumen karyawan ≤ 5 MB.

**`package.json` scripts**:
- `npm run dev` — `next dev` (port 3000, hot reload)
- `npm run build` — `next build` (production bundle)
- `npm run start` — `next start` (run production)
- `npm run lint` — `next lint`

**Prisma**:
- `prisma generate` — generate client ke `src/generated/prisma/` (custom output path).
- `prisma migrate dev/deploy` — migration. Folder `prisma/migrations/` punya 7 migrations:
  - 20260227160142_init
  - 20260304155331_add_employee_models
  - 20260305221746_add_attendance_leave_models
  - 20260307120948_add_payroll_models
  - 20260308081802_add_recruitment_models
  - 20260413133047_add_is_tax_borne_by_company
  - 20260429100000_leave_two_stage_approval
- Seed: `npx tsx prisma/seed.ts` (idempotent, findFirst-before-create guards).

**Deployment**: kandidat utama Vercel (Next.js 14 + serverless). Tidak ada `vercel.json` di repo (default config Vercel). Postgres bisa pakai Vercel Postgres / Neon / Supabase. Migrasi dijalankan via `prisma migrate deploy` di Vercel build step (perlu env `DATABASE_URL`).

---

## 13. Library/Utility Khusus

### 13.1 Kalkulasi Payroll

**File utama**: `src/lib/services/payroll.service.ts` + `src/lib/services/payroll-import.service.ts`.

**Important context**: Setelah pivot 2026-04-29, sistem **TIDAK** lagi menghitung BPJS/PPh21/THR sendiri. HR menghitung di Excel external. Sistem hanya:
1. Parse file `.xlsx`/`.xls`/`.csv`.
2. Validasi struktural (kolom, tipe data, NIK unik).
3. Match NIK ke Employee aktif.
4. Persist sebagai snapshot di `PayrollEntry`.

**`parsePayrollWorkbook(buffer: Buffer): PayrollImportResult`** di `payroll-import.service.ts`:
- Pakai `xlsx` library (`XLSX.read`, `XLSX.utils.sheet_to_json` dengan `header: 1` → array-of-arrays).
- Sheet preference: `"Payroll"` jika ada, else first sheet.
- 33 kolom wajib (`PAYROLL_COLUMNS` const), case-insensitive header match.
- Validasi:
  - Required text cols: `NIK`, `Nama Karyawan`, `Job Position`, `Organization`, `Grade / Level`, `PTKP`.
  - 19 kolom number: Basic Salary, semua tunjangan, semua deduction, semua benefit perusahaan. Format Indonesian-friendly: `replace(/[.,\s]/g, m => m === "," ? "." : "")` → handle "1.234.567,89" → 1234567.89.
  - 6 kolom integer: Actual/Schedule Working Day, Dayoff, holidays.
  - Negative number rejected.
  - Duplicate NIK in upload rejected.
  - Empty rows skipped (NIK="" + name="" + basic=0).
- Compute totals di parser:
  - `totalEarnings = basicSalary + tunjanganKomunikasi + tunjanganKehadiran + tunjanganJabatan + tunjanganLainnya + taxAllowance + thr`
  - `totalDeductions = bpjsKesehatanEmp + jhtEmp + jaminanPensiunEmp + pph21 + potonganKeterlambatan + potonganKoperasi + potonganLainnya`
  - `totalBenefits = jkk + jkm + jhtCompany + jaminanPensiunCompany + bpjsKesehatanCompany`
  - `takeHomePay = totalEarnings - totalDeductions`

**`buildPayrollTemplate(periodLabel: string): Buffer`** di `payroll-import.service.ts`:
- Generate Excel 2-sheet ("Payroll" + "Petunjuk").
- Sheet "Payroll": header + 1 row sample data (Budi Santoso example).
- Sheet "Petunjuk": instruksi pengisian.
- Column widths proporsional terhadap header length.

**`matchRowsToEmployees(rows)`** di `payroll.service.ts`:
- `findMany({ where: { nik: { in: niks } } })`.
- Per row: cek NIK exists & employee active, else error.

**`persistImportedPayroll({ month, year, rows, createdBy })`**:
- Cek `PayrollRun` existing untuk month/year. Jika `FINALIZED` → throw immutable.
- Upsert run (DRAFT). Jika existing DRAFT → `deleteMany(entries)` dulu (replace strategy).
- `createMany(entries)` dengan semua snapshot field.

**`finalizePayroll(id)`**:
- Cek run exists & status DRAFT.
- Update status → `FINALIZED`. Tidak bisa di-rollback dari UI.

**Decimal.js usage**: ada di `src/lib/constants.ts` untuk konstanta BPJS_RATES, PTKP_ANNUAL, BIAYA_JABATAN_RATE/MAX, dan tabel TER (PP 58/2023). Konstanta ini **legacy** dari sebelum pivot — saat ini tidak dipakai untuk kalkulasi (calculation eksternal). Tetap dipertahankan untuk referensi & potential rollback.

---

### 13.2 PDF Generation

**Library**: `@react-pdf/renderer` ^4.3.2 (server-side). Komponen ditulis dengan JSX yang dikompilasi ke PDF binary.

**File**:
- `src/lib/pdf/payslip-pdf.tsx` — slip gaji per `PayrollEntry`. Render Document → Page A4 portrait → View blocks: header company, employee identity, earnings table, deductions table, total THP, benefits, attendance summary.
- `src/lib/pdf/attendance-pdf.tsx` — laporan absensi bulanan. Tabel per karyawan dengan kolom date, clockIn, clockOut, late mins, early-out mins, overtime mins.
- `src/lib/pdf/offer-letter-pdf.tsx` — surat penawaran kandidat. Body letter dengan offerSalary + offerNotes.

**Pola pemanggilan dari API route**:
```ts
import { renderToStream } from "@react-pdf/renderer";
import { PayslipDocument } from "@/lib/pdf/payslip-pdf";

const stream = await renderToStream(<PayslipDocument data={payslipData} />);
return new Response(stream as unknown as ReadableStream, {
  headers: { "Content-Type": "application/pdf" },
});
```

Type interface `PayslipData` di `payslip-pdf.tsx` mirror semua kolom `PayrollEntry` (basicSalary, tunjangan*, deductions, takeHomePay, benefits, attendance summary).

**StyleSheet API**: pakai `StyleSheet.create({...})` mirip React Native. Style flat, no Tailwind.

---

### 13.3 Date Handling & Timezone

**Library**: `date-fns` ^4.1.0 + `date-fns-tz` ^3.2.0.

**Timezone constant**: `const TZ = "Asia/Jakarta"` (WIB / UTC+7), dipakai di `attendance.service.ts` dan `attendance.actions.ts`.

**Konversi UTC ↔ WIB**:
- `toZonedTime(utcDate, TZ)` — convert UTC `Date` ke local Date object yang merepresentasikan jam WIB.
- Manual reverse: `clockInUtc.setUTCHours(inH - 7, inM, 0, 0)` — convert "08:00 WIB" → UTC 01:00 (untuk manual override action).

**Pola normalisasi tanggal** (stored sebagai `@db.Date` di Prisma):
```ts
const nowJkt = toZonedTime(nowUtc, TZ);
const dateStr = format(nowJkt, "yyyy-MM-dd");
const dateOnly = new Date(dateStr + "T00:00:00.000Z");
```
Date stored sebagai UTC midnight dari hari WIB → saat di-query, konsisten lookup `[employeeId, date]`.

**Working days**: `eachDayOfInterval({ start, end }).filter(d => !isWeekend(d))` — exclude Sat/Sun. Tidak ada handling libur nasional di hari kerja (libur nasional masuk di payroll Excel kolom `nationalHoliday`, bukan otomatis).

**Week start**: `startOfWeek(now, { weekStartsOn: 1 })` — Senin sebagai awal minggu (locale Indonesia).

---

### 13.4 Audit Logging

**File**: `src/lib/services/audit.service.ts` (query) + `src/lib/prisma.ts` (`createAuditLog` mutator).

**`createAuditLog(params)`** di `prisma.ts`:
```ts
async function createAuditLog(params: {
  userId: string;
  action: AuditAction;          // CREATE | UPDATE | DELETE
  module: string;                // label dari MODULES const
  targetId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
}) {
  await prisma.auditLog.create({ data: { ... } });
}
```
- Function ini SENGAJA tidak memicu audit log lebih lanjut (anti-recursion).
- Service layer panggil **eksplisit** setelah setiap mutasi sukses (tidak ada Prisma middleware/hook).

**Modul yang di-track** (`MODULES` const di `lib/constants.ts`):
- USER: "Manajemen Pengguna"
- DEPARTMENT, POSITION, OFFICE_LOCATION, LEAVE_TYPE — master data
- AUTH: "Autentikasi" (login attempt — implementasi bisa di-extend)
- EMPLOYEE: "Karyawan"
- EMPLOYEE_DOCUMENT, EMERGENCY_CONTACT
- Plus modul attendance/leave/payroll/recruitment dengan label langsung ("Absensi", "Permintaan Cuti", "Lowongan", "Kandidat") di-pass ad-hoc dari action layer.

**`getAuditLogs(filters)`**: paginated query dengan filter `userId`, `module`, `action`, `dateFrom`, `dateTo`. Default `pageSize=25`. Include `user.name` + `user.email`.

**`getAuditLogById(id)`**: detail single log untuk diff view.

**`getAuditLogUsers()` & `getAuditLogModules()`**: distinct values untuk dropdown filter.

**Lokasi pemanggilan `createAuditLog`** (action mutasi):
- employee.actions: createEmployee, updatePersonalInfo, updateEmployment, updateTaxBpjs, deactivateEmployee
- employee-document.actions: createEmergencyContact (juga update/delete via service)
- attendance.actions: manualOverrideAction
- leave.actions: submit/approve/reject (cancel tidak ada audit log)
- payroll.actions: import via persistImportedPayroll (legacy mungkin tidak audit)
- recruitment.actions: createVacancy, updateVacancy, toggleVacancyStatus, createCandidate, updateCandidateStage, convertCandidate
- master-data.actions: create/update/delete department/position/officeLocation/leaveType
- user.actions: create/update/toggle (via service)

---

### 13.5 File Upload (penyimpanan dokumen)

**Catatan**: berdasarkan code yang ada (`src/lib/services/employee-document.service.ts`), implementasi saat ini menggunakan **local filesystem**, **bukan** Vercel Blob:

```ts
import { unlink } from "fs/promises";
import path from "path";

// On delete:
const absolutePath = path.join(process.cwd(), document.filePath);
await unlink(absolutePath);
```

`document.filePath` adalah relative path dari root project. Tidak ada import `@vercel/blob` di codebase.

**Flow upload**:
1. Client form (`documents-tab.tsx`) submit multipart ke `POST /api/employees/[id]/documents`.
2. Handler API parse `FormData` → ambil `File` instance.
3. Simpan ke directory upload local (e.g. `/uploads/...`).
4. Insert `EmployeeDocument` row dengan `filePath`, `fileName`, `fileSize`, `mimeType`.
5. AuditLog CREATE module="Dokumen Karyawan".

**Flow delete**:
1. `DELETE /api/employees/[id]/documents/[docId]`.
2. Service `deleteDocument(docId, actorId)`:
   - Load existing document.
   - `await unlink(absolutePath)` — error di-catch (file mungkin sudah dihapus dari disk; tetap lanjut hapus DB row).
   - `prisma.employeeDocument.delete`.
   - AuditLog DELETE.

**CV upload (recruitment)**: pola serupa via `POST /api/recruitment/cv` → simpan path di `Candidate.cvPath`.

**Trade-off lokal vs cloud storage**: di Vercel serverless, filesystem **ephemeral** — file hilang di redeploy. Untuk production, perlu migrate ke S3 / Vercel Blob / GCS. Saat ini cocok untuk dev / on-prem deployment.

**Bodysize limit**: `next.config.mjs` set `serverActions.bodySizeLimit = "5mb"` — semua upload (Excel payroll, dokumen karyawan, CV) capped 5 MB.

---

### 13.6 Location / IP Validation

**File**: `src/lib/services/location.service.ts`.

**`verifyLocation(clientIp, coords, office): LocationResult`**:
- Return type: `{ allowed: true } | { allowed: false; reason: string }`.
- Logika:
  1. **GPS check (primary)**: jika `coords` ada DAN office punya `latitude/longitude/radiusMeters`, hitung haversine distance. Jika > radius → reject "Lokasi Anda di luar radius yang diizinkan". Jika OK → allow.
  2. **IP check (fallback)**: jika tidak ada koordinat atau office tidak punya GPS config — cek IP. `ipRangeCheck(clientIp, office.allowedIPs)` (CIDR matcher). Jika `allowedIPs.length === 0` (dev mode) → allow. Jika CIDR match gagal → reject "Alamat IP Anda tidak berada dalam rentang yang diizinkan".

**`haversineDistance(lat1, lon1, lat2, lon2): number`** (private):
- Formula haversine standar dengan radius bumi `R = 6_371_000` meter.
- Return jarak dalam meter.

**Library**: `ip-range-check` ^0.2.0 — accept array CIDR like `["192.168.1.0/24", "10.0.0.0/8"]`.

**Dipakai di**: `attendance.actions.ts` `clockInAction` dan `clockOutAction`. Jika office.allowedIPs=[] dan office.latitude=null, location check pass (allow clock-in tanpa restriksi → mode development). Production: konfigurasikan minimal salah satu.

**Type augmentation**: `src/types/ip-range-check.d.ts` deklarasi module untuk lib JS yang tidak punya TS types.

---

### 13.7 Utility Umum

**`cn(...classes)`** di `src/lib/utils.ts`:
```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```
- Combine `clsx` (conditional) + `tailwind-merge` (resolve konflik utility seperti `p-2 p-4` → `p-4`).
- Dipakai di SEMUA komponen UI shadcn untuk merge class props.

**`prisma`** di `src/lib/prisma.ts`:
- Singleton `PrismaClient` dengan global cache (mencegah multiple instances di dev hot-reload).
- Log levels: `["query", "error", "warn"]` di dev, `["error"]` di prod.

**Constants** di `src/lib/constants.ts`:
- `ROLES`, `MODULES`, `AUDIT_ACTIONS` — label mapping bahasa Indonesia.
- `GENDER_LABELS`, `RELIGION_LABELS`, `MARITAL_STATUS_LABELS`, `CONTRACT_TYPE_LABELS`, `PTKP_STATUS_LABELS`, `DOCUMENT_TYPE_LABELS` — display label per enum.
- `DEFAULT_PAGE_SIZE = 25`, `PAGE_SIZE_OPTIONS = [25, 50]`.
- `OVERTIME_THRESHOLD_MINUTES = 30` — overtime hanya diakui jika > 30 menit lewat jam pulang.
- `ATTENDANCE_STATUS_LABELS`, `LEAVE_STATUS_LABELS`.
- `BPJS_RATES` (Decimal-based: KESEHATAN_EMPLOYEE=1%, KESEHATAN_EMPLOYER=4%, KESEHATAN_CAP=12jt; JHT_EMPLOYEE=2%, JHT_EMPLOYER=3.7%; JP_EMPLOYEE=1%, JP_EMPLOYER=2%, JP_CAP=10.547jt; JKK_EMPLOYER=0.24%; JKM_EMPLOYER=0.3%) — **legacy**, tidak dipakai pasca pivot.
- `PTKP_ANNUAL` — Decimal mapping per PTKPStatus enum (TK_0=54jt, K_3=72jt, dst.).
- `TER_CATEGORY` — mapping PTKP → kategori TER (A/B/C) untuk PP 58/2023.
- `TER_TABLE_A`, `TER_TABLE_B`, `TER_TABLE_C` — tarif efektif rata-rata (TER) PPh21 bulanan, tuple `[upperLimit, ratePercent]`.
- `PPH21_PROGRESSIVE_BRACKETS` — Pasal 17 UU PPh (bracket Desember).
- `BIAYA_JABATAN_RATE = 0.05`, `BIAYA_JABATAN_MAX = Rp 6jt/tahun`.

**`calculateAttendanceFlags(clockInUtc, clockOutUtc, scheduleStart, scheduleEnd)`** di `attendance.service.ts`:
- Pure function, no DB.
- Return `{ isLate, lateMinutes, isEarlyOut, earlyOutMinutes, overtimeMinutes, totalMinutes }`.
- Late = clockIn after scheduledStart (in WIB).
- Early-out = clockOut before scheduledEnd.
- Overtime = (clockOut - scheduledEnd) >= 30 menit.
- TotalMinutes = (clockOut - clockIn) / 60000.

**`countWorkingDays(start, end)`** di `leave.service.ts`:
- `eachDayOfInterval({ start, end }).filter(d => !isWeekend(d)).length`.
- Saturday + Sunday excluded; libur nasional tidak di-handle (asumsi tidak masuk hitungan cuti).

**`ensureLeaveBalances(employeeId, year)`**:
- Upsert `LeaveBalance` untuk setiap `LeaveType` aktif dengan `allocatedDays = annualQuota`, `usedDays = 0`.
- Idempotent (update branch `{}` — no-op kalau sudah ada).

**`getEmployeesForManager(userId, params)`**:
- Lookup manager.departmentId → call `getEmployees({ ...params, departmentId })`.
- Dipakai di Manager dashboard & employee list (scope dept).

**`canManagerAccessEmployee(managerUserId, employeeId)`**:
- Boolean check apakah manager dan employee di department sama.

**Dashboard agregator** (`dashboard.service.ts`):
- 4 function: `getSuperAdminDashboardData`, `getHrAdminDashboardData`, `getManagerDashboardData(userId)`, `getEmployeeDashboardData(userId)`.
- Pakai `Promise.all` multi-query untuk agregasi:
  - count per role
  - employee stats (active, PKWT/PKWTT split, joined this month)
  - pending leave count (`getPendingLeaveCount` di leave.service)
  - attendance trend 7 hari (groupBy date + countIf isLate)
  - upcoming birthdays (filter `tanggalLahir` MM-DD dalam 7 hari)
  - PKWT contracts expiring (joinDate + 12 bulan)
  - latest payslip per employee.

---

*Akhir dump-part5.md.*
