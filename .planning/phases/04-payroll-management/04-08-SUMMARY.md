---
plan: "04-08"
phase: "04-payroll-management"
status: complete
completed: "2026-03-08"
commits:
  - hash: "4717b14"
    message: "feat(04-08): seed salaries, sidebar nav, dashboard payroll widget"
  - hash: "833b3d2"
    message: "fix(04-08): payslip download button and add THR sidebar nav"
---

# Plan 04-08 Summary: Dashboard Integration, Seed Salaries, Sidebar Nav

## What Was Built

### Task 1: Seed Salaries + Sidebar Nav + Dashboard Payroll Widget

**prisma/seed.ts** — Extended with salary seeding:
- `updateMany` sets baseSalary=5,000,000 for all employees with baseSalary=0
- Specific overrides: EMP-2024-0001 = Rp 8,000,000 | EMP-2024-0002 = Rp 6,500,000 | EMP-2024-0003 = Rp 7,200,000
- Adds "Tunjangan Transport" Rp 500,000 (isFixed=true) allowance if none exists

**src/components/layout/sidebar.tsx** — Added payroll nav items:
- "Penggajian" → /payroll (Banknote icon, HR Admin + Super Admin)
- "Hitung THR" → /payroll/thr (Gift icon, HR Admin + Super Admin)
- "Slip Gaji" → /payslip (Receipt icon, all roles)

**src/lib/services/dashboard.service.ts** — Extended getDashboardData():
- Added current-month PayrollRun query (month_year unique constraint)
- Returns `payrollStatus: { status, _count: { entries } } | null`

**src/app/(dashboard)/dashboard/_components/hr-admin-dashboard.tsx** — Added StatCard:
- "Penggajian Bulan Ini" shows DRAFT/Difinalisasi/Belum Diproses
- Description shows employee count or "Klik Hitung Gaji untuk memulai"
- Links to /payroll

### Gap Fixes (after human checkpoint)

**src/app/(dashboard)/payroll/[periodId]/_components/payroll-entry-table.tsx** — Simplified payslip button:
- Replaced `Button asChild` pattern with direct `<a>` + `buttonVariants` for FINALIZED state
- DRAFT state still renders disabled Button — no behavioral change
- Added `cn` + `buttonVariants` imports

**src/app/api/payroll/payslip/[entryId]/route.ts** — Added try/catch:
- PDF generation wrapped in try/catch
- console.error logs server-side failures
- Returns 500 with error message text for browser visibility

## Verification

- `npx tsc --noEmit` exits 0 ✓
- Sidebar shows "Penggajian", "Hitung THR", "Slip Gaji" links for appropriate roles ✓
- HR Admin dashboard shows "Penggajian Bulan Ini" widget ✓
- Seed adds baseSalary to employees; specific overrides applied ✓
- End-to-end payroll flow verified by human (10/10 tests) ✓

## Human Checkpoint Results

User tested all 10 items. Initial failures:
1. **Test 6 (Payslip download)**: `asChild` + `disabled` interaction on Button prevented anchor from navigating → Fixed by using direct anchor + buttonVariants
2. **Test 9 (THR navigation)**: No sidebar link to /payroll/thr → Fixed by adding "Hitung THR" nav item

All other tests passed: salary setup, payroll run, DRAFT table, calculation spot-check, Excel download, finalization, HR payslip access, employee payslip page, security (403 for cross-employee), dashboard widget.
