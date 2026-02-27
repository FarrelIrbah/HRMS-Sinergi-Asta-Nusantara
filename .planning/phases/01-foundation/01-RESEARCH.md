# Phase 1: Foundation - Research

**Researched:** 2026-02-27
**Domain:** Next.js 14 App Router full-stack foundation -- authentication, RBAC, CRUD, audit logging, dashboard layout
**Confidence:** HIGH (verified against official docs and current npm state)

## Summary

This phase establishes the entire project infrastructure: Next.js 14 App Router project scaffold, PostgreSQL database with Prisma ORM, NextAuth.js v5 authentication with credentials provider and role-based access control, user management CRUD, master data management with soft delete, audit logging via Prisma Client extensions, and role-appropriate dashboard skeletons.

The standard approach is a Next.js 14 App Router project using route groups to separate public (auth) and protected (dashboard) layouts. Authentication uses NextAuth.js v5 (still on `@beta` tag but widely used in production) with JWT strategy and credentials provider. Prisma 6.x is the recommended ORM version for this project -- Prisma 7 introduced breaking changes (mandatory driver adapters, ESM-only, new config file structure) that add unnecessary complexity for a thesis project on Next.js 14. The UI layer uses shadcn/ui components built on Radix primitives, with @tanstack/react-table for data tables and sonner for toast notifications.

The audit log is implemented as a centralized `AuditLog` table with a Prisma Client extension that intercepts create, update, and delete operations, capturing before/after values automatically. Master data uses soft delete via a `deletedAt` timestamp column filtered out by default in queries.

**Primary recommendation:** Use Prisma 6.x (not 7), NextAuth v5 beta with JWT strategy, and keep the architecture to 3 layers maximum (Route/Page -> Service function -> Prisma query) to avoid over-engineering a thesis project.

## Standard Stack

### Core (Locked decisions from CONTEXT.md)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 14.2.25+ | Full-stack framework (App Router) | Locked decision. Use 14.2.25 minimum to patch CVE-2025-29927 middleware bypass vulnerability |
| TypeScript | 5.4+ | Type safety | Required by Prisma 6.x and Next.js 14 |
| PostgreSQL | 16 | Primary database | Locked decision. Mature, excellent JSON support for audit log values |
| Prisma ORM | 6.x (latest 6.2.1+) | Database access and migrations | Stable, traditional setup (no driver adapters). Prisma 7 adds unnecessary complexity. |
| @prisma/client | 6.x | Generated type-safe client | Matches Prisma CLI version |
| Tailwind CSS | 3.x | Utility-first styling | Locked decision. Pairs with shadcn/ui |
| shadcn/ui | latest (CLI: `shadcn@latest`) | Component library (copy-paste model) | Locked decision. Radix primitives, accessible, customizable |
| NextAuth.js v5 | 5.x (`next-auth@beta`) | Authentication | Locked decision. Still beta but production-ready. Install via `npm install next-auth@beta` |
| @auth/prisma-adapter | latest | Prisma adapter for Auth.js v5 | Required for database session/user storage with Prisma |
| React Hook Form | 7.x | Form state management | Locked decision. Client-side form handling |
| @hookform/resolvers | latest | Zod resolver for RHF | Bridges Zod schemas to React Hook Form |
| Zod | 3.x | Schema validation (client + server) | Locked decision. Shared validation schemas |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| bcryptjs | 2.x | Password hashing (pure JS) | Use over native `bcrypt` -- compatible with edge runtime, no native compilation needed |
| @tanstack/react-table | 8.x | Headless data tables | Audit log table, user management table, master data tables |
| sonner | latest | Toast notifications | Form submission feedback, action confirmations. shadcn/ui integrates sonner directly |
| date-fns | 3.x or 4.x | Date formatting and manipulation | Display dates in Indonesian format (`id` locale) |
| date-fns-tz | latest | Timezone-aware operations | Store UTC, display in WIB (Asia/Jakarta) |
| nuqs | latest | Type-safe URL search params | Table filters, pagination state in URL for audit log |
| lucide-react | latest | Icon library | shadcn/ui uses Lucide icons by default |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma 6.x | Prisma 7.x | Prisma 7 requires driver adapters (`@prisma/adapter-pg`), ESM-only, new config file (`prisma.config.ts`). Adds complexity with no benefit for this project. |
| Prisma 6.x | Prisma 5.x | Prisma 5 works but misses improvements in 6.x like better Client Extensions. Use 6.x. |
| bcryptjs | bcrypt (native) | Native bcrypt is ~20% faster but requires node-gyp compilation and is incompatible with Next.js edge runtime. bcryptjs is sufficient for thesis scale. |
| next-auth@beta | better-auth | Auth.js is being merged with Better Auth but the `next-auth@beta` package remains the established path for Next.js 14. |
| nuqs | Manual URLSearchParams | nuqs provides type-safe, validated search params with Zod integration. Worth the small dependency. |

**Installation:**

```bash
# Create Next.js 14 project
npx create-next-app@14 --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" hrms-pt-san

# Initialize shadcn/ui
npx shadcn@latest init

# Core dependencies
npm install next-auth@beta @auth/prisma-adapter
npm install @prisma/client
npm install react-hook-form @hookform/resolvers zod
npm install bcryptjs
npm install date-fns date-fns-tz
npm install sonner
npm install @tanstack/react-table
npm install nuqs
npm install lucide-react

# Dev dependencies
npm install -D prisma
npm install -D @types/bcryptjs

# Add shadcn/ui components needed for Phase 1
npx shadcn@latest add button card input label select table tabs badge dialog dropdown-menu separator form toast sonner avatar sheet
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/                           # Public routes (no auth required)
│   │   ├── login/
│   │   │   └── page.tsx                  # Login page
│   │   └── layout.tsx                    # Centered card layout, branded background
│   │
│   ├── (dashboard)/                      # All authenticated routes
│   │   ├── layout.tsx                    # Sidebar + header + auth guard
│   │   ├── dashboard/
│   │   │   └── page.tsx                  # Role-appropriate dashboard (DASH-01)
│   │   ├── users/                        # User management (USER-01,02,03)
│   │   │   ├── page.tsx                  # User list table
│   │   │   └── _components/
│   │   │       ├── user-table.tsx
│   │   │       ├── user-form-dialog.tsx
│   │   │       └── columns.tsx
│   │   ├── master-data/                  # Master data (MASTER-01,02,03,04)
│   │   │   ├── page.tsx                  # Tabbed page: departments, positions, locations, leave types
│   │   │   └── _components/
│   │   │       ├── departments-tab.tsx
│   │   │       ├── positions-tab.tsx
│   │   │       ├── office-locations-tab.tsx
│   │   │       ├── leave-types-tab.tsx
│   │   │       └── master-data-form.tsx
│   │   └── audit-log/                    # Audit log (AUDIT-01,02)
│   │       ├── page.tsx                  # Audit log table with filters
│   │       ├── [id]/
│   │       │   └── page.tsx              # Audit log detail (before/after diff)
│   │       └── _components/
│   │           ├── audit-table.tsx
│   │           ├── audit-filters.tsx
│   │           └── audit-detail.tsx
│   │
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts              # NextAuth API route handler
│   │
│   ├── layout.tsx                        # Root layout (html, body, providers)
│   └── globals.css                       # Tailwind directives + shadcn/ui CSS vars
│
├── components/
│   ├── ui/                               # shadcn/ui components (auto-generated)
│   ├── layout/
│   │   ├── sidebar.tsx                   # Dashboard sidebar navigation
│   │   ├── header.tsx                    # Dashboard top header (user menu, logout)
│   │   └── breadcrumbs.tsx
│   └── shared/
│       ├── data-table.tsx                # Reusable table wrapper (TanStack)
│       ├── data-table-pagination.tsx     # Pagination controls
│       ├── loading-skeleton.tsx          # Generic loading states
│       ├── stat-card.tsx                 # Dashboard stat card widget
│       └── confirm-dialog.tsx            # Confirmation dialog for deletes
│
├── lib/
│   ├── prisma.ts                         # Prisma client singleton
│   ├── auth.ts                           # NextAuth v5 configuration (exports auth, handlers, signIn, signOut)
│   ├── auth.config.ts                    # Auth config without adapter (edge-safe, for middleware)
│   ├── utils.ts                          # shadcn/ui cn() utility
│   ├── constants.ts                      # App-wide constants (roles, modules enum)
│   ├── validations/
│   │   ├── auth.ts                       # Login schema
│   │   ├── user.ts                       # User create/update schemas
│   │   └── master-data.ts               # Department, position, location, leave type schemas
│   └── services/
│       ├── user.service.ts               # User CRUD operations
│       ├── master-data.service.ts        # Master data CRUD operations
│       ├── audit.service.ts              # Audit log query/filter operations
│       └── dashboard.service.ts          # Dashboard data aggregation
│
├── types/
│   ├── next-auth.d.ts                    # NextAuth type augmentation (role, id)
│   └── index.ts                          # Shared application types
│
├── middleware.ts                          # Route protection (auth check only)
│
prisma/
├── schema.prisma                         # Database schema
├── migrations/                           # Migration files (commit to git)
└── seed.ts                               # Seed script (Super Admin + initial data)
```

### Pattern 1: Server Component Data Fetching with Client Interactivity

**What:** Server Components fetch data via Prisma, pass serialized data to Client Components for interaction.
**When to use:** Every page that displays data with user interaction (tables, forms, dashboards).

```typescript
// app/(dashboard)/users/page.tsx (Server Component)
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getUsers } from "@/lib/services/user.service"
import { UserTable } from "./_components/user-table"

export default async function UsersPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const users = await getUsers()

  // Serialize dates to ISO strings before passing to client
  const serializedUsers = users.map(u => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }))

  return <UserTable data={serializedUsers} />
}
```

```typescript
// app/(dashboard)/users/_components/user-table.tsx (Client Component)
"use client"
import { DataTable } from "@/components/shared/data-table"
import { columns } from "./columns"

export function UserTable({ data }: { data: SerializedUser[] }) {
  return <DataTable columns={columns} data={data} />
}
```

### Pattern 2: Server Actions for Mutations

**What:** Use Next.js Server Actions for create/update/delete operations instead of API routes.
**When to use:** All form submissions and data mutations.

```typescript
// lib/actions/user.actions.ts
"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createUserSchema } from "@/lib/validations/user"
import { revalidatePath } from "next/cache"

export async function createUser(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized")
  }

  const parsed = createUserSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // Prisma Client extension auto-creates audit log entry
  await prisma.user.create({ data: parsed.data })
  revalidatePath("/users")
  return { success: true }
}
```

### Pattern 3: Role-Based Dashboard Rendering

**What:** Single `/dashboard` route that renders different widgets based on user role.
**When to use:** DASH-01 implementation.

```typescript
// app/(dashboard)/dashboard/page.tsx
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SuperAdminDashboard } from "./_components/super-admin-dashboard"
import { HRAdminDashboard } from "./_components/hr-admin-dashboard"
import { ManagerDashboard } from "./_components/manager-dashboard"
import { EmployeeDashboard } from "./_components/employee-dashboard"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const role = session.user.role

  switch (role) {
    case "SUPER_ADMIN":
      return <SuperAdminDashboard />
    case "HR_ADMIN":
      return <HRAdminDashboard />
    case "MANAGER":
      return <ManagerDashboard />
    case "EMPLOYEE":
      return <EmployeeDashboard />
    default:
      redirect("/login")
  }
}
```

### Pattern 4: Audit Logging via Prisma Client Extension

**What:** Automatically capture create/update/delete actions with before/after values.
**When to use:** AUDIT-01 implementation. Applied globally to all Prisma operations.

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client"

function createAuditExtension(userId: string | null) {
  return {
    query: {
      $allModels: {
        async create({ model, args, query }: any) {
          const result = await query(args)
          if (userId) {
            await logAudit({
              userId,
              action: "CREATE",
              module: model,
              targetId: String(result.id),
              oldValue: null,
              newValue: result,
            })
          }
          return result
        },
        async update({ model, args, query }: any) {
          // Fetch old value before update
          const old = await (prismaBase as any)[model].findUnique({
            where: args.where,
          })
          const result = await query(args)
          if (userId) {
            await logAudit({
              userId,
              action: "UPDATE",
              module: model,
              targetId: String(result.id),
              oldValue: old,
              newValue: result,
            })
          }
          return result
        },
        async delete({ model, args, query }: any) {
          const old = await (prismaBase as any)[model].findUnique({
            where: args.where,
          })
          const result = await query(args)
          if (userId) {
            await logAudit({
              userId,
              action: "DELETE",
              module: model,
              targetId: String(result.id),
              oldValue: old,
              newValue: null,
            })
          }
          return result
        },
      },
    },
  }
}
```

### Pattern 5: Soft Delete for Master Data

**What:** Master data records are never physically deleted. A `deletedAt` timestamp marks them as inactive.
**When to use:** All 4 master data types (departments, positions, office locations, leave types).

```typescript
// In service layer, always filter by deletedAt
export async function getDepartments() {
  return prisma.department.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  })
}

export async function softDeleteDepartment(id: string) {
  return prisma.department.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}

// For dropdowns: only active records
export async function getDepartmentsForDropdown() {
  return prisma.department.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
}
```

### Anti-Patterns to Avoid

- **Over-abstracting with repository interfaces:** Do NOT create `IUserRepository`, `UserRepositoryImpl`, `UserService`, `IUserService`. This is a thesis project. Use: Page -> Service function -> Prisma query. Three layers max.
- **Using API routes for everything:** Use Server Actions for mutations. Reserve API routes only for the NextAuth handler and any future external API needs.
- **Putting role checks in middleware only:** Middleware should check "is authenticated?" only. Role-based access checks go in Server Components and Server Actions. Middleware runs in the edge runtime and has limited access.
- **`'use client'` on everything:** Default to Server Components. Only add `'use client'` when you need useState, useEffect, onClick, or other browser APIs.
- **Passing Prisma models directly to client components:** Serialize dates to ISO strings, convert Decimal to number, strip internal fields before passing to client components.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Data tables with sort/filter/paginate | Custom table component | @tanstack/react-table + shadcn/ui Table | TanStack handles column definitions, pagination state, sorting logic. shadcn provides styled cells. |
| Form validation | Manual if/else validation | React Hook Form + Zod + shadcn/ui Form | RHF handles form state, Zod validates, shadcn Form renders with error messages. |
| Toast notifications | Custom notification system | sonner (via shadcn/ui) | Drop-in toast with animations, promise support, auto-dismiss. |
| Date formatting (Indonesian locale) | Manual date string manipulation | `date-fns` with `id` locale + `date-fns-tz` | Handles WIB timezone, Indonesian month names, edge cases. |
| Password hashing | Custom hash function | bcryptjs with salt rounds = 12 | Proven algorithm, timing-safe comparison. |
| URL search param state | Manual URLSearchParams | nuqs | Type-safe, Zod-validated, history-aware URL state. |
| Confirmation dialogs | Custom modal logic | shadcn/ui AlertDialog | Accessible, keyboard-navigable, styled consistently. |

**Key insight:** This phase is pure infrastructure and CRUD. Every component exists as a solved problem in the chosen stack. The value is in correct wiring, not creative solutions.

## Common Pitfalls

### Pitfall 1: NextAuth v5 Type Augmentation Missing

**What goes wrong:** `session.user.role` is `undefined` in components. TypeScript errors on accessing custom session properties. Role-based rendering breaks silently.
**Why it happens:** Auth.js v5 does not include custom properties in the Session type by default. You must augment the TypeScript types AND pass role through both JWT and session callbacks.
**How to avoid:**
1. Create `src/types/next-auth.d.ts` with augmented types (see Code Examples below)
2. Set up both `jwt` and `session` callbacks to pass `role` and `id`
3. Test immediately: log `session.user.role` in a server component before building any role-dependent UI
**Warning signs:** `session.user.role` returns `undefined`; TypeScript errors on `.role` or `.id`

### Pitfall 2: NextAuth v5 Environment Variables

**What goes wrong:** Auth fails silently in production because environment variables use the old `NEXTAUTH_` prefix.
**Why it happens:** Auth.js v5 changed the prefix from `NEXTAUTH_` to `AUTH_`. Old tutorials still show the v4 prefix.
**How to avoid:** Use `AUTH_SECRET` (not `NEXTAUTH_SECRET`), `AUTH_URL` (not `NEXTAUTH_URL`). Auth.js v5 auto-detects URL from request headers on Vercel, so `AUTH_URL` is often unnecessary.
**Warning signs:** "Missing secret" errors in production; auth works locally but not deployed.

### Pitfall 3: CVE-2025-29927 Middleware Bypass

**What goes wrong:** Attackers can bypass middleware auth checks by spoofing the `x-middleware-subrequest` header, gaining access to protected routes.
**Why it happens:** Next.js versions before 14.2.25 improperly trust this internal header.
**How to avoid:** Use Next.js 14.2.25 or later. When creating the project, specify: `npx create-next-app@14`. Verify the installed version is >= 14.2.25.
**Warning signs:** Any Next.js 14 version below 14.2.25.

### Pitfall 4: Prisma Connection Exhaustion in Development

**What goes wrong:** "Too many database connections" errors during development because Next.js hot reload creates new PrismaClient instances.
**Why it happens:** Each hot reload instantiates a new PrismaClient with its own connection pool. After many saves, the connection limit is hit.
**How to avoid:** Use the singleton pattern with `globalThis` (see Code Examples). This caches the client instance across hot reloads.
**Warning signs:** Connection errors that appear after many code saves; restarting dev server fixes it temporarily.

### Pitfall 5: Server/Client Component Boundary Errors

**What goes wrong:** Hydration errors, "useState is not a function" errors, or Prisma imports leaking to the client bundle.
**Why it happens:** Mixing server and client component patterns. Using hooks in server components. Importing server-only modules in client components.
**How to avoid:**
1. Default to Server Components. Add `'use client'` only when needed.
2. Pattern: Server component fetches data, passes serialized props to client component.
3. Add `import 'server-only'` at the top of `lib/prisma.ts` and service files.
4. Serialize all dates to ISO strings before passing to client components.
**Warning signs:** Hydration mismatch warnings; massive client bundle size; `PrismaClient is not a constructor` in browser console.

### Pitfall 6: Audit Log Capturing AuditLog Writes (Infinite Loop)

**What goes wrong:** The Prisma extension that logs all create operations also logs the creation of AuditLog records, causing infinite recursion.
**Why it happens:** The extension intercepts `$allModels.create`, which includes the AuditLog model itself.
**How to avoid:** Either exclude the AuditLog model in the extension logic (`if (model === 'AuditLog') return query(args)`), or use a separate "base" Prisma client without the extension for writing audit records.
**Warning signs:** Stack overflow errors; extremely slow writes; audit log table growing exponentially.

### Pitfall 7: Soft Delete Not Applied Consistently

**What goes wrong:** Soft-deleted records appear in dropdown menus, search results, or count queries because some queries forget the `where: { deletedAt: null }` filter.
**Why it happens:** Soft delete is a convention, not enforced by the database. Every query must remember to filter.
**How to avoid:** Create service-layer functions that always include the filter. Never query master data models directly from page components -- always go through the service. Consider a Prisma Client extension that auto-filters `deletedAt` for master data models.
**Warning signs:** Deleted departments still appear in dropdowns; record counts include deleted items.

## Code Examples

### NextAuth v5 Complete Configuration

```typescript
// src/types/next-auth.d.ts
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "SUPER_ADMIN" | "HR_ADMIN" | "MANAGER" | "EMPLOYEE"
    } & DefaultSession["user"]
  }
  interface User {
    role: "SUPER_ADMIN" | "HR_ADMIN" | "MANAGER" | "EMPLOYEE"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "SUPER_ADMIN" | "HR_ADMIN" | "MANAGER" | "EMPLOYEE"
    id: string
  }
}
```

```typescript
// src/lib/auth.config.ts (edge-safe, no Prisma import)
import type { NextAuthConfig } from "next-auth"

export default {
  providers: [], // Providers added in auth.ts
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig
```

```typescript
// src/lib/auth.ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { loginSchema } from "@/lib/validations/auth"
import authConfig from "@/lib/auth.config"

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8 hours
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email, isActive: true },
        })

        if (!user || !user.hashedPassword) return null

        const passwordMatch = await bcrypt.compare(
          parsed.data.password,
          user.hashedPassword
        )

        if (!passwordMatch) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      return session
    },
  },
})
```

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth"
export const { GET, POST } = handlers
```

```typescript
// src/middleware.ts
import { auth } from "@/lib/auth"

export default auth((req) => {
  const { nextUrl } = req
  const isAuthenticated = !!req.auth

  const isAuthRoute = nextUrl.pathname.startsWith("/login")
  const isProtectedRoute = !isAuthRoute && !nextUrl.pathname.startsWith("/api/auth")

  // Redirect authenticated users away from login
  if (isAuthRoute && isAuthenticated) {
    return Response.redirect(new URL("/dashboard", nextUrl))
  }

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !isAuthenticated) {
    return Response.redirect(new URL("/login", nextUrl))
  }
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
```

### Prisma Singleton Pattern (Prisma 6.x)

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
```

### Prisma Schema (Phase 1 Models)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  SUPER_ADMIN
  HR_ADMIN
  MANAGER
  EMPLOYEE
}

model User {
  id              String    @id @default(cuid())
  name            String
  email           String    @unique
  hashedPassword  String
  role            Role      @default(EMPLOYEE)
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  auditLogs       AuditLog[]

  @@map("users")
}

model Department {
  id          String    @id @default(cuid())
  name        String
  description String?
  deletedAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  positions   Position[]

  @@map("departments")
}

model Position {
  id            String    @id @default(cuid())
  name          String
  departmentId  String
  department    Department @relation(fields: [departmentId], references: [id])
  deletedAt     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("positions")
}

model OfficeLocation {
  id            String    @id @default(cuid())
  name          String
  address       String?
  // IP restriction
  allowedIPs    String[]  // Array of IP ranges (e.g., "192.168.1.0/24")
  // GPS restriction
  latitude      Float?
  longitude     Float?
  radiusMeters  Int?      // Radius in meters for geo-fence
  deletedAt     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("office_locations")
}

model LeaveType {
  id              String    @id @default(cuid())
  name            String
  annualQuota     Int       // Days per year
  isPaid          Boolean   @default(true)
  genderRestriction String? // null = all, "MALE", "FEMALE"
  deletedAt       DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@map("leave_types")
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
}

model AuditLog {
  id          String      @id @default(cuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  action      AuditAction
  module      String      // Model name: "User", "Department", etc.
  targetId    String      // ID of the affected record
  oldValue    Json?       // State before change
  newValue    Json?       // State after change
  createdAt   DateTime    @default(now())

  @@index([userId])
  @@index([module])
  @@index([createdAt])
  @@map("audit_logs")
}
```

### Login Page Pattern

```typescript
// src/lib/validations/auth.ts
import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
})

export type LoginFormData = z.infer<typeof loginSchema>
```

```typescript
// src/app/(auth)/login/page.tsx
import { LoginForm } from "./_components/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold">HRMS</h1>
          <p className="text-sm text-muted-foreground">
            PT. Sinergi Asta Nusantara
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
```

### Dashboard Stat Card Pattern

```typescript
// src/components/shared/stat-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
}

export function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
```

### Reusable Data Table Pattern

```typescript
// src/components/shared/data-table.tsx
"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "./data-table-pagination"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageSize?: number
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 25,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize },
    },
  })

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
```

### Server Action with Form Pattern

```typescript
// src/lib/actions/user.actions.ts
"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createUserSchema } from "@/lib/validations/user"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

type ActionResult = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function createUser(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return { error: "Unauthorized" }
  }

  const rawData = Object.fromEntries(formData)
  const parsed = createUserSchema.safeParse(rawData)

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  })

  if (existingUser) {
    return { error: "Email sudah terdaftar" }
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12)

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      hashedPassword,
      role: parsed.data.role,
    },
  })

  revalidatePath("/users")
  return { success: true }
}
```

### Audit Log Filter Pattern

```typescript
// src/lib/services/audit.service.ts
import { prisma } from "@/lib/prisma"

interface AuditLogFilters {
  userId?: string
  module?: string
  startDate?: Date
  endDate?: Date
  page?: number
  pageSize?: number
}

export async function getAuditLogs(filters: AuditLogFilters) {
  const { userId, module, startDate, endDate, page = 1, pageSize = 25 } = filters

  const where: any = {}

  if (userId) where.userId = userId
  if (module) where.module = module
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ])

  return { logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `next-auth` v4 with `pages/api/auth/[...nextauth].ts` | `next-auth@beta` v5 with `auth.ts` at project root | 2024 | Single `auth()` function works everywhere. JWT/session callbacks simplified. `AUTH_` env prefix. |
| `@next-auth/prisma-adapter` | `@auth/prisma-adapter` | 2024 | New package scope under `@auth/` |
| Prisma Middleware for extensions | Prisma Client Extensions | Prisma 4.16+ (middleware deprecated in 6.14) | Use `$extends()` for audit logging, soft delete filtering |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | `AUTH_SECRET` / `AUTH_URL` (often auto-detected) | Auth.js v5 | Environment variable prefix changed |
| shadcn/ui Toast component | sonner (via shadcn/ui) | 2024 | Toast component deprecated in favor of sonner |
| `npx shadcn-ui@latest init` | `npx shadcn@latest init` | 2024 | CLI package name simplified |
| Prisma generates into `node_modules` | Prisma 7+ generates to custom output path | Prisma 7 (2025) | Not relevant for Prisma 6.x -- still generates into `node_modules/.prisma/client` |

**Deprecated/outdated:**
- `next-auth/next` and `next-auth/middleware` imports -- replaced by `auth()` from `@/auth`
- `getServerSession()` -- replaced by `auth()` in v5
- `useSession()` in server components -- use `auth()` instead (useSession only for client components)
- Prisma middleware -- deprecated since 4.16, removed in 6.14. Use Client Extensions.

## Open Questions

1. **Prisma 6.x exact latest version**
   - What we know: 6.2.1 is documented in official examples. Prisma 7 is the latest major.
   - What's unclear: The exact latest patch of 6.x. `npm install prisma@6` will resolve this.
   - Recommendation: Install with `npm install prisma@6 @prisma/client@6` to get latest 6.x.

2. **NextAuth v5 + Prisma Adapter edge compatibility**
   - What we know: Auth.js v5 requires splitting config into `auth.config.ts` (edge-safe) and `auth.ts` (full, with adapter) for middleware to work.
   - What's unclear: Whether PrismaAdapter works smoothly with Prisma 6 in all contexts.
   - Recommendation: Use the split config pattern (auth.config.ts for middleware, auth.ts for everything else). This is the officially documented approach.

3. **Session timeout behavior**
   - What we know: CONTEXT.md says "no Remember Me, session expires on browser close or after fixed idle timeout."
   - Recommendation (Claude's Discretion): Set JWT `maxAge` to 8 hours (standard work day). Combine with `strategy: "jwt"` so sessions expire server-side. Browser close behavior depends on cookie settings -- use `session` cookies (no `expires`/`maxAge` on the cookie itself, only on the JWT).

4. **Database hosting for development and production**
   - What we know: PostgreSQL 16 required. Vercel deployment.
   - What's unclear: Which PostgreSQL hosting provider (Supabase, Neon, Railway, Vercel Postgres).
   - Recommendation: Use Supabase or Neon (both offer free tiers with connection pooling). For local development, use Docker with `postgres:16` image or install PostgreSQL locally.

## Sources

### Primary (HIGH confidence)
- [Auth.js Official - RBAC Guide](https://authjs.dev/guides/role-based-access-control) - Role setup with JWT and database strategies
- [Auth.js Official - Migration to v5](https://authjs.dev/getting-started/migrating-to-v5) - All breaking changes, env vars, callbacks, middleware
- [Auth.js Official - Route Protection](https://authjs.dev/getting-started/session-management/protecting) - Server component, API route, middleware protection patterns
- [Prisma Official - Next.js Guide](https://www.prisma.io/docs/guides/nextjs) - Singleton pattern, Vercel deployment, configuration
- [shadcn/ui Official - Next.js Installation](https://ui.shadcn.com/docs/installation/next) - CLI commands, component structure
- [shadcn/ui Official - Data Table](https://ui.shadcn.com/docs/components/radix/data-table) - TanStack Table integration pattern
- [Next.js Official - Layouts and Pages](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts) - Route groups, nested layouts

### Secondary (MEDIUM confidence)
- [CVE-2025-29927 - Next.js Middleware Bypass](https://nvd.nist.gov/vuln/detail/CVE-2025-29927) - Fixed in 14.2.25
- [Prisma Client Extensions for Audit](https://github.com/prisma/prisma-client-extensions/tree/main/audit-log-context) - Official extension examples
- [Prisma Soft Delete Extension Pattern](https://www.prisma.io/docs/orm/prisma-client/client-extensions/middleware/soft-delete-middleware) - Migration from middleware to extensions
- [npm: next-auth](https://www.npmjs.com/package/next-auth) - v5 still on @beta tag, v4.24.13 is latest stable
- [Prisma Upgrade to v7 Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7) - Breaking changes in v7 (driver adapters, ESM)

### Tertiary (LOW confidence)
- Community blog posts on Auth.js v5 + Prisma + bcrypt patterns (multiple sources agree on the pattern)
- WebSearch results for Prisma 6.x version availability (need `npm view` to confirm exact version)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified against official docs and npm
- Architecture: HIGH - Next.js App Router patterns well-documented in official learn tutorial and docs
- Auth setup: HIGH - Auth.js v5 migration guide is comprehensive and verified
- Prisma version choice: MEDIUM - Prisma 6.x recommended over 7.x based on complexity analysis; exact latest 6.x patch needs `npm view` verification
- Audit log pattern: MEDIUM - Prisma Client Extension pattern is documented but exact implementation for capturing old/new values needs careful testing
- Pitfalls: HIGH - Security vulnerability (CVE), connection pooling, and type augmentation issues are well-documented

**Research date:** 2026-02-27
**Valid until:** 60 days (stack is stable; Auth.js v5 may reach stable release, but beta API is frozen)
