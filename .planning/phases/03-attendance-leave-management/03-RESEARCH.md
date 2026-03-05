# Phase 3: Attendance and Leave Management - Research

**Researched:** 2026-03-06
**Domain:** Attendance tracking with location verification, leave request workflows, reporting and export
**Confidence:** HIGH (stack decisions follow existing patterns; library APIs verified via official docs)

---

## Summary

Phase 3 builds on the existing Next.js 15 / Prisma 6 / Zod 4 stack without introducing new framework-level dependencies. The primary new concerns are: (1) location verification via IP CIDR check + browser Geolocation API, (2) timezone-correct time calculations using the already-installed `date-fns` v4 + `date-fns-tz` v3, (3) file export via Route Handlers returning buffered Excel/PDF responses, (4) atomic leave balance updates inside Prisma interactive transactions, and (5) a substantial schema migration adding ~6 new models (AttendanceRecord, LeaveRequest, LeaveBalance, etc.) plus work-schedule fields on OfficeLocation.

The current schema has `OfficeLocation` with `allowedIPs`, `latitude`, `longitude`, and `radiusMeters` already defined — the attendance location-check infrastructure is partially in place. What's missing is the work schedule (start/end time per office), the attendance record model, and the entire leave domain. All must be added in a single migration. The Employee model also currently lacks a relation to OfficeLocation (the field `officeLocationId` exists but has no `@relation` — verify this before planning).

For PDF export, `@react-pdf/renderer` has known compatibility issues with Next.js App Router route handlers (react-server mode strips required React exports). The safe, verified path is a Route Handler that uses `renderToStream` collected into a `Buffer`, returned as `application/pdf`. For Excel, SheetJS (`xlsx`) is the proven route-handler pattern: `XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })` returned with `Content-Disposition: attachment` headers.

**Primary recommendation:** Keep all new libraries to a minimum. Use `ip-range-check` for CIDR validation, `xlsx` (SheetJS) for Excel export, `@react-pdf/renderer` with stream-to-buffer for PDF, and `date-fns` v4 built-in functions for all time arithmetic. No new UI framework needed — build on existing shadcn/Radix components.

---

## Standard Stack

### Core (already installed — no new installs required for most features)

| Library | Version (installed) | Purpose | Why Standard |
|---------|---------------------|---------|--------------|
| `date-fns` | ^4.1.0 | Date arithmetic: duration, interval, working-days | v4 has first-class timezone support via `TZDate`; already installed |
| `date-fns-tz` | ^3.2.0 | IANA timezone helpers (`toZonedTime`, `fromZonedTime`) | Companion to date-fns for `Asia/Jakarta` timezone normalization |
| `@tanstack/react-table` | ^8.21.3 | Attendance/leave tables | Already used for employee tables; same pattern |
| `zod` | ^4.3.6 | Validation schemas for actions | Established project pattern |
| `react-hook-form` | ^7.71.2 | Leave request form | Established project pattern |
| `nuqs` | ^2.8.8 | URL state for filters (month/year selector) | Established project pattern |
| `sonner` | ^2.0.7 | Toast notifications for clock-in/out, approval | Established project pattern |

### New Libraries Required

| Library | Version | Purpose | Why This One |
|---------|---------|---------|--------------|
| `ip-range-check` | ^0.2.0 | Server-side CIDR/IP range validation | Simple API: `ipRangeCheck(ip, rangeArray)` returns boolean; handles IPv4, IPv6, CIDR notation; tiny package |
| `xlsx` | ^0.18.x (SheetJS) | Excel export from Route Handler | Verified pattern: `XLSX.write(wb, { type: "buffer" })` → `new Response(buffer, { headers: {...} })`; widely used |
| `@react-pdf/renderer` | ^3.x | PDF export from Route Handler | Server-side render with `renderToStream` stream-to-buffer pattern; works in App Router with correct approach |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `ip-range-check` | Manual CIDR bitmath | ip-range-check handles edge cases (IPv4-in-IPv6 mapping, mixed arrays) that manual code gets wrong |
| `xlsx` (SheetJS) | `exceljs` | exceljs has known issues with Next.js bundling (browser exports); SheetJS works cleanly server-side with buffer API |
| `@react-pdf/renderer` | `jsPDF` + `html2canvas` | html2canvas is client-only; react-pdf renders on server without DOM |
| `@react-pdf/renderer` | `puppeteer` | Puppeteer requires a headless Chromium process — overkill for a server-side HRMS running in a single Node process |

**Installation:**
```bash
npm install ip-range-check xlsx @react-pdf/renderer
npm install --save-dev @types/ip-range-check
```

> Note: `xlsx` from npm registry is fine for server-side Route Handler use. The SheetJS community edition on CDN is only needed for specific features; the npm package suffices here.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/(dashboard)/
│   ├── attendance/
│   │   ├── page.tsx                   # Employee clock-in/out page (server component)
│   │   ├── _components/
│   │   │   ├── clock-in-button.tsx    # "use client" toggle button with GPS flow
│   │   │   ├── attendance-today.tsx   # Today's status, weekly summary
│   │   │   └── attendance-history.tsx # Last 7 days table
│   │   └── [employeeId]/
│   │       └── page.tsx               # HR Admin/Manager drill-down (monthly detail)
│   ├── attendance-admin/
│   │   ├── page.tsx                   # HR Admin/Manager monthly summary table
│   │   └── _components/
│   │       ├── attendance-filters.tsx # Month/year filter via nuqs
│   │       ├── attendance-table.tsx   # All-employees summary
│   │       └── manual-record-dialog.tsx # HR Admin override modal
│   └── leave/
│       ├── page.tsx                   # Employee: leave balance + request list
│       ├── _components/
│       │   ├── leave-balance-card.tsx # Always-visible balances
│       │   ├── leave-request-form.tsx # Submit form with inline balance
│       │   └── leave-history-table.tsx
│       ├── manage/
│       │   └── page.tsx               # Manager/HR leave approvals page
│       └── report/
│           └── page.tsx               # HR Admin leave usage report
├── app/api/
│   ├── attendance/
│   │   └── export/route.ts            # GET: Excel + PDF export
│   └── leave/
│       └── export/route.ts            # GET: leave report export
├── lib/
│   ├── actions/
│   │   ├── attendance.actions.ts      # clockIn, clockOut, manualOverride
│   │   └── leave.actions.ts           # submitLeave, approveLeave, rejectLeave, cancelLeave
│   ├── services/
│   │   ├── attendance.service.ts      # getAttendanceRecords, calculateFlags, getMonthlyRecap
│   │   ├── leave.service.ts           # createLeaveRequest, approveLeave, getLeaveBalance
│   │   └── location.service.ts        # verifyIP, verifyGPS (pure functions, no DB)
│   └── validations/
│       ├── attendance.ts              # Zod schemas for clock-in action, manual override
│       └── leave.ts                   # Zod schemas for leave request submission
└── types/
    └── enums.ts                       # Add: LeaveStatus, AttendanceStatus (extend existing file)
```

### Pattern 1: Clock-In Server Action with Location Verification

Clock-in is a Server Action (not an API route) because it needs session auth. The client component collects GPS coordinates (if available), then calls the action passing `{ latitude, longitude }`. The action reads the IP from `headers()` and performs both checks server-side.

**Why Server Action, not Route Handler:** Consistent with Phase 1-2 patterns; session auth via `auth()` works directly; `headers()` is available in Server Actions.

```typescript
// Source: Next.js official docs - https://nextjs.org/docs/app/api-reference/functions/headers
// src/lib/actions/attendance.actions.ts
"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { verifyLocation } from "@/lib/services/location.service";

export async function clockInAction(coords?: { latitude: number; longitude: number }) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Sesi tidak valid" };

  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : headersList.get("x-real-ip") ?? "unknown";

  // Fetch employee's assigned office location
  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id },
    include: { officeLocation: true },
  });

  if (!employee?.officeLocation) {
    return { success: false, error: "Lokasi kantor belum dikonfigurasi" };
  }

  const locationResult = verifyLocation(clientIp, coords, employee.officeLocation);
  if (!locationResult.allowed) {
    return { success: false, error: locationResult.reason };
  }

  // ... create AttendanceRecord
}
```

### Pattern 2: Location Verification Service (Pure Functions)

```typescript
// Source: ip-range-check docs + MDN Geolocation API
// src/lib/services/location.service.ts
import ipRangeCheck from "ip-range-check";

interface OfficeLocation {
  allowedIPs: string[];   // CIDR ranges or exact IPs, e.g. ["192.168.1.0/24", "10.0.0.1"]
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number | null;
}

type LocationResult = { allowed: true } | { allowed: false; reason: string };

export function verifyLocation(
  clientIp: string,
  coords: { latitude: number; longitude: number } | undefined,
  office: OfficeLocation
): LocationResult {
  const ipAllowed = office.allowedIPs.length === 0 || ipRangeCheck(clientIp, office.allowedIPs);

  if (coords && office.latitude && office.longitude && office.radiusMeters) {
    const dist = haversineDistance(coords.latitude, coords.longitude, office.latitude, office.longitude);
    const gpsAllowed = dist <= office.radiusMeters;
    if (!gpsAllowed) {
      return { allowed: false, reason: "Lokasi Anda di luar radius yang diizinkan" };
    }
    return { allowed: true };
  }

  // GPS not available — fall back to IP check only
  if (!ipAllowed) {
    return { allowed: false, reason: "Alamat IP Anda tidak berada dalam rentang yang diizinkan" };
  }
  return { allowed: true };
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

**Note:** Haversine is hand-rolled here intentionally — it's 10 lines and has no edge cases at office-scale distances (< 5km). No library needed.

### Pattern 3: Client-Side GPS Collection in Clock-In Button

The `ClockInButton` is a `"use client"` component. It calls `navigator.geolocation.getCurrentPosition()` when the button is clicked, then passes coordinates to the Server Action.

```typescript
// src/app/(dashboard)/attendance/_components/clock-in-button.tsx
"use client";

import { useState, useTransition } from "react";
import { clockInAction } from "@/lib/actions/attendance.actions";

export function ClockInButton({ isClockedIn }: { isClockedIn: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "verifying" | "done">("idle");

  function handleClick() {
    setStatus("verifying");
    startTransition(async () => {
      if (!navigator.geolocation) {
        // No GPS support — call action without coords
        const result = await clockInAction(undefined);
        handleResult(result);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const result = await clockInAction({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          handleResult(result);
        },
        async () => {
          // User denied or unavailable — fall back to IP only
          const result = await clockInAction(undefined);
          handleResult(result);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    });
  }

  // ...
}
```

### Pattern 4: Attendance Flag Calculation (Server-Side)

Late/early/overtime flags are calculated at clock-in/clock-out time and stored on the record. Do NOT recalculate on read.

```typescript
// Source: date-fns docs + date-fns-tz docs
// Timezone: Asia/Jakarta (WIB, UTC+7)
import { toZonedTime } from "date-fns-tz";

const TZ = "Asia/Jakarta";

function calculateAttendanceFlags(
  clockInUtc: Date,
  clockOutUtc: Date | null,
  scheduleStart: string, // "08:00" from OfficeLocation
  scheduleEnd: string,   // "17:00" from OfficeLocation
  overtimeThresholdMinutes: number = 30
) {
  const localClockIn = toZonedTime(clockInUtc, TZ);
  const [startH, startM] = scheduleStart.split(":").map(Number);
  const scheduledStart = new Date(localClockIn);
  scheduledStart.setHours(startH, startM, 0, 0);

  const isLate = localClockIn > scheduledStart;
  const lateMinutes = isLate
    ? Math.round((localClockIn.getTime() - scheduledStart.getTime()) / 60000)
    : 0;

  let isEarlyOut = false;
  let overtimeMinutes = 0;
  let totalMinutes = 0;

  if (clockOutUtc) {
    const localClockOut = toZonedTime(clockOutUtc, TZ);
    const [endH, endM] = scheduleEnd.split(":").map(Number);
    const scheduledEnd = new Date(localClockOut);
    scheduledEnd.setHours(endH, endM, 0, 0);

    isEarlyOut = localClockOut < scheduledEnd;
    const diffAfterEnd = (localClockOut.getTime() - scheduledEnd.getTime()) / 60000;
    overtimeMinutes = diffAfterEnd >= overtimeThresholdMinutes ? Math.round(diffAfterEnd) : 0;
    totalMinutes = Math.round((clockOutUtc.getTime() - clockInUtc.getTime()) / 60000);
  }

  return { isLate, lateMinutes, isEarlyOut, overtimeMinutes, totalMinutes };
}
```

### Pattern 5: Working Days Calculation for Leave

Leave balances for `cuti tahunan` (annual leave) are in **working days**, not calendar days. When an employee submits a leave request spanning a date range, count working days only (exclude weekends).

```typescript
// Source: date-fns docs
import { eachDayOfInterval, isWeekend } from "date-fns";

export function countWorkingDays(startDate: Date, endDate: Date): number {
  return eachDayOfInterval({ start: startDate, end: endDate })
    .filter((day) => !isWeekend(day))
    .length;
}
```

**Note:** Indonesian public holidays are NOT handled in this phase (LEAVE-02 only specifies leave types, not public holiday calendars). The system counts Mon-Fri as working days.

### Pattern 6: Atomic Leave Balance Deduction (Prisma Interactive Transaction)

When a leave request is approved, the balance must be deducted atomically with the status update.

```typescript
// Source: Prisma docs - https://www.prisma.io/docs/orm/prisma-client/queries/transactions
import { prisma } from "@/lib/prisma";

export async function approveLeaveRequest(
  leaveRequestId: string,
  approverId: string,
  notes?: string
): Promise<ServiceResult<void>> {
  try {
    await prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.findUnique({
        where: { id: leaveRequestId },
        include: { leaveType: true },
      });

      if (!request || request.status !== "PENDING") {
        throw new Error("Permintaan tidak ditemukan atau sudah diproses");
      }

      const workingDays = countWorkingDays(request.startDate, request.endDate);

      // Atomically decrement balance
      const balance = await tx.leaveBalance.update({
        where: {
          employeeId_leaveTypeId: {
            employeeId: request.employeeId,
            leaveTypeId: request.leaveTypeId,
          },
        },
        data: { usedDays: { increment: workingDays } },
      });

      if (balance.usedDays > balance.allocatedDays) {
        throw new Error("Saldo cuti tidak mencukupi");
      }

      await tx.leaveRequest.update({
        where: { id: leaveRequestId },
        data: {
          status: "APPROVED",
          approvedById: approverId,
          approverNotes: notes,
          approvedAt: new Date(),
        },
      });
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Gagal menyetujui" };
  }
}
```

### Pattern 7: Excel Export via Route Handler

```typescript
// src/app/api/attendance/export/route.ts
// Source: verified SheetJS pattern from davegray.codes
import * as XLSX from "xlsx";
import { auth } from "@/lib/auth";
import { getMonthlyAttendanceRecap } from "@/lib/services/attendance.service";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || !["HR_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));

  const data = await getMonthlyAttendanceRecap({ month, year });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Absensi");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Disposition": `attachment; filename="absensi-${year}-${month}.xlsx"`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
```

### Pattern 8: PDF Export via Route Handler

```typescript
// src/app/api/attendance/export/route.ts (PDF branch, or separate route)
// Source: @react-pdf/renderer issue #2350 - stream-to-buffer workaround
import { renderToStream } from "@react-pdf/renderer";
import { AttendancePDFDocument } from "@/lib/pdf/attendance-pdf"; // React component

export async function GET(request: Request) {
  // ... auth check, fetch data ...

  const stream = await renderToStream(<AttendancePDFDocument data={data} />);

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const buffer = Buffer.concat(chunks);

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Disposition": `attachment; filename="absensi-${year}-${month}.pdf"`,
      "Content-Type": "application/pdf",
    },
  });
}
```

**Important:** `@react-pdf/renderer` components use its own primitive elements (`<Document>`, `<Page>`, `<View>`, `<Text>`, `<StyleSheet>`) — NOT HTML or Tailwind classes.

### Anti-Patterns to Avoid

- **Calculating flags on every read:** Compute `isLate`, `isEarlyOut`, `overtimeMinutes` once at clock-in/clock-out time and store them. Never recalculate on-the-fly in list queries.
- **Using Next.js middleware for clock-in IP capture:** The middleware runs on edge runtime and can't do database calls. Capture IP in the Server Action via `headers()`.
- **Client-side GPS as the only check:** Always enforce at least IP check on the server. GPS coordinates sent from client must never be trusted alone without server-side distance calculation.
- **Using `navigator.geolocation` in a Server Component:** It's a browser API. Only call it in a `"use client"` component event handler.
- **Blocking the button during GPS permission prompt:** Use `useTransition` + show "Memverifikasi lokasi..." state immediately. If GPS times out (8s), fall back automatically — don't leave user waiting indefinitely.
- **Storing leave balance as a field on Employee:** Use a separate `LeaveBalance` model with `(employeeId, leaveTypeId)` composite key. This allows per-type balance tracking and proper atomicity.
- **Using `PDFDownloadLink` from react-pdf in a Server Component:** `PDFDownloadLink` is client-only. For server-side export, use `renderToStream` in a Route Handler.

---

## Schema Changes Required

The following schema additions are needed. These go into a single new migration.

### OfficeLocation additions

```prisma
model OfficeLocation {
  // ... existing fields ...
  workStartTime String?  // "08:00" — HH:mm format
  workEndTime   String?  // "17:00" — HH:mm format

  employees     Employee[]         // ADD this relation
  attendances   AttendanceRecord[]
}
```

**Critical:** The existing `Employee.officeLocationId` field has NO `@relation` directive currently. This must be verified and fixed in the migration.

### New Models

```prisma
enum AttendanceStatus {
  ON_TIME
  LATE
  EARLY_OUT
  OVERTIME
  LATE_AND_EARLY_OUT
  LATE_AND_OVERTIME
}

model AttendanceRecord {
  id               String           @id @default(cuid())
  employeeId       String
  officeLocationId String
  date             DateTime         @db.Date
  clockIn          DateTime?
  clockOut         DateTime?
  clockInIp        String?
  clockOutIp       String?
  clockInLat       Float?
  clockInLon       Float?
  isLate           Boolean          @default(false)
  lateMinutes      Int              @default(0)
  isEarlyOut       Boolean          @default(false)
  earlyOutMinutes  Int              @default(0)
  overtimeMinutes  Int              @default(0)
  totalMinutes     Int              @default(0)
  isManualOverride Boolean          @default(false)
  overrideById     String?
  overrideReason   String?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  employee       Employee       @relation(fields: [employeeId], references: [id])
  officeLocation OfficeLocation @relation(fields: [officeLocationId], references: [id])
  overrideBy     User?          @relation("AttendanceOverrides", fields: [overrideById], references: [id])

  @@unique([employeeId, date])
  @@index([employeeId, date])
  @@map("attendance_records")
}

enum LeaveStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

model LeaveRequest {
  id             String      @id @default(cuid())
  employeeId     String
  leaveTypeId    String
  startDate      DateTime    @db.Date
  endDate        DateTime    @db.Date
  workingDays    Int
  reason         String
  attachmentPath String?
  attachmentName String?
  status         LeaveStatus @default(PENDING)
  approvedById   String?
  approverNotes  String?
  approvedAt     DateTime?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  employee   Employee  @relation(fields: [employeeId], references: [id])
  leaveType  LeaveType @relation(fields: [leaveTypeId], references: [id])
  approvedBy User?     @relation("LeaveApprovals", fields: [approvedById], references: [id])

  @@index([employeeId, status])
  @@index([status, createdAt])
  @@map("leave_requests")
}

model LeaveBalance {
  id            String   @id @default(cuid())
  employeeId    String
  leaveTypeId   String
  year          Int
  allocatedDays Int
  usedDays      Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  employee  Employee  @relation(fields: [employeeId], references: [id])
  leaveType LeaveType @relation(fields: [leaveTypeId], references: [id])

  @@unique([employeeId, leaveTypeId, year])
  @@map("leave_balances")
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IP CIDR range matching | Manual bitmask arithmetic | `ip-range-check` | IPv4-in-IPv6 mapping, subnet edge cases, IPv6 support — many subtle bugs |
| Excel file generation | Manual OOXML XML strings | `xlsx` (SheetJS) | OOXML format requires complex zip structure, cell type metadata, escape sequences |
| PDF generation | HTML + print CSS | `@react-pdf/renderer` | CSS print is unreliable across browsers; react-pdf renders deterministically server-side |
| GPS distance calculation | Third-party `geolib` or `haversine` package | Inline Haversine (10 lines) | At office-scale distances, the formula is trivial; no package needed |
| Date/time arithmetic | Manual millisecond math | `date-fns` + `date-fns-tz` | Timezone edge cases (DST, UTC offset changes) are subtle; both are already installed |
| Working-days count | Custom loop | `eachDayOfInterval` + `isWeekend` from `date-fns` | Already installed; handles month boundaries correctly |
| Leave balance atomicity | Application-level mutex | Prisma interactive transaction | DB transaction is the only correct solution for concurrent approvals |

---

## Common Pitfalls

### Pitfall 1: Timezone Mismatch in Late/Overtime Calculation

**What goes wrong:** `clockIn` is stored as UTC in PostgreSQL (which is correct). If you compare it to the schedule time ("08:00") without converting to WIB first, employees in Jakarta appear to clock in at 01:00 UTC and get flagged as early, not late.

**Why it happens:** `new Date()` on the server returns UTC. The `date` field in Prisma is also UTC.

**How to avoid:** Always use `toZonedTime(utcDate, "Asia/Jakarta")` from `date-fns-tz` before any schedule comparison. Set the WIB offset constant at the top of `attendance.service.ts`.

**Warning signs:** Flags are consistently off by 7 hours.

### Pitfall 2: Double Clock-In on Same Day

**What goes wrong:** Employee clicks clock-in button twice (network lag, double-click). Two `AttendanceRecord` rows are created for the same employee+date.

**Why it happens:** No database-level uniqueness constraint.

**How to avoid:** The schema above includes `@@unique([employeeId, date])` on `AttendanceRecord`. The action must catch Prisma's `P2002` (unique constraint violation) error and return a user-friendly message.

**Warning signs:** Employees see duplicate records.

### Pitfall 3: Leave Balance Race Condition (Double Approval)

**What goes wrong:** HR Admin and Manager both click "Approve" at the same time. Both read balance as sufficient, both decrement — balance goes negative.

**Why it happens:** Two concurrent transactions both passed the balance check before either committed.

**How to avoid:** Use Prisma interactive transaction. Check `request.status === "PENDING"` inside the transaction. The `@@unique([employeeId, date])` constraint on AttendanceRecord won't help here — use the transaction pattern from Pattern 6.

**Warning signs:** `usedDays > allocatedDays` in the database.

### Pitfall 4: GPS Coordinates Sent by Client Cannot Be Trusted Alone

**What goes wrong:** A malicious employee sends fabricated GPS coordinates that match the office location, allowing clock-in from home.

**Why it happens:** GPS coordinates are provided by the browser and passed to the server action — they can be spoofed.

**How to avoid:** GPS is a convenience enhancement that reduces friction for legitimate users. The IP check is the primary security control. If IP check fails but GPS passes, deny. If IP passes, GPS is additional confirmation (not bypass). Document this policy clearly in the code.

**Warning signs:** Employees clock in from obviously impossible locations.

### Pitfall 5: `@react-pdf/renderer` PDFDownloadLink in a Server Component

**What goes wrong:** Build error or hydration error: "document is not defined" or "Cannot read properties of undefined."

**Why it happens:** `PDFDownloadLink` uses browser APIs internally. It cannot run server-side.

**How to avoid:** Never use `PDFDownloadLink` in this project. All PDF generation goes through Route Handlers using `renderToStream`. The download is triggered by a link pointing to `/api/attendance/export?format=pdf&month=...`.

**Warning signs:** Build succeeds but runtime error in production; works in dev because of client-side fallback.

### Pitfall 6: Server Action Body Size Limit for File Attachments

**What goes wrong:** Employee uploads a doctor's note as a leave attachment. Server action returns 413 or silently truncates the file.

**Why it happens:** Next.js Server Actions have a default 1MB body size limit.

**How to avoid:** Set `experimental.serverActions.bodySizeLimit` in `next.config.js`. Alternatively, upload the file via a separate API Route Handler (POST with multipart/form-data) that returns a path, then store the path in the leave request action. Given the context (doctor's notes, PDFs), a 5MB limit is appropriate.

```javascript
// next.config.js
module.exports = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
};
```

**Warning signs:** File upload appears to succeed on client but no file is stored.

### Pitfall 7: `OfficeLocation` Missing Relation to `Employee`

**What goes wrong:** The current schema has `officeLocationId String?` on Employee but no `@relation` directive pointing to OfficeLocation. Prisma will not generate the `officeLocation` include relation.

**Why it happens:** The schema was likely written incrementally and the relation was deferred.

**How to avoid:** The migration for Phase 3 MUST add `@relation(fields: [officeLocationId], references: [id])` to the `Employee` model and add the back-relation `employees Employee[]` to `OfficeLocation`.

**Warning signs:** `prisma.employee.findUnique({ include: { officeLocation: true } })` causes TypeScript error.

---

## Indonesian Leave Law Reference (LEAVE-02)

This is business logic that must be correctly modeled in data. These are the leave types from UU No. 13 Tahun 2003 as specified in requirements.

| Leave Type (Indonesian) | Key (enum value) | Annual Quota | Paid | Gender Restriction | Notes |
|-------------------------|------------------|-------------|------|--------------------|----|
| Cuti Tahunan | `CUTI_TAHUNAN` | 12 working days/year | Yes | None | Accrues after 12 months of service |
| Cuti Sakit | `CUTI_SAKIT` | No fixed annual limit | Yes | None | Requires doctor's note (attachment) |
| Cuti Melahirkan | `CUTI_MELAHIRKAN` | ~90 calendar days (3 months) | Yes | Female only | 1.5 months pre + 1.5 months post delivery |
| Cuti Keguguran | `CUTI_KEGUGURAN` | ~45 calendar days (1.5 months) | Yes | Female only | Per medical certificate |
| Cuti Haid | `CUTI_HAID` | 2 days/month | Yes | Female only | Days 1-2 of menstrual cycle |
| Cuti Pernikahan | `CUTI_PERNIKAHAN` | 3 days | Yes | None | Employee's own wedding |
| Cuti Pernikahan Anak | `CUTI_PERNIKAHAN_ANAK` | 2 days | Yes | None | Child's wedding |
| Cuti Khitan/Baptis Anak | `CUTI_KHITAN_BAPTIS_ANAK` | 2 days | Yes | None | Child's circumcision or baptism |
| Cuti Kematian Keluarga Inti | `CUTI_KEMATIAN_KELUARGA_INTI` | 2 days | Yes | None | Death of spouse, parent, child |
| Cuti Kematian Keluarga | `CUTI_KEMATIAN_KELUARGA` | 1 day | Yes | None | Death of in-laws or siblings |
| Cuti Ibadah Wajib | `CUTI_IBADAH_WAJIB` | As needed | Yes | None | Hajj/pilgrimage (typically 40-50 days) |

**Implementation note:** `LeaveType` already exists in the schema with `annualQuota` and `genderRestriction` fields. These types are seeded as master data — they are NOT hardcoded in application logic. The `LeaveBalance` model tracks usage per `(employee, leaveType, year)`.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `zonedTimeToUtc` / `utcToZonedTime` from date-fns-tz v2/v3 | `fromZonedTime` / `toZonedTime` in date-fns-tz v3 | Functions renamed in v3 — use new names |
| `date-fns` v2 standalone timezone via `date-fns-tz` only | `date-fns` v4 + optional `@date-fns/tz` `TZDate` | For this project, `date-fns-tz` v3 (already installed) is sufficient; `@date-fns/tz` is not needed |
| `XLSX.writeFile()` to disk | `XLSX.write({ type: "buffer" })` returned in Response | File system not available on all hosts; buffer approach works everywhere |
| `PDFDownloadLink` for client-triggered PDF | Route Handler + `renderToStream` stream-to-buffer | Server-side export is the only reliable approach in App Router |

**Deprecated/outdated:**
- `utcToZonedTime` (date-fns-tz v2 name): Renamed to `toZonedTime` in v3 — use `toZonedTime`
- `zonedTimeToUtc` (date-fns-tz v2 name): Renamed to `fromZonedTime` in v3 — use `fromZonedTime`

---

## Open Questions

1. **Overtime threshold (minutes before flagging)**
   - What we know: CONTEXT.md defers this to Claude's discretion
   - Recommendation: Default to 30 minutes (common Indonesian HRMS standard). Store as a constant in `src/lib/constants.ts` (`OVERTIME_THRESHOLD_MINUTES = 30`). This can be made configurable per office in a later iteration.

2. **Late grace period**
   - What we know: CONTEXT.md defers to Claude's discretion
   - Recommendation: Default 0 minutes (clock-in at 08:01 = late). If a grace period is desired later, add `gracePeriodMinutes` to `OfficeLocation`.

3. **Leave attachment storage (Claude's Discretion)**
   - What we know: Files need to be stored somewhere; existing `EmployeeDocument` uses `filePath` (local disk)
   - Recommendation: Reuse the same disk-storage approach as `EmployeeDocument` — store in `public/uploads/leave-attachments/[leaveRequestId]/`. Configure `next.config.js` server action body limit to 5MB. This is consistent with Phase 2 patterns.

4. **HR Admin manual attendance override UI (Claude's Discretion)**
   - Recommendation: Dialog modal pattern (consistent with `ConfirmDialog` and `UserFormDialog` patterns from Phases 1-2). A dedicated `ManualAttendanceDialog` with fields: employee (select), date (date picker), clock-in time, clock-out time, reason.

5. **Leave balance initialization for new employees**
   - What we know: Not explicitly specified; `LeaveBalance` rows must exist before an employee can submit leave
   - Recommendation: Create `LeaveBalance` rows for all active leave types when an employee is created (in the `createEmployee` service function). Annual balance resets on January 1 each year (handled by a seed/cron — this is likely a Phase 4/5 concern; for Phase 3, initialize in the create-employee flow).

6. **Notification of leave approval/rejection (LEAVE-03)**
   - What we know: "Employee is notified of the decision" is required; notifications are deferred per CONTEXT.md domain boundary
   - Recommendation: The CONTEXT.md domain section says "Payroll calculations and notifications (email/push) are out of scope." However, LEAVE-03 requires notification. Resolve: show a toast in the leave page that the status changed (polling/revalidation via `revalidatePath`). True email/push notifications are out of scope.

---

## Code Examples

### Verified: Prisma `$transaction` Pattern for Leave Approval

```typescript
// Source: Prisma docs - prisma.io/docs/orm/prisma-client/queries/transactions
await prisma.$transaction(async (tx) => {
  // Read + validate inside transaction
  const request = await tx.leaveRequest.findUnique({ where: { id } });
  if (request?.status !== "PENDING") throw new Error("Already processed");

  // Atomic increment (prevents negative balance via application-level check)
  await tx.leaveBalance.update({
    where: { employeeId_leaveTypeId_year: { employeeId: request.employeeId, leaveTypeId: request.leaveTypeId, year: new Date().getFullYear() } },
    data: { usedDays: { increment: request.workingDays } },
  });

  await tx.leaveRequest.update({
    where: { id },
    data: { status: "APPROVED", approvedById, approvedAt: new Date() },
  });
});
```

### Verified: Next.js `headers()` for IP in Server Action

```typescript
// Source: nextjs.org/docs/app/api-reference/functions/headers (updated 2026-02-27)
import { headers } from "next/headers";

// Inside a Server Action:
const headersList = await headers(); // Must await in Next.js 15
const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim()
  ?? headersList.get("x-real-ip")
  ?? "unknown";
```

### Verified: Browser Geolocation with Timeout and Fallback

```typescript
// Source: MDN Web Docs - Geolocation API
navigator.geolocation.getCurrentPosition(
  (position) => { /* success */ },
  (error) => { /* denied or unavailable — fall back to IP-only */ },
  { timeout: 8000, enableHighAccuracy: true, maximumAge: 0 }
);
```

### Verified: ip-range-check Usage

```typescript
// Source: npm package danielcompton/ip-range-check
import ipRangeCheck from "ip-range-check";

// allowedIPs is string[] from OfficeLocation: ["192.168.1.0/24", "10.0.0.5"]
const isAllowed = ipRangeCheck(clientIp, allowedIPs); // returns boolean
```

### Verified: date-fns-tz v3 API (NOT v2 names)

```typescript
// Source: date-fns-tz v3 changelog (installed version is ^3.2.0)
import { toZonedTime, fromZonedTime } from "date-fns-tz";
// NOT: utcToZonedTime / zonedTimeToUtc (v2 names — do not use)

const jakartaTime = toZonedTime(utcDate, "Asia/Jakarta");
```

---

## Sources

### Primary (HIGH confidence)
- Next.js official docs (nextjs.org/docs, last updated 2026-02-27) — `headers()` API, server actions body size limit config
- Prisma docs (prisma.io/docs) — Interactive transactions, atomic operators
- MDN Web Docs — Geolocation API `getCurrentPosition` signature and options

### Secondary (MEDIUM confidence)
- date-fns v4 blog (blog.date-fns.org/v40-with-time-zone-support/) — Verified: `TZDate` API, `@date-fns/tz` package existence; confirmed `date-fns-tz` v3 still works
- davegray.codes SheetJS Route Handler pattern — Verified against SheetJS official docs pattern
- @react-pdf/renderer GitHub issue #2350 — Verified: `renderToStream` + stream-to-buffer workaround confirmed working

### Tertiary (LOW confidence — marked for validation)
- ip-range-check npm page: API documented but TypeScript types need verification at install time (may need `@types/ip-range-check` or manual declarations)
- Indonesian leave law (dataon.com article) — Cross-checked with requirements spec; LEAVE-02 requirements are the authoritative source for this project, not web sources

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified via official docs or multiple authoritative sources
- Architecture: HIGH — follows established Phase 1-2 patterns; new patterns verified via official docs
- Pitfalls: HIGH — timezone/race condition/GPS trust issues are well-known and verified through documentation
- Leave law reference: MEDIUM — requirements spec (LEAVE-02) is authoritative; web source used only for cross-check

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (stable ecosystem; date-fns, Prisma, Next.js release cadence unlikely to break patterns within 30 days)
