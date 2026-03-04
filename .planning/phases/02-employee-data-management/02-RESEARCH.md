# Phase 2: Employee Data Management - Research

**Researched:** 2026-03-04
**Domain:** Employee CRUD, document upload, role-based access, Prisma schema extension
**Confidence:** HIGH

## Summary

Phase 2 builds employee profile management on top of Phase 1's foundation. The codebase already has a well-established pattern: Zod validation schemas, server actions calling service functions, service functions using Prisma with audit logging, and client components using react-hook-form with shadcn/ui. Phase 2 extends this pattern but introduces two new concerns: file uploads (no infrastructure exists yet) and multi-role access to the same resource (employees) with different permission levels.

The Prisma schema currently has no Employee model -- it needs to be created along with EmployeeDocument and EmergencyContact models. The User model exists and will be linked to Employee via a one-to-one relation. The existing Tabs component (Radix UI) and nuqs query state management are already used in master-data and can be reused for the employee profile tabbed form.

**Primary recommendation:** Follow the existing action/service/validation pattern exactly. Use local filesystem storage for documents (thesis project, no cloud needed). The main complexity spike is the employee creation flow which must atomically create both Employee and User records in a Prisma transaction.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 14.2.35 | App Router, Server Actions, API routes | Already in use |
| Prisma | 6.19.2 | ORM, schema, migrations | Already in use |
| Zod | 4.3.6 | Validation schemas | Already in use |
| react-hook-form | 7.71.2 | Form state management | Already in use |
| @hookform/resolvers | 5.2.2 | Zod resolver for react-hook-form | Already in use |
| @radix-ui/react-tabs | 1.1.13 | Tab UI component | Already in use for master-data |
| @tanstack/react-table | 8.21.3 | DataTable | Already in use |
| nuqs | 2.8.8 | URL query state (tab persistence) | Already used in master-data tabs |
| sonner | 2.0.7 | Toast notifications | Already in use |
| lucide-react | 0.575.0 | Icons | Already in use |
| date-fns | 4.1.0 | Date formatting | Already in use |
| bcryptjs | 3.0.3 | Password hashing | Already in use for user creation |

### New (To Be Added)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | - | No new libraries needed |

**No new dependencies required.** File uploads can be handled with Next.js built-in API routes and Node.js `fs` module. The project already has everything needed.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Local filesystem storage | Vercel Blob / S3 | Local storage is simpler for thesis; no cloud dependency; sufficient for single-server deployment |
| Next.js API route for upload | Server action with FormData | API route gives better control over streaming, file size limits, and response headers for downloads |

## Architecture Patterns

### Recommended Route Structure
```
src/app/(dashboard)/employees/
  page.tsx                           # Employee list (HR_ADMIN, MANAGER)
  new/
    page.tsx                         # Create employee form (HR_ADMIN only)
  [id]/
    page.tsx                         # View/edit employee profile with tabs (HR_ADMIN, MANAGER, EMPLOYEE)
    _components/
      employee-profile-tabs.tsx      # Tab container with nuqs state
      personal-info-tab.tsx          # Tab 1: Personal info form
      employment-details-tab.tsx     # Tab 2: Employment details form
      tax-bpjs-tab.tsx              # Tab 3: Tax & BPJS form
      documents-tab.tsx             # Tab 4: Document upload/list
      emergency-contacts-tab.tsx    # Tab 5: Emergency contacts
  _components/
    employee-columns.tsx             # DataTable column definitions
    employee-table.tsx               # DataTable wrapper with filters
    employee-filters.tsx             # Filter controls (department, status, etc.)
src/app/api/employees/
  [id]/
    documents/
      route.ts                       # POST: upload document
      [docId]/
        route.ts                     # GET: download document, DELETE: remove document
```

### Recommended Service/Action Structure
```
src/lib/
  actions/
    employee.actions.ts              # Server actions for employee CRUD
    employee-document.actions.ts     # Server actions for document management
  services/
    employee.service.ts              # Prisma queries for employees
    employee-document.service.ts     # Document storage + DB operations
  validations/
    employee.ts                      # Zod schemas for employee forms
```

### Pattern 1: Follow Existing Action/Service/Validation Pattern
**What:** The codebase uses a three-layer pattern: Zod validation -> Server Action (auth + parse + call service) -> Service (Prisma + audit log)
**When to use:** All employee CRUD operations
**Example:**
```typescript
// src/lib/actions/employee.actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createEmployeeSchema } from "@/lib/validations/employee";
import { createEmployee } from "@/lib/services/employee.service";
import type { ServiceResult } from "@/types";

async function requireHRAdmin(): Promise<ServiceResult<{ userId: string }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Sesi tidak valid" };
  if (session.user.role !== "HR_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return { success: false, error: "Akses ditolak" };
  }
  return { success: true, data: { userId: session.user.id } };
}

export async function createEmployeeAction(formData: unknown): Promise<ServiceResult<{ id: string }>> {
  const authResult = await requireHRAdmin();
  if (!authResult.success) return { success: false, error: authResult.error };

  const parsed = createEmployeeSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const result = await createEmployee(parsed.data, authResult.data!.userId);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/employees");
  return { success: true, data: { id: result.data!.id } };
}
```

### Pattern 2: Multi-Role Page Access
**What:** The employee profile page is accessed by HR_ADMIN (full edit), MANAGER (read-only, department-scoped), and EMPLOYEE (read-only, self only). The page component checks the role and renders accordingly.
**When to use:** Employee detail page, employee list page
**Example:**
```typescript
// src/app/(dashboard)/employees/[id]/page.tsx
export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role } = session.user;

  // EMPLOYEE can only view their own profile
  if (role === "EMPLOYEE") {
    const employee = await getEmployeeByUserId(session.user.id);
    if (!employee || employee.id !== params.id) redirect("/dashboard");
    // render read-only
  }

  // MANAGER can only view employees in their department
  if (role === "MANAGER") {
    const canAccess = await canManagerAccessEmployee(session.user.id, params.id);
    if (!canAccess) redirect("/employees"); // or notFound()
    // render read-only
  }

  // HR_ADMIN / SUPER_ADMIN: full access
  const employee = await getEmployeeById(params.id);
  if (!employee) notFound();
  // render with edit capability
}
```

### Pattern 3: Tabbed Profile Form with nuqs
**What:** Use nuqs (already in use for master-data tabs) to persist the active tab in the URL query string
**When to use:** Employee profile page tabs
**Example:**
```typescript
"use client";
import { useQueryState } from "nuqs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function EmployeeProfileTabs({ employee, readOnly }: Props) {
  const [tab, setTab] = useQueryState("tab", { defaultValue: "personal" });

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="personal">Data Pribadi</TabsTrigger>
        <TabsTrigger value="employment">Detail Pekerjaan</TabsTrigger>
        <TabsTrigger value="tax-bpjs">Pajak & BPJS</TabsTrigger>
        <TabsTrigger value="documents">Dokumen</TabsTrigger>
        <TabsTrigger value="emergency">Kontak Darurat</TabsTrigger>
      </TabsList>
      {/* Each tab is its own component */}
    </Tabs>
  );
}
```

### Anti-Patterns to Avoid
- **Putting file upload in a Server Action:** Server Actions serialize FormData but are not ideal for binary file uploads with progress tracking. Use an API route (route.ts) for document upload instead.
- **Single monolithic employee form:** The employee profile has 5 tabs worth of fields. Do NOT build one giant form. Each tab should save independently via its own server action.
- **Checking role in client code only:** Always enforce role-based access at the server action / service level, not just in the UI. The UI hides edit buttons for read-only users, but the server must reject unauthorized mutations.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab UI | Custom tab switching | `@radix-ui/react-tabs` + existing `Tabs` component | Already installed and used in master-data |
| Tab state in URL | Custom URL manipulation | `nuqs` useQueryState | Already used in master-data-tabs.tsx |
| Form validation | Manual field checking | `zod` + `react-hook-form` + `@hookform/resolvers` | Already the established pattern |
| Data tables | Custom table markup | `@tanstack/react-table` + existing `DataTable` component | Already built with pagination |
| Confirmation dialogs | Custom modals | Existing `ConfirmDialog` component | Already built with loading state and destructive variant |
| Toast notifications | Custom notification system | `sonner` toast | Already integrated |
| Date formatting | Manual date string building | `date-fns` format | Already installed |
| Password hashing | Custom crypto | `bcryptjs` | Already used in user service |

**Key insight:** Phase 1 built a complete component and pattern library. Phase 2 should reuse everything and only add employee-specific logic.

## Common Pitfalls

### Pitfall 1: Employee-User Creation Atomicity
**What goes wrong:** Creating an Employee record and a User record in separate database calls. If the User creation fails (e.g., duplicate email), you get an orphaned Employee record.
**Why it happens:** The auto-create-user-on-employee-creation requirement means two models must be created together.
**How to avoid:** Use `prisma.$transaction()` to wrap both Employee and User creation in a single atomic operation.
**Warning signs:** Employee exists in the database but has no linked User account.

### Pitfall 2: File Storage Path Conflicts
**What goes wrong:** Two documents uploaded with the same filename overwrite each other.
**Why it happens:** Using the original filename as the storage path without any unique prefix.
**How to avoid:** Store files with a unique name (e.g., `{cuid}-{originalFilename}`) in an employee-scoped directory (e.g., `uploads/employees/{employeeId}/`). Store the original filename in the database for display.
**Warning signs:** Documents showing wrong content after download.

### Pitfall 3: NIK/Employee ID Generation Race Condition
**What goes wrong:** Two employees created simultaneously get the same auto-generated NIK.
**Why it happens:** Reading the max NIK, incrementing, then saving is not atomic.
**How to avoid:** Use a database sequence or generate NIK inside the transaction. Alternatively, use a format like `EMP-{YYYY}{sequential}` where the sequential part is derived from a database counter or the record count + 1 within the transaction.
**Warning signs:** Duplicate NIK constraint violation errors in production.

### Pitfall 4: Manager Department Scoping Requires Manager-Employee Link
**What goes wrong:** The session only has `userId` and `role`. To filter by "manager's department," you need to know which department the manager belongs to.
**Why it happens:** Currently, there's no link between User and Department. The Manager role exists in the User model but there is no departmentId on User.
**How to avoid:** Once Employee model exists, link User to Employee (one-to-one). When a Manager logs in, look up their Employee record to find their departmentId, then scope the employee list query to that department.
**Warning signs:** Manager sees all employees or no employees instead of just their department.

### Pitfall 5: Forgetting to Deactivate the User When Terminating an Employee
**What goes wrong:** A terminated employee can still log in because their User account is still active.
**Why it happens:** Employee deactivation updates Employee.isActive but forgets to also set User.isActive = false.
**How to avoid:** The deactivateEmployee service function must update both Employee.isActive and the linked User.isActive in a single transaction.
**Warning signs:** Terminated employees can still access the system.

### Pitfall 6: Large File Uploads Through Server Actions
**What goes wrong:** Server Actions have a default body size limit (1MB in Next.js). Uploading a 5MB PDF through a server action fails silently or with a cryptic error.
**Why it happens:** Next.js Server Actions are not designed for large binary payloads.
**How to avoid:** Use a Next.js API route (`route.ts`) for file uploads. Configure `next.config.mjs` to increase the body size limit for the upload endpoint if needed, or handle streaming.
**Warning signs:** Upload fails for files over ~1MB without a clear error message.

## Code Examples

### Prisma Schema Extension for Employee

```prisma
// New enums needed
enum Gender {
  MALE
  FEMALE
}

enum Religion {
  ISLAM
  KRISTEN
  KATOLIK
  HINDU
  BUDDHA
  KONGHUCU
}

enum MaritalStatus {
  TK    // Tidak Kawin
  K     // Kawin
}

enum ContractType {
  PKWT   // Perjanjian Kerja Waktu Tertentu (fixed-term)
  PKWTT  // Perjanjian Kerja Waktu Tidak Tertentu (permanent)
}

enum PTKPStatus {
  TK_0  // Tidak Kawin, 0 tanggungan
  TK_1
  TK_2
  TK_3
  K_0   // Kawin, 0 tanggungan
  K_1
  K_2
  K_3
}

enum DocumentType {
  KTP
  NPWP
  BPJS_KESEHATAN
  BPJS_KETENAGAKERJAAN
  KONTRAK
  FOTO
  LAINNYA
}

model Employee {
  id                      String        @id @default(cuid())
  nik                     String        @unique  // Internal employee number (e.g., EMP-2026-0001)
  userId                  String        @unique  // One-to-one with User

  // Personal Info (EMP-01)
  namaLengkap             String
  nikKtp                  String?       // NIK KTP (16 digits) - optional on creation
  tempatLahir             String?
  tanggalLahir            DateTime?
  jenisKelamin            Gender?
  agama                   Religion?
  alamat                  String?
  nomorHp                 String?
  email                   String        // Same as User email

  // Employment Details (EMP-02)
  departmentId            String
  positionId              String
  contractType            ContractType
  joinDate                DateTime
  isActive                Boolean       @default(true)

  // Termination (EMP-04)
  terminationDate         DateTime?
  terminationReason       String?

  // Tax & BPJS (EMP-08)
  npwp                    String?
  ptkpStatus              PTKPStatus?
  bpjsKesehatanNo         String?
  bpjsKetenagakerjaanNo   String?

  createdAt               DateTime      @default(now())
  updatedAt               DateTime      @updatedAt

  // Relations
  user                    User          @relation(fields: [userId], references: [id])
  department              Department    @relation(fields: [departmentId], references: [id])
  position                Position      @relation(fields: [positionId], references: [id])
  documents               EmployeeDocument[]
  emergencyContacts       EmergencyContact[]

  @@map("employees")
}

model EmployeeDocument {
  id             String       @id @default(cuid())
  employeeId     String
  documentType   DocumentType
  fileName       String       // Original filename for display
  filePath       String       // Storage path on disk
  fileSize       Int          // Size in bytes
  mimeType       String       // e.g., "application/pdf", "image/jpeg"
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  employee       Employee     @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@map("employee_documents")
}

model EmergencyContact {
  id             String   @id @default(cuid())
  employeeId     String
  name           String
  relationship   String   // e.g., "Suami", "Istri", "Orang Tua", "Saudara"
  phone          String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  employee       Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@map("emergency_contacts")
}
```

**Required changes to existing models:**
```prisma
// User model - add relation to Employee
model User {
  // ... existing fields ...
  employee  Employee?  // One-to-one optional (not all users are employees)
}

// Department model - add relation to Employee
model Department {
  // ... existing fields ...
  employees Employee[]
}

// Position model - add relation to Employee
model Position {
  // ... existing fields ...
  employees Employee[]
}
```

### NIK Generation Strategy

```typescript
// Recommended format: EMP-{YYYY}-{4-digit sequential}
// Example: EMP-2026-0001, EMP-2026-0002
async function generateEmployeeNIK(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `EMP-${year}-`;

  const lastEmployee = await prisma.employee.findFirst({
    where: { nik: { startsWith: prefix } },
    orderBy: { nik: "desc" },
    select: { nik: true },
  });

  let nextNumber = 1;
  if (lastEmployee) {
    const lastNumber = parseInt(lastEmployee.nik.split("-").pop() || "0", 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}
```

### Employee Creation with User Account (Atomic Transaction)

```typescript
async function createEmployee(data: CreateEmployeeInput, actorId: string): Promise<ServiceResult<Employee>> {
  // Check email uniqueness for User
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    return { success: false, error: "Email sudah terdaftar" };
  }

  const nik = await generateEmployeeNIK();
  const hashedPassword = await bcrypt.hash(data.initialPassword, 12);

  const employee = await prisma.$transaction(async (tx) => {
    // 1. Create User account
    const user = await tx.user.create({
      data: {
        name: data.namaLengkap,
        email: data.email,
        hashedPassword,
        role: "EMPLOYEE",
        isActive: true,
      },
    });

    // 2. Create Employee record linked to User
    const emp = await tx.employee.create({
      data: {
        nik,
        userId: user.id,
        namaLengkap: data.namaLengkap,
        email: data.email,
        departmentId: data.departmentId,
        positionId: data.positionId,
        contractType: data.contractType,
        joinDate: data.joinDate,
        // ... other optional fields
      },
    });

    return emp;
  });

  // Audit log outside transaction (non-critical)
  await createAuditLog({
    userId: actorId,
    action: "CREATE",
    module: MODULES.EMPLOYEE,
    targetId: employee.id,
    newValue: { nik, namaLengkap: data.namaLengkap, email: data.email },
  });

  return { success: true, data: employee };
}
```

### File Upload API Route

```typescript
// src/app/api/employees/[id]/documents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || !["HR_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const documentType = formData.get("documentType") as string;

  if (!file) {
    return NextResponse.json({ error: "File wajib diunggah" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Tipe file tidak didukung" }, { status: 400 });
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Ukuran file maksimal 5MB" }, { status: 400 });
  }

  // Save to disk
  const uploadDir = path.join(process.cwd(), "uploads", "employees", params.id);
  await mkdir(uploadDir, { recursive: true });

  const uniqueName = `${cuid()}-${file.name}`;
  const filePath = path.join(uploadDir, uniqueName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  // Save to database
  const doc = await prisma.employeeDocument.create({
    data: {
      employeeId: params.id,
      documentType,
      fileName: file.name,
      filePath: `uploads/employees/${params.id}/${uniqueName}`,
      fileSize: file.size,
      mimeType: file.type,
    },
  });

  return NextResponse.json({ success: true, data: doc });
}
```

### Manager Department Scoping

```typescript
// In employee.service.ts
async function getEmployeesForManager(userId: string) {
  // Find the manager's employee record to get their department
  const managerEmployee = await prisma.employee.findUnique({
    where: { userId },
    select: { departmentId: true },
  });

  if (!managerEmployee) {
    return { data: [], total: 0 }; // Manager has no employee record
  }

  // Return only employees in the same department
  return getEmployees({ departmentId: managerEmployee.departmentId });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Next.js API routes only | Server Actions for mutations, API routes for files | Next.js 14 | Use server actions for form data, API routes for binary uploads |
| `getServerSideProps` | App Router server components | Next.js 13+ | Data fetching happens in page.tsx directly |
| `pages/api/` | `app/api/route.ts` | Next.js 13+ | Route handlers use Web API Request/Response |

## File Storage Approach

**Decision: Local filesystem storage** (HIGH confidence)

- Store files in `{project-root}/uploads/employees/{employeeId}/` directory
- This directory must be added to `.gitignore`
- For downloads, serve files via an API route that reads from disk and streams the response
- No cloud storage dependency needed for a thesis project deployed on a single server
- Add `uploads/` to `.gitignore`

**Configuration needed in next.config.mjs:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb', // Only if using server actions for upload; prefer API route instead
    },
  },
};
export default nextConfig;
```

**Note:** If using API routes for file upload (recommended), the default Next.js body parser limit for API routes is 1MB. For App Router route handlers, there's no built-in limit when using `request.formData()` -- the Web API handles streaming naturally. However, you should validate file size server-side regardless.

## Sidebar Navigation Update

The sidebar (`src/components/layout/sidebar.tsx`) uses a role-based `navItems` array. A new entry for "Karyawan" (Employees) must be added:

```typescript
{
  label: "Karyawan",
  href: "/employees",
  icon: Users2, // or UserRound from lucide-react
  roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
}
```

- All roles can access `/employees`, but the page itself controls what they see
- EMPLOYEE role will be redirected to their own profile (or the list page shows only their own entry)

## Constants Update

Add to `src/lib/constants.ts`:
```typescript
export const MODULES = {
  // ... existing
  EMPLOYEE: "Karyawan",
  EMPLOYEE_DOCUMENT: "Dokumen Karyawan",
  EMERGENCY_CONTACT: "Kontak Darurat",
} as const;
```

## Open Questions

1. **Initial password mechanism**
   - What we know: Context says "HR sets the initial password at creation time (or system generates one -- Claude's discretion)"
   - Recommendation: Let HR type the initial password in the employee creation form. This is simpler than generating and displaying a random password. Use the same password validation as the existing user creation form (min 8 chars, upper+lower+digit). HR can share the password with the employee directly.

2. **Emergency contact maximum count**
   - What we know: Context says "Claude's discretion on maximum count"
   - Recommendation: Allow up to 3 emergency contacts per employee. This is standard practice. Enforce in the UI (hide "add" button when 3 exist) and in the validation schema.

3. **Employee self-view routing**
   - What we know: Employee can view their own profile in read-only mode
   - Recommendation: When EMPLOYEE role navigates to `/employees`, redirect them directly to `/employees/{their-employee-id}`. No list view needed for employees. Add a "Profil Saya" sidebar link for the EMPLOYEE role that goes directly to their profile.

4. **Tab-level save vs. full-form save**
   - What we know: Profile has 5 tabs; tabs should allow jumping directly
   - Recommendation: Each tab saves independently. When switching tabs with unsaved changes, show a confirmation dialog ("Ada perubahan yang belum disimpan. Lanjutkan?"). This avoids data loss without requiring save-all.

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** - Direct reading of all source files in the project
  - Prisma schema: `prisma/schema.prisma`
  - Action pattern: `src/lib/actions/user.actions.ts`, `src/lib/actions/master-data.actions.ts`
  - Service pattern: `src/lib/services/user.service.ts`, `src/lib/services/master-data.service.ts`
  - Validation pattern: `src/lib/validations/user.ts`, `src/lib/validations/master-data.ts`
  - Form pattern: `src/app/(dashboard)/users/_components/user-form-dialog.tsx`
  - Tab pattern: `src/app/(dashboard)/master-data/_components/master-data-tabs.tsx`
  - DataTable: `src/components/shared/data-table.tsx`
  - ConfirmDialog: `src/components/shared/confirm-dialog.tsx`
  - Sidebar: `src/components/layout/sidebar.tsx`
  - Auth: `src/lib/auth.ts`
  - Audit log: `src/lib/prisma.ts` (createAuditLog function)
  - Constants: `src/lib/constants.ts`

### Secondary (MEDIUM confidence)
- Next.js 14 App Router documentation for API route handlers and Server Actions
- Prisma interactive transactions documentation

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and used in Phase 1
- Architecture: HIGH - directly follows established patterns in the codebase
- Schema design: HIGH - standard HR data model with Indonesian-specific fields
- File upload approach: MEDIUM - local filesystem is appropriate for thesis but the specific Next.js API route handling was not verified against latest docs
- Pitfalls: HIGH - derived from understanding the actual codebase constraints

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable -- no fast-moving dependencies)
