# Phase 1: Foundation - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Authentication, user & role management, master data setup (departments, positions, office locations, leave types), audit logging, and role-appropriate dashboard skeletons. This phase establishes the infrastructure every subsequent module depends on. Employee data, attendance, payroll, and recruitment are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Dashboard layout
- Top summary row (4 stat cards) + content area below — classic HR admin layout
- Placeholder widgets show static "0" values (not hidden, not stubbed with messaging) — looks like a real dashboard from day one
- Shared core widgets + role-specific additions: Super Admin and HR Admin share core metrics (headcount, pending leave, payroll status, open vacancies); Employee gets personal stats
- Employee dashboard shows personal stats: remaining leave balance, latest payslip link, attendance summary — all placeholder "0" in Phase 1

### Authentication flow
- Centered card on a branded background with PT. Sinergi Asta Nusantara company name/logo
- All roles redirect to `/dashboard` after login — dashboard renders role-appropriate content
- No "Remember me" — session expires when browser closes or after a fixed idle timeout
- Generic error message: "Email or password is incorrect" — does not reveal whether the email exists

### Audit log
- Table columns: Timestamp, User, Action (create/update/delete), Module, Target, Old Value, New Value
- Old Value / New Value for complex records: link to a detail view showing the full before/after diff — table row stays clean
- Filters always visible in a bar above the table (user, date range, module)
- Paginated table — 25 or 50 rows per page

### Master data forms
- Office location form has two separate sections: one for IP range, one for GPS + radius — admin can fill either or both to enable that verification method
- Leave type quotas: single number field (days per year), applies to all employees equally
- Master data uses soft delete: deactivated records are hidden from dropdowns but historical references are preserved
- All 4 master data types (departments, positions, office locations, leave types) managed under a single Master Data settings page with tabs for each type

### Claude's Discretion
- Session timeout duration (e.g., 8 hours vs 24 hours)
- Loading skeleton styling within widgets
- Exact spacing, typography, color palette
- Error state handling for failed data loads on dashboard
- GPS radius validation range (minimum/maximum meters)

</decisions>

<specifics>
## Specific Ideas

- Branding on login page should reference the company name "PT. Sinergi Asta Nusantara"
- Audit log detail view should show a clean before/after diff (not raw JSON)
- Soft delete applies consistently across all 4 master data types

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-02-27*
