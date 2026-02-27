---
phase: 01-foundation
plan: 02
subsystem: auth
tags: [nextauth, jwt, credentials, bcrypt, middleware, zod, react-hook-form]

# Dependency graph
requires:
  - phase: 01-foundation-01
    provides: "Prisma schema with User model, bcryptjs, project scaffold"
provides:
  - "NextAuth v5 configuration with credentials provider"
  - "JWT session with role and id"
  - "Login page UI with form validation"
  - "Route-protection middleware"
  - "SessionProvider for client-side auth hooks"
affects: [01-foundation-03, 01-foundation-04, 01-foundation-05, 01-foundation-06, 01-foundation-07, 01-foundation-08, 01-foundation-09]

# Tech tracking
tech-stack:
  added: []
  patterns: [credentials-provider, jwt-session-strategy, edge-middleware-auth, type-augmentation]

key-files:
  created:
    - src/lib/auth.ts
    - src/lib/auth.config.ts
    - src/types/next-auth.d.ts
    - src/middleware.ts
    - src/app/api/auth/[...nextauth]/route.ts
    - src/lib/validations/auth.ts
    - src/app/(auth)/layout.tsx
    - src/app/(auth)/login/page.tsx
    - src/components/providers/session-provider.tsx
  modified:
    - src/app/layout.tsx

key-decisions:
  - "Split auth.config.ts (Edge) and auth.ts (Node) for middleware compatibility"
  - "8-hour JWT maxAge for work-day sessions"
  - "Generic error message for all login failures (security best practice)"

patterns-established:
  - "Auth config split: auth.config.ts for Edge, auth.ts for full Node runtime"
  - "Type augmentation in src/types/next-auth.d.ts for role in session"
  - "Validation schemas in src/lib/validations/ directory"
  - "Auth pages in (auth) route group with centered layout"
  - "Provider components in src/components/providers/"

# Metrics
duration: 8min
completed: 2026-02-27
---

# Phase 1 Plan 2: Authentication Summary

**NextAuth v5 credentials auth with JWT sessions, login page UI, and Edge middleware route protection**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-27T16:20:26Z
- **Completed:** 2026-02-27T16:28:34Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- NextAuth v5 with credentials provider, bcrypt password verification, and isActive check
- JWT session strategy (8h) with user id, name, email, and role in session
- Edge middleware protecting all routes except /login, /api/auth, and static assets
- Login page with react-hook-form, Zod validation, and generic error messages in Indonesian
- SessionProvider wrapping entire app for client-side auth hooks

## Task Commits

Each task was committed atomically:

1. **Task 1: Configure NextAuth v5 with credentials provider and type augmentation** - `22a6214` (feat)
2. **Task 2: Build login page with form validation** - `fa255c0` (feat)
3. **Task 3: Add SessionProvider wrapper** - `6addb00` (feat)

## Files Created/Modified
- `src/lib/auth.ts` - NextAuth v5 config with credentials provider, JWT/session callbacks
- `src/lib/auth.config.ts` - Edge-compatible auth config for middleware
- `src/types/next-auth.d.ts` - Type augmentation adding role and id to Session/JWT
- `src/middleware.ts` - Route protection middleware
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API route handler
- `src/lib/validations/auth.ts` - Zod login schema with Indonesian messages
- `src/app/(auth)/layout.tsx` - Centered auth layout
- `src/app/(auth)/login/page.tsx` - Login page with form, loading state, error handling
- `src/components/providers/session-provider.tsx` - Client-side SessionProvider wrapper
- `src/app/layout.tsx` - Updated to wrap with AuthSessionProvider

## Decisions Made
- Split auth config into auth.config.ts (Edge-safe, no Prisma/bcrypt) and auth.ts (full Node runtime) for middleware compatibility
- 8-hour JWT maxAge matching a typical work day
- Generic "Email atau password salah" error for all login failures (never reveals whether email exists)
- Used existing shadcn Card, Form, Input, Button components for login UI

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. AUTH_SECRET and DATABASE_URL already configured in .env from plan 01-01.

## Next Phase Readiness
- Authentication fully operational: login, session, route protection, logout infrastructure
- All subsequent plans can use `auth()` for server-side session access and `useSession()` for client-side
- Middleware protects all non-public routes automatically

---
*Phase: 01-foundation*
*Completed: 2026-02-27*
