# Architecture Research: HRMS PT. Sinergi Asta Nusantara

**Domain:** Human Resource Management System (multi-role, multi-module)
**Stack:** Next.js 14 App Router + TypeScript + PostgreSQL 16 + Prisma
**Researched:** 2026-02-27
**Overall Confidence:** MEDIUM (based on training knowledge of Next.js 14 App Router patterns; WebSearch unavailable for verification)

---

## Recommended Folder Structure

The key architectural decision in Next.js App Router is using **route groups** `(parentheses)` to organize by access level without affecting the URL path, combined with a **feature-based** module structure inside each group.

```
src/
├── app/
│   ├── (auth)/                          # Public routes (no session required)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx                   # Minimal layout, no sidebar
│   │
│   ├── (dashboard)/                     # All authenticated routes
│   │   ├── layout.tsx                   # Main layout: sidebar + header + auth check
│   │   ├── page.tsx                     # Dashboard home (redirects or shows role-specific view)
│   │   │
│   │   ├── employees/                   # Module: Employee Data Management
│   │   │   ├── page.tsx                 # Employee list (HR Admin: all, Manager: dept only)
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx             # Employee detail/profile
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx         # Edit employee (HR Admin only)
│   │   │   ├── new/
│   │   │   │   └── page.tsx             # Create employee (HR Admin only)
│   │   │   └── _components/             # Module-specific components (collocated)
│   │   │       ├── employee-table.tsx
│   │   │       ├── employee-form.tsx
│   │   │       └── document-upload.tsx
│   │   │
│   │   ├── recruitment/                 # Module: Recruitment Management
│   │   │   ├── page.tsx                 # Job postings list
│   │   │   ├── [jobId]/
│   │   │   │   ├── page.tsx             # Job posting detail + candidates
│   │   │   │   └── candidates/
│   │   │   │       └── [candidateId]/
│   │   │   │           └── page.tsx     # Candidate detail + status pipeline
│   │   │   ├── new/
│   │   │   │   └── page.tsx             # Create job posting
│   │   │   └── _components/
│   │   │       ├── job-posting-form.tsx
│   │   │       ├── candidate-pipeline.tsx
│   │   │       └── interview-scheduler.tsx
│   │   │
│   │   ├── attendance/                  # Module: Attendance & Leave
│   │   │   ├── page.tsx                 # Attendance overview / clock-in panel
│   │   │   ├── clock/
│   │   │   │   └── page.tsx             # Clock-in/out page (Employee)
│   │   │   ├── leave/
│   │   │   │   ├── page.tsx             # Leave requests list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx         # Submit leave request
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx         # Leave request detail + approval
│   │   │   ├── reports/
│   │   │   │   └── page.tsx             # Attendance reports (HR Admin / Manager)
│   │   │   └── _components/
│   │   │       ├── clock-widget.tsx
│   │   │       ├── leave-form.tsx
│   │   │       └── attendance-table.tsx
│   │   │
│   │   ├── payroll/                     # Module: Payroll Management
│   │   │   ├── page.tsx                 # Payroll periods list
│   │   │   ├── [periodId]/
│   │   │   │   ├── page.tsx             # Payroll period detail + employee breakdown
│   │   │   │   └── [employeeId]/
│   │   │   │       └── page.tsx         # Individual payslip detail
│   │   │   ├── run/
│   │   │   │   └── page.tsx             # Run payroll calculation (HR Admin)
│   │   │   ├── my-payslips/
│   │   │   │   └── page.tsx             # Employee views own payslips
│   │   │   └── _components/
│   │   │       ├── payroll-summary.tsx
│   │   │       ├── payslip-detail.tsx
│   │   │       └── pph21-breakdown.tsx
│   │   │
│   │   ├── settings/                    # System settings (Super Admin)
│   │   │   ├── page.tsx
│   │   │   ├── users/
│   │   │   │   └── page.tsx             # User account management
│   │   │   ├── offices/
│   │   │   │   └── page.tsx             # Office locations + IP/GPS config
│   │   │   ├── departments/
│   │   │   │   └── page.tsx             # Department management
│   │   │   └── positions/
│   │   │       └── page.tsx             # Position/job title management
│   │   │
│   │   └── profile/                     # Employee's own profile
│   │       └── page.tsx
│   │
│   ├── api/                             # API Routes (used selectively)
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts             # NextAuth.js v5 handler
│   │   ├── upload/
│   │   │   └── route.ts                 # File upload endpoint
│   │   └── pdf/
│   │       ├── payslip/
│   │       │   └── [id]/
│   │       │       └── route.ts         # Generate payslip PDF
│   │       └── offer-letter/
│   │           └── [id]/
│   │               └── route.ts         # Generate offer letter PDF
│   │
│   ├── layout.tsx                       # Root layout (html, body, providers)
│   └── globals.css                      # Tailwind base styles
│
├── components/                          # Shared UI components
│   ├── ui/                              # shadcn/ui components (auto-generated)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   ├── select.tsx
│   │   └── ...
│   ├── layout/                          # Layout primitives
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── breadcrumb-nav.tsx
│   │   └── role-badge.tsx
│   └── shared/                          # Domain-agnostic reusable components
│       ├── data-table.tsx               # Generic table with pagination/sorting
│       ├── file-uploader.tsx
│       ├── status-badge.tsx
│       ├── confirm-dialog.tsx
│       └── date-range-picker.tsx
│
├── lib/                                 # Core library code
│   ├── prisma.ts                        # Prisma client singleton
│   ├── auth.ts                          # NextAuth.js v5 configuration
│   ├── auth-options.ts                  # Auth options (credentials provider, callbacks)
│   │
│   ├── services/                        # Business logic layer (CRITICAL)
│   │   ├── employee.service.ts
│   │   ├── recruitment.service.ts
│   │   ├── attendance.service.ts
│   │   ├── leave.service.ts
│   │   ├── payroll.service.ts
│   │   ├── pph21.service.ts             # Isolated PPh 21 tax calculation engine
│   │   ├── bpjs.service.ts              # BPJS Kesehatan + Ketenagakerjaan calculation
│   │   └── pdf.service.ts              # PDF generation orchestration
│   │
│   ├── validators/                      # Zod schemas (shared between client + server)
│   │   ├── employee.schema.ts
│   │   ├── recruitment.schema.ts
│   │   ├── attendance.schema.ts
│   │   ├── leave.schema.ts
│   │   ├── payroll.schema.ts
│   │   └── auth.schema.ts
│   │
│   ├── actions/                         # Server Actions (grouped by module)
│   │   ├── employee.actions.ts
│   │   ├── recruitment.actions.ts
│   │   ├── attendance.actions.ts
│   │   ├── leave.actions.ts
│   │   └── payroll.actions.ts
│   │
│   ├── constants/                       # Domain constants
│   │   ├── roles.ts                     # Role enum + permission map
│   │   ├── pph21-rates.ts              # Tax brackets, PTKP values
│   │   ├── bpjs-rates.ts              # BPJS percentage constants
│   │   └── leave-types.ts             # Leave type definitions
│   │
│   └── utils/                           # Pure utility functions
│       ├── currency.ts                  # Rupiah formatting
│       ├── date.ts                      # Date formatting (Indonesian locale)
│       └── ip-geo.ts                    # IP/GPS validation helpers
│
├── types/                               # TypeScript type definitions
│   ├── next-auth.d.ts                   # NextAuth session type augmentation
│   ├── employee.ts
│   ├── payroll.ts
│   └── index.ts
│
├── prisma/
│   ├── schema.prisma                    # Database schema
│   ├── seed.ts                          # Seed data (admin user, departments, etc.)
│   └── migrations/                      # Prisma migration history
│
├── public/
│   ├── logo.svg
│   └── images/
│
├── middleware.ts                         # Next.js middleware (RBAC + route protection)
│
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── .env.local                           # Environment variables (not committed)
└── package.json
```

### Key Design Decisions in Folder Structure

**Why NOT separate route groups per role (e.g., `(admin)/`, `(employee)/`)?**
Because modules are shared across roles with different permission levels. An Employee and HR Admin both access `/attendance` but see different data. Splitting by role creates route duplication. Instead, use a single `(dashboard)` group and enforce permissions at the component/action level.

**Why `_components/` inside each module route?**
Next.js App Router convention: underscore-prefixed folders are excluded from routing. Collocating module-specific components with their routes keeps related code together and makes it obvious which components belong to which module.

**Why `lib/services/` as a separate layer?**
Server Actions call services. API routes call services. This prevents business logic duplication. The service layer is the single source of truth for "how does payroll work" or "how is PPh 21 calculated." This is essential for the thesis -- clean architecture with testable business logic.

---

## Key Database Models

### Entity Relationship Overview

```
User (auth) ─────────────── 1:1 ──────────────── Employee (HR data)
  │                                                    │
  │                                                    ├── 1:N ── EmployeeDocument
  │                                                    ├── 1:N ── EmergencyContact
  │                                                    ├── 1:N ── AttendanceRecord
  │                                                    ├── 1:N ── LeaveRequest
  │                                                    ├── 1:N ── PayrollItem
  │                                                    │
  │                                                    ├── N:1 ── Department
  │                                                    ├── N:1 ── Position
  │                                                    └── N:1 ── OfficeLocation
  │
  └── Role (enum on User)

Department ── 1:N ── Employee
           ── 1:1 ── User (manager, nullable)

OfficeLocation ── allowedIpRanges (string[])
               ── latitude, longitude, radiusMeters

JobPosting ── 1:N ── Candidate
                      ├── 1:N ── Interview
                      └── status (pipeline enum)

PayrollPeriod ── 1:N ── PayrollItem
                         ├── baseSalary, allowances, overtime
                         ├── bpjsKesehatanEmployee, bpjsKesehatanEmployer
                         ├── bpjsJhtEmployee, bpjsJhtEmployer
                         ├── bpjsJpEmployee, bpjsJpEmployer
                         ├── grossIncome, taxableIncome
                         ├── pph21Monthly
                         └── netSalary

LeaveRequest ── N:1 ── LeaveType
             ── N:1 ── Employee (requester)
             ── N:1 ── User (approver, nullable)
```

### Core Prisma Models (Key Fields Only)

```prisma
enum Role {
  SUPER_ADMIN
  HR_ADMIN
  MANAGER
  EMPLOYEE
}

enum EmploymentStatus {
  ACTIVE
  INACTIVE
  TERMINATED
  ON_PROBATION
}

enum MaritalStatus {
  TK    // Tidak Kawin (single)
  K0    // Kawin, 0 tanggungan
  K1    // Kawin, 1 tanggungan
  K2    // Kawin, 2 tanggungan
  K3    // Kawin, 3 tanggungan
}

model User {
  id             String    @id @default(cuid())
  email          String    @unique
  hashedPassword String
  name           String
  role           Role      @default(EMPLOYEE)
  isActive       Boolean   @default(true)
  employee       Employee?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}

model Employee {
  id               String           @id @default(cuid())
  userId           String           @unique
  user             User             @relation(fields: [userId], references: [id])
  employeeNumber   String           @unique    // NIP / employee ID

  // Personal
  fullName         String
  dateOfBirth      DateTime
  gender           String
  phone            String
  address          String
  ktpNumber        String?          // NIK KTP
  npwpNumber       String?          // NPWP
  maritalStatus    MaritalStatus    @default(TK)

  // Employment
  departmentId     String
  department       Department       @relation(fields: [departmentId], references: [id])
  positionId       String
  position         Position         @relation(fields: [positionId], references: [id])
  officeLocationId String
  officeLocation   OfficeLocation   @relation(fields: [officeLocationId], references: [id])
  joinDate         DateTime
  employmentStatus EmploymentStatus @default(ACTIVE)

  // Salary
  baseSalary       Decimal          // Monthly base salary in IDR

  // Relations
  documents        EmployeeDocument[]
  emergencyContacts EmergencyContact[]
  attendanceRecords AttendanceRecord[]
  leaveRequests    LeaveRequest[]
  payrollItems     PayrollItem[]

  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}

model Department {
  id        String     @id @default(cuid())
  name      String     @unique
  managerId String?    @unique    // User ID of department manager
  manager   User?      @relation(fields: [managerId], references: [id])
  employees Employee[]
}

model Position {
  id        String     @id @default(cuid())
  name      String     @unique
  employees Employee[]
}

model OfficeLocation {
  id             String   @id @default(cuid())
  name           String                        // e.g., "Kantor Pusat Jakarta"
  address        String
  allowedIps     String[] @default([])         // CIDR ranges: ["192.168.1.0/24"]
  latitude       Float?
  longitude      Float?
  radiusMeters   Int?     @default(100)        // GPS geofence radius
  employees      Employee[]
}

model EmployeeDocument {
  id          String   @id @default(cuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
  type        String                          // "KTP", "NPWP", "CONTRACT", "OTHER"
  fileName    String
  fileUrl     String                          // Storage path or URL
  fileSize    Int
  uploadedAt  DateTime @default(now())
}

model EmergencyContact {
  id          String   @id @default(cuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
  name        String
  relationship String
  phone       String
}

model AttendanceRecord {
  id             String    @id @default(cuid())
  employeeId     String
  employee       Employee  @relation(fields: [employeeId], references: [id])
  date           DateTime  @db.Date
  clockIn        DateTime
  clockOut       DateTime?
  clockInIp      String?
  clockOutIp     String?
  clockInLat     Float?
  clockInLng     Float?
  clockOutLat    Float?
  clockOutLng    Float?
  status         String    @default("PRESENT") // PRESENT, LATE, ABSENT, HALF_DAY
  workHours      Decimal?                       // Calculated on clock-out
  overtimeHours  Decimal?  @default(0)
  notes          String?

  @@unique([employeeId, date])                  // One record per employee per day
}

model LeaveType {
  id            String         @id @default(cuid())
  name          String         @unique           // "Cuti Tahunan", "Sakit", "Melahirkan"
  defaultQuota  Int                               // Days per year
  isPaid        Boolean        @default(true)
  leaveRequests LeaveRequest[]
}

model LeaveRequest {
  id           String    @id @default(cuid())
  employeeId   String
  employee     Employee  @relation(fields: [employeeId], references: [id])
  leaveTypeId  String
  leaveType    LeaveType @relation(fields: [leaveTypeId], references: [id])
  startDate    DateTime  @db.Date
  endDate      DateTime  @db.Date
  totalDays    Int
  reason       String
  status       String    @default("PENDING")    // PENDING, APPROVED, REJECTED
  approverId   String?
  approvedAt   DateTime?
  rejectedReason String?
  createdAt    DateTime  @default(now())
}

model LeaveBalance {
  id          String   @id @default(cuid())
  employeeId  String
  leaveTypeId String
  year        Int
  quota       Int                               // Total allowed days
  used        Int      @default(0)
  remaining   Int                               // Calculated: quota - used

  @@unique([employeeId, leaveTypeId, year])
}

model PayrollPeriod {
  id           String        @id @default(cuid())
  month        Int                               // 1-12
  year         Int
  status       String        @default("DRAFT")  // DRAFT, CALCULATED, FINALIZED
  calculatedAt DateTime?
  finalizedAt  DateTime?
  calculatedBy String?                           // User ID who ran calculation
  payrollItems PayrollItem[]

  @@unique([month, year])
}

model PayrollItem {
  id                     String        @id @default(cuid())
  payrollPeriodId        String
  payrollPeriod          PayrollPeriod @relation(fields: [payrollPeriodId], references: [id])
  employeeId             String
  employee               Employee      @relation(fields: [employeeId], references: [id])

  // Income
  baseSalary             Decimal
  allowances             Decimal       @default(0)
  overtimePay            Decimal       @default(0)
  grossIncome            Decimal                   // baseSalary + allowances + overtimePay

  // BPJS Deductions
  bpjsKesehatanEmployee  Decimal       @default(0) // 1% of salary
  bpjsKesehatanEmployer  Decimal       @default(0) // 4% of salary
  bpjsJhtEmployee        Decimal       @default(0) // 2% of salary (JHT)
  bpjsJhtEmployer        Decimal       @default(0) // 3.7% of salary (JHT)
  bpjsJpEmployee         Decimal       @default(0) // 1% of salary (JP)
  bpjsJpEmployer         Decimal       @default(0) // 2% of salary (JP)

  // Tax
  taxableIncome          Decimal       @default(0) // After PTKP
  pph21Annual            Decimal       @default(0) // Full-year projected tax
  pph21Monthly           Decimal       @default(0) // pph21Annual / 12

  // Net
  totalDeductions        Decimal       @default(0) // BPJS employee + PPh21
  netSalary              Decimal                   // grossIncome - totalDeductions

  @@unique([payrollPeriodId, employeeId])
}

// Allowance types configurable per employee
model EmployeeAllowance {
  id          String   @id @default(cuid())
  employeeId  String
  name        String                             // "Tunjangan Transportasi", "Tunjangan Makan"
  amount      Decimal

  @@unique([employeeId, name])
}

// Recruitment models
model JobPosting {
  id           String      @id @default(cuid())
  title        String
  departmentId String
  description  String
  requirements String
  status       String      @default("OPEN")      // OPEN, CLOSED, FILLED
  closingDate  DateTime?
  candidates   Candidate[]
  createdBy    String                             // User ID
  createdAt    DateTime    @default(now())
}

model Candidate {
  id           String      @id @default(cuid())
  jobPostingId String
  jobPosting   JobPosting  @relation(fields: [jobPostingId], references: [id])
  fullName     String
  email        String
  phone        String
  resumeUrl    String?
  status       String      @default("APPLIED")   // APPLIED, SCREENING, INTERVIEW, OFFERED, HIRED, REJECTED
  interviews   Interview[]
  notes        String?
  appliedAt    DateTime    @default(now())
}

model Interview {
  id           String    @id @default(cuid())
  candidateId  String
  candidate    Candidate @relation(fields: [candidateId], references: [id])
  scheduledAt  DateTime
  interviewerId String                           // User ID
  location     String?
  notes        String?
  result       String?                           // PASSED, FAILED, PENDING
}
```

### Design Rationale

**User vs Employee separation:** User holds auth credentials and role. Employee holds HR data. A Super Admin might be a User without an Employee record (system-only account). This separation keeps auth clean and prevents coupling auth changes to HR data queries.

**MaritalStatus as enum (not free text):** Required for PPh 21 PTKP calculation. TK/0, K/0, K/1, K/2, K/3 directly map to Indonesian tax tables. This must be an enum to prevent data entry errors that break payroll.

**Decimal for all money fields:** Never use Float for currency. Prisma's `Decimal` maps to PostgreSQL `NUMERIC`, which avoids floating-point rounding errors in salary calculations.

**PayrollItem stores calculated values (denormalized):** Once payroll is calculated and finalized, the numbers must be immutable. If an employee's base salary changes next month, last month's payslip must not change. Denormalization here is intentional and correct.

**`@@unique([employeeId, date])` on AttendanceRecord:** Enforces one clock-in per employee per day at the database level, preventing duplicate entries regardless of application bugs.

---

## Module Dependencies & Build Order

### Dependency Graph

```
                    ┌──────────────┐
                    │   Auth &     │
                    │   Settings   │ (Foundation - no module dependencies)
                    │   (Phase 0)  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Employee    │
                    │  Data Mgmt   │ (All other modules reference Employee)
                    │  (Phase 1)   │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐  ┌─▼──────────┐ │
       │ Attendance  │  │ Recruitment │ │
       │ & Leave     │  │             │ │
       │ (Phase 2)   │  │ (Phase 2)   │ │
       └──────┬──────┘  └─────────────┘ │
              │                         │
       ┌──────▼─────────────────────────▼┐
       │         Payroll                  │
       │    (Phase 3 - depends on        │
       │     Employee + Attendance)       │
       └──────────────────────────────────┘
```

### Recommended Build Order

**Phase 0: Foundation (Auth + Settings + Layout)**
Build first because everything depends on it.
- NextAuth.js v5 setup with credentials provider
- User model + role enum
- Middleware for route protection
- Dashboard layout (sidebar, header, breadcrumbs)
- Department, Position, OfficeLocation CRUD (Super Admin)
- Seed script for initial Super Admin account
- **Rationale:** You cannot demo any module without login and navigation.

**Phase 1: Employee Data Management**
Build second because every other module references Employee.
- Employee CRUD (create, read, update, list with filters)
- Document upload and management
- Emergency contacts
- Role-based visibility (HR Admin: all, Manager: department, Employee: own)
- Employee profile view
- **Rationale:** Attendance needs `employeeId`. Payroll needs `baseSalary` and `maritalStatus`. Recruitment ends with hiring (creating an Employee). Employee is the central entity.

**Phase 2a: Attendance & Leave**
Build third because Payroll depends on attendance data (overtime hours, work days).
- Clock-in/out with IP and GPS validation
- Office location IP/GPS configuration
- Leave request submission and approval workflow
- Leave balance tracking
- Attendance reports (daily, monthly recap)
- **Rationale:** Payroll needs `overtimeHours` from AttendanceRecord and leave deductions.

**Phase 2b: Recruitment (can be parallel with 2a)**
Independent of attendance/payroll. Only connects to Employee at the end (hiring).
- Job posting CRUD
- Candidate application tracking
- Interview scheduling
- Status pipeline management
- Offer letter PDF generation
- **Rationale:** Recruitment is the most isolated module. It only touches Employee when a candidate is hired. Can be built in parallel with Attendance if two developers are available, or deferred if solo.

**Phase 3: Payroll**
Build last because it depends on everything.
- PayrollPeriod management
- Salary calculation engine (base + allowances + overtime)
- BPJS calculation (Kesehatan + Ketenagakerjaan)
- PPh 21 calculation (annualization, PTKP, progressive rates)
- Payslip detail view
- Payslip PDF generation
- Monthly payroll report
- **Rationale:** Payroll reads from Employee (salary, marital status), AttendanceRecord (overtime hours), and LeaveBalance (unpaid leave deductions). It must be last.

---

## Critical Data Flows

### Attendance Clock-In Flow

```
Employee clicks "Clock In"
       │
       ▼
[Client: Browser]
  1. navigator.geolocation.getCurrentPosition() → {lat, lng}
  2. Call Server Action: clockIn({ lat, lng })
       │
       ▼
[Server Action: attendance.actions.ts]
  3. Verify session (must be authenticated Employee)
  4. Get employee record + officeLocation
       │
       ▼
[Service: attendance.service.ts]
  5. IP Validation:
     a. Get client IP from request headers (x-forwarded-for or x-real-ip)
     b. Load officeLocation.allowedIps
     c. Check if client IP is within any CIDR range
     d. If IP check fails AND GPS not provided → REJECT

  6. GPS Validation (if coordinates provided):
     a. Load officeLocation.{latitude, longitude, radiusMeters}
     b. Calculate Haversine distance between employee coords and office coords
     c. If distance > radiusMeters → REJECT

  7. Duplicate Check:
     a. Query AttendanceRecord where employeeId + date = today
     b. If record exists with clockIn → REJECT (already clocked in)

  8. Create AttendanceRecord:
     {
       employeeId, date: today,
       clockIn: now(),
       clockInIp: clientIp,
       clockInLat: lat, clockInLng: lng,
       status: isLate(now(), officeStartTime) ? "LATE" : "PRESENT"
     }
       │
       ▼
[Client: Success Response]
  9. Show confirmation with clock-in time
  10. Update UI to show "Clock Out" button
```

**Clock-Out** follows the same IP/GPS validation, then updates the existing record with `clockOut`, `clockOutIp`, `clockOutLat/Lng`, and calculates `workHours` and `overtimeHours`.

**IP Detection on Vercel:** On Vercel, the client IP is available via `request.headers.get('x-forwarded-for')`. This is reliable because Vercel sets it from the actual client IP. For local development, use a bypass flag in `.env` (e.g., `SKIP_IP_CHECK=true`).

### Payroll Calculation Flow

```
HR Admin clicks "Run Payroll" for period (month, year)
       │
       ▼
[Server Action: payroll.actions.ts]
  1. Verify role: must be HR_ADMIN or SUPER_ADMIN
  2. Create/get PayrollPeriod (DRAFT status)
  3. Fetch all ACTIVE employees
       │
       ▼
[Service: payroll.service.ts — loops per employee]
  4. For EACH employee:
     │
     ├── a. Get baseSalary from Employee
     ├── b. Get allowances from EmployeeAllowance (sum)
     ├── c. Get overtimeHours from AttendanceRecord for this month
     │       → overtimePay = overtimeHours * (baseSalary / 173) * 1.5
     │         (173 = standard monthly work hours in Indonesia)
     ├── d. grossIncome = baseSalary + allowances + overtimePay
     │
     ├── e. BPJS Calculation [bpjs.service.ts]:
     │       bpjsKesehatanEmployee = baseSalary * 0.01
     │       bpjsKesehatanEmployer = baseSalary * 0.04
     │       bpjsJhtEmployee = baseSalary * 0.02
     │       bpjsJhtEmployer = baseSalary * 0.037
     │       bpjsJpEmployee = min(baseSalary, jpMaxSalary) * 0.01
     │       bpjsJpEmployer = min(baseSalary, jpMaxSalary) * 0.02
     │
     ├── f. PPh 21 Calculation [pph21.service.ts]:
     │       (See detailed sub-flow below)
     │
     └── g. Create/update PayrollItem with all computed values

  5. Update PayrollPeriod status to CALCULATED
       │
       ▼
[PPh 21 Sub-Flow: pph21.service.ts]
  f1. annualGross = grossIncome * 12
  f2. biayaJabatan = min(annualGross * 0.05, 6_000_000)  // Max 6M/year
  f3. annualBpjsEmployee = (bpjsJhtEmployee + bpjsJpEmployee) * 12
  f4. netAnnualIncome = annualGross - biayaJabatan - annualBpjsEmployee
  f5. ptkp = lookupPTKP(employee.maritalStatus)
      // TK/0: 54,000,000  K/0: 58,500,000  K/1: 63,000,000
      // K/2: 67,500,000   K/3: 72,000,000
  f6. taxableIncome = max(0, netAnnualIncome - ptkp)
  f7. Apply progressive rates:
      // 0 - 60,000,000:         5%
      // 60,000,001 - 250,000,000:   15%
      // 250,000,001 - 500,000,000:  25%
      // 500,000,001 - 5,000,000,000: 30%
      // > 5,000,000,000:            35%
  f8. pph21Annual = sum of bracket taxes
  f9. pph21Monthly = pph21Annual / 12
```

**Important PPh 21 notes:**
- The annualization method (`grossIncome * 12`) is the standard approach for permanent employees. For non-permanent or partial-year employees, the calculation differs -- but for thesis scope, the annualization method for permanent employees is sufficient.
- PTKP values and tax brackets should be stored in `lib/constants/pph21-rates.ts` as plain constants, not in the database. They change infrequently (last changed in 2016 for PTKP, 2022 for brackets with the HPP law adding the 35% bracket). If they change, a code update is appropriate.
- The `biayaJabatan` (occupational cost deduction) is 5% of gross, capped at IDR 6,000,000/year (IDR 500,000/month).

### Leave Approval Flow

```
Employee submits leave request
       │
       ▼
[Server Action: leave.actions.ts]
  1. Validate: startDate < endDate, totalDays > 0
  2. Check LeaveBalance: remaining >= totalDays
  3. Check for overlapping approved leave in same date range
  4. Create LeaveRequest (status: PENDING)
       │
       ▼
[Manager or HR Admin views pending requests]
  5. Query LeaveRequests where:
     - Manager: employee.departmentId = manager's department
     - HR Admin: all pending requests
       │
       ▼
[Approve/Reject action]
  6a. APPROVE:
      - Update LeaveRequest: status = APPROVED, approverId, approvedAt
      - Update LeaveBalance: used += totalDays, remaining -= totalDays
      - Optionally: create AttendanceRecord entries with status "LEAVE" for each day

  6b. REJECT:
      - Update LeaveRequest: status = REJECTED, rejectedReason
      - LeaveBalance unchanged
```

---

## RBAC Implementation Pattern

### Strategy: Middleware + Server-Side Checks (Defense in Depth)

RBAC must be enforced at **three layers**:

1. **Middleware** (route-level): Block unauthorized users from even loading the page
2. **Server Actions / API Routes** (action-level): Verify permission before mutating data
3. **UI** (visual-level): Hide buttons/links the user cannot use (convenience, not security)

### Layer 1: Middleware (middleware.ts)

```typescript
// middleware.ts
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

// Define route permissions
const routePermissions: Record<string, Role[]> = {
  "/settings":        ["SUPER_ADMIN"],
  "/settings/users":  ["SUPER_ADMIN"],
  "/employees/new":   ["HR_ADMIN", "SUPER_ADMIN"],
  "/recruitment":     ["HR_ADMIN", "SUPER_ADMIN"],
  "/payroll/run":     ["HR_ADMIN", "SUPER_ADMIN"],
  "/payroll":         ["HR_ADMIN", "SUPER_ADMIN", "MANAGER"],
  // Most routes accessible to all authenticated users
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Not logged in → redirect to login
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Check route permissions
  for (const [route, roles] of Object.entries(routePermissions)) {
    if (pathname.startsWith(route) && !roles.includes(session.user.role)) {
      return NextResponse.redirect(new URL("/", req.url)) // or /unauthorized
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)"],
}
```

### Layer 2: Server Action Guard

```typescript
// lib/actions/helpers.ts
import { auth } from "@/lib/auth"
import { Role } from "@prisma/client"

export async function requireRole(...allowedRoles: Role[]) {
  const session = await auth()
  if (!session?.user) throw new Error("Tidak terautentikasi")
  if (!allowedRoles.includes(session.user.role as Role)) {
    throw new Error("Tidak memiliki akses")
  }
  return session
}

// Usage in server actions:
// lib/actions/employee.actions.ts
export async function createEmployee(data: CreateEmployeeInput) {
  const session = await requireRole("HR_ADMIN", "SUPER_ADMIN")
  // ... proceed with creation
}
```

### Layer 3: UI Conditional Rendering

```typescript
// components/shared/role-gate.tsx
import { useSession } from "next-auth/react"
import { Role } from "@prisma/client"

export function RoleGate({
  children,
  allowedRoles
}: {
  children: React.ReactNode
  allowedRoles: Role[]
}) {
  const { data: session } = useSession()
  if (!session || !allowedRoles.includes(session.user.role as Role)) {
    return null
  }
  return <>{children}</>
}

// Usage:
// <RoleGate allowedRoles={["HR_ADMIN", "SUPER_ADMIN"]}>
//   <Button>Tambah Karyawan</Button>
// </RoleGate>
```

### Data-Level Scoping (Critical for Manager/Employee)

Beyond route-level RBAC, the Employee and Manager roles see **filtered data**:

```typescript
// lib/services/employee.service.ts
export async function getEmployees(session: Session) {
  const { role, id: userId } = session.user

  switch (role) {
    case "SUPER_ADMIN":
    case "HR_ADMIN":
      // See all employees
      return prisma.employee.findMany({ include: { department: true, position: true } })

    case "MANAGER":
      // See only employees in manager's department
      const dept = await prisma.department.findFirst({ where: { managerId: userId } })
      if (!dept) return []
      return prisma.employee.findMany({
        where: { departmentId: dept.id },
        include: { department: true, position: true },
      })

    case "EMPLOYEE":
      // See only own profile
      return prisma.employee.findMany({
        where: { userId },
        include: { department: true, position: true },
      })
  }
}
```

This pattern -- same route, different data -- is the right approach for HRMS. Do not create separate routes per role.

---

## Server Actions vs API Routes

### Decision Matrix

| Use Case | Use Server Actions | Use API Routes |
|----------|-------------------|----------------|
| Form submissions (CRUD) | YES | No |
| Data mutations with revalidation | YES | No |
| File uploads | No | YES (need streaming/multipart) |
| PDF generation and download | No | YES (need to return binary Response) |
| NextAuth.js handler | No | YES (required by NextAuth) |
| Webhook endpoints | No | YES (external callers) |
| Client-side fetching (SWR/React Query) | No | YES (need GET endpoint) |
| Progressive enhancement (works without JS) | YES | No |

### Concrete Mapping for This HRMS

**Server Actions (lib/actions/):**
- `employee.actions.ts` -- createEmployee, updateEmployee, deleteEmployee
- `recruitment.actions.ts` -- createJobPosting, updateCandidateStatus, scheduleInterview
- `attendance.actions.ts` -- clockIn, clockOut
- `leave.actions.ts` -- submitLeaveRequest, approveLeave, rejectLeave
- `payroll.actions.ts` -- runPayrollCalculation, finalizePayroll

**API Routes (app/api/):**
- `api/auth/[...nextauth]/route.ts` -- NextAuth handler (required)
- `api/upload/route.ts` -- File upload (multipart/form-data processing)
- `api/pdf/payslip/[id]/route.ts` -- Generate and return payslip PDF
- `api/pdf/offer-letter/[id]/route.ts` -- Generate and return offer letter PDF

### Why This Split?

Server Actions are the default choice in Next.js 14 App Router. They:
- Are called directly from forms and client components
- Automatically handle revalidation (`revalidatePath` / `revalidateTag`)
- Work with progressive enhancement (form works without JavaScript)
- Have built-in error handling via `useFormState`

API Routes are needed only when:
- You need to return a non-JSON response (PDF binary, file stream)
- External systems need to call your endpoint
- The client needs a URL to fetch from (e.g., `<a href="/api/pdf/payslip/123">`)
- You need full control over the Response object

---

## File Upload Architecture

### Storage: Vercel Blob Storage (Recommended) or Local /uploads in Development

**Production (Vercel):**
- Use `@vercel/blob` for file storage
- Files are stored in Vercel's edge blob storage (S3-compatible under the hood)
- Returns a public URL per file
- No filesystem access on Vercel serverless (cannot write to `/public/uploads`)

**Development:**
- Use local filesystem with `/public/uploads/` for convenience
- Abstract behind a storage service so swapping is painless

### Upload Flow

```
Employee uploads KTP scan
       │
       ▼
[Client Component: FileUploader]
  1. User selects file
  2. Client-side validation (file type, max size 5MB)
  3. POST to /api/upload with FormData
       │
       ▼
[API Route: api/upload/route.ts]
  4. Verify session + role (must be HR_ADMIN or file owner)
  5. Parse multipart form data
  6. Validate file type server-side (PDF, JPG, PNG only)
  7. Upload to Vercel Blob (or save locally in dev)
  8. Return { url, fileName, fileSize }
       │
       ▼
[Server Action: employee.actions.ts → addDocument]
  9. Create EmployeeDocument record with fileUrl from step 8
  10. Revalidate employee detail page
```

### Storage Service Abstraction

```typescript
// lib/services/storage.service.ts
export interface StorageService {
  upload(file: File, path: string): Promise<{ url: string; size: number }>
  delete(url: string): Promise<void>
}

// Implementations:
// - VercelBlobStorage (production)
// - LocalFileStorage (development)
```

**Alternative: If Vercel Blob is not desired**, use Supabase Storage (free tier is generous) or Uploadthing (purpose-built for Next.js). Both work well on Vercel. For a thesis project, Vercel Blob is simplest because it is already part of the Vercel ecosystem.

### Security Considerations
- Never trust client-provided file names. Generate a unique name server-side (e.g., `${cuid()}-${sanitizedOriginalName}`).
- Validate MIME type server-side, not just file extension.
- Set maximum file size (5MB for documents is reasonable).
- Store sensitive documents (KTP, NPWP) with non-guessable URLs. Vercel Blob URLs are random by default.

---

## PDF Generation Architecture

### Recommended Approach: @react-pdf/renderer

For this project, use `@react-pdf/renderer` over Puppeteer.

**Why @react-pdf/renderer:**
- Runs in Node.js without a headless browser (no Chromium binary)
- Works on Vercel serverless (Puppeteer requires special configuration and the function size limit is 50MB)
- React components as templates (familiar DX, same language)
- Outputs PDF directly, no HTML-to-PDF conversion
- Good enough for payslips and offer letters (structured documents, not complex layouts)

**Why NOT Puppeteer on Vercel:**
- Puppeteer requires `@sparticuz/chromium` on serverless (compressed Chromium binary)
- Function size approaches or exceeds Vercel's 50MB limit
- Cold starts are 3-5 seconds for Chromium initialization
- Overkill for structured documents like payslips

### PDF Generation Flow

```
User clicks "Download Payslip"
       │
       ▼
[Client: <a href="/api/pdf/payslip/{id}"> or button with fetch]
       │
       ▼
[API Route: api/pdf/payslip/[id]/route.ts]
  1. Verify session: employee can only access own payslip,
     HR Admin can access any
  2. Fetch PayrollItem + Employee + PayrollPeriod from database
  3. Call pdfService.generatePayslip(data)
       │
       ▼
[Service: pdf.service.ts]
  4. Import PayslipTemplate (React component using @react-pdf/renderer)
  5. renderToBuffer(<PayslipTemplate data={data} />)
  6. Return PDF buffer
       │
       ▼
[API Route continues]
  7. Return new Response(pdfBuffer, {
       headers: {
         "Content-Type": "application/pdf",
         "Content-Disposition": `attachment; filename="slip-gaji-${period}.pdf"`
       }
     })
```

### Template Structure

```typescript
// lib/templates/payslip-template.tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

export function PayslipTemplate({ data }: { data: PayslipData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text>PT Sinergi Asta Nusantara</Text>
          <Text>Slip Gaji - {data.periodLabel}</Text>
        </View>
        {/* Employee info, income breakdown, deductions, net salary */}
      </Page>
    </Document>
  )
}
```

### PDF Templates Needed

| Template | Used By | Data Source |
|----------|---------|-------------|
| `payslip-template.tsx` | Payroll module | PayrollItem + Employee |
| `offer-letter-template.tsx` | Recruitment module | Candidate + JobPosting |
| `attendance-report-template.tsx` | Attendance module (optional) | AttendanceRecord[] |

---

## Component Boundaries Summary

```
┌─────────────────────────────────────────────────────┐
│                    PRESENTATION                      │
│  app/(dashboard)/[module]/page.tsx                   │
│  app/(dashboard)/[module]/_components/*.tsx           │
│  components/ui/* (shadcn)                            │
│  components/layout/* (sidebar, header)               │
│  components/shared/* (data-table, file-uploader)     │
├─────────────────────────────────────────────────────┤
│                  SERVER ACTIONS                       │
│  lib/actions/*.actions.ts                            │
│  - Validate input (Zod)                              │
│  - Check auth/role                                   │
│  - Call service layer                                │
│  - Revalidate paths                                  │
├─────────────────────────────────────────────────────┤
│                  API ROUTES                           │
│  app/api/upload/route.ts                             │
│  app/api/pdf/*/route.ts                              │
│  app/api/auth/[...nextauth]/route.ts                 │
│  - Handle non-form interactions                      │
│  - Return binary responses                           │
├─────────────────────────────────────────────────────┤
│                 SERVICE LAYER                        │
│  lib/services/*.service.ts                           │
│  - Business logic lives HERE                         │
│  - Called by actions AND routes                       │
│  - Pure functions where possible                     │
│  - Tax calculations, BPJS, attendance validation     │
├─────────────────────────────────────────────────────┤
│                 VALIDATION                           │
│  lib/validators/*.schema.ts                          │
│  - Zod schemas shared between client + server        │
│  - Single source of truth for field rules            │
├─────────────────────────────────────────────────────┤
│                 DATA ACCESS                          │
│  lib/prisma.ts (singleton client)                    │
│  prisma/schema.prisma                                │
│  - Services call Prisma directly (no repository      │
│    layer needed at this scale)                       │
├─────────────────────────────────────────────────────┤
│                 CONSTANTS                            │
│  lib/constants/*.ts                                  │
│  - Tax rates, BPJS rates, role permissions           │
│  - Change these when regulations change              │
└─────────────────────────────────────────────────────┘
```

**Why no separate repository layer?** At this project's scale (hundreds of employees, single database), adding a repository abstraction over Prisma is unnecessary indirection. Prisma already provides a clean query API. Services call Prisma directly. If the project grew to need multiple data sources, a repository layer could be added later.

---

## Architecture Anti-Patterns to Avoid

### 1. "God middleware" that handles all authorization logic
**Problem:** Middleware becomes huge, hard to test, and runs on every request.
**Instead:** Middleware handles route-level blocking only. Fine-grained permissions (e.g., "can this manager see this specific employee?") go in server actions/services.

### 2. Business logic in API routes or server actions directly
**Problem:** Payroll calculation logic in `payroll.actions.ts` cannot be reused by `api/pdf/payslip/route.ts`.
**Instead:** Extract business logic to `lib/services/`. Actions and routes are thin wrappers that validate, call services, and return responses.

### 3. Storing calculated payroll values only in the PayrollItem
**Problem:** If you compute PPh 21 on-the-fly and never store it, you cannot produce historical payslips.
**Instead:** PayrollItem stores ALL computed values. Once FINALIZED, these are immutable records.

### 4. Using `Float` for money in Prisma
**Problem:** JavaScript floating-point arithmetic causes rounding errors (e.g., `0.1 + 0.2 !== 0.3`).
**Instead:** Use `Decimal` in Prisma (maps to PostgreSQL `NUMERIC`). Use a library like `decimal.js` for arithmetic if needed.

### 5. Putting Indonesian tax constants in the database
**Problem:** Adds complexity for values that change once every 5-10 years.
**Instead:** Store in `lib/constants/pph21-rates.ts`. A code change when rates update is fine.

### 6. Building custom auth instead of using NextAuth.js v5
**Problem:** Session management, CSRF protection, cookie security are hard to get right.
**Instead:** Use NextAuth.js v5 with credentials provider. Extend the session type to include `role`.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Folder structure | MEDIUM | Based on well-established Next.js App Router conventions. Could not verify against latest docs. |
| Prisma schema | MEDIUM | Standard relational modeling. Indonesian payroll fields based on training knowledge of PPh 21 / BPJS. Verify PTKP values and tax brackets against current Indonesian tax law. |
| RBAC pattern | MEDIUM | NextAuth.js v5 middleware pattern is well-documented. The `auth()` wrapper in middleware.ts is the v5 pattern. |
| Server Actions vs API Routes | MEDIUM | This guidance matches Next.js 14 App Router documentation. Server Actions for mutations, API Routes for binary responses. |
| @react-pdf/renderer recommendation | MEDIUM | Puppeteer on Vercel is genuinely problematic (size limits). @react-pdf/renderer is the standard alternative. Verify current version compatibility with Next.js 14. |
| PPh 21 calculation | LOW-MEDIUM | Tax brackets (5%, 15%, 25%, 30%, 35%) and PTKP values need verification against the latest Indonesian tax regulation (UU HPP 2021 / PP 55/2022). The 35% bracket for income above 5 billion was introduced by UU HPP. |
| BPJS rates | LOW-MEDIUM | Standard rates cited (4%/1% Kesehatan, 3.7%/2% JHT, 2%/1% JP) are commonly used but should be verified against current BPJS regulation. JP has a salary cap that changes annually. |
| Vercel Blob storage | MEDIUM | Recommended as simplest option for Vercel deployment. Alternatives (Supabase Storage, Uploadthing) are viable. |

---

## Sources & Verification Notes

- Folder structure: Based on Next.js App Router conventions from training data. Route groups `(parentheses)` and `_components` underscore convention are stable features since Next.js 13.4+.
- NextAuth.js v5: The `auth()` middleware wrapper and credentials provider pattern are from NextAuth.js v5 (Auth.js) documentation available in training data. v5 is a significant API change from v4.
- PPh 21 tax brackets: Based on Indonesian UU HPP (Harmonisasi Peraturan Perpajakan) 2021, which introduced the 35% bracket. PTKP values are from PP 101/2016 and have not changed since. **Recommend verifying with current DJP (Direktorat Jenderal Pajak) publications before implementation.**
- BPJS rates: Based on commonly cited rates. JP salary cap changes annually -- **must verify current cap before payroll implementation.**
- @react-pdf/renderer: Known to work in Node.js serverless environments. **Verify current version and Next.js 14 compatibility during implementation.**
