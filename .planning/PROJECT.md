# HRMS PT. Sinergi Asta Nusantara

## What This Is

A web-based Human Resource Management System for PT Sinergi Asta Nusantara, a collection management company in Jakarta, Indonesia. The system covers the complete employee lifecycle — recruitment, employee data, attendance & leave, and payroll — with role-based access for Super Admin, HR Admin, Manager, and Employee. Built as an undergraduate thesis project at Universitas Diponegoro using the ICONIX Process methodology.

## Core Value

HR staff can manage the complete employee lifecycle in one integrated system: from recruitment through payroll, with accurate Indonesian tax and social insurance compliance, accessible to each role only at the appropriate level.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Authentication & Access Control**
- [ ] Super Admin, HR Admin, Manager, and Employee roles with distinct permissions
- [ ] Credentials-based login (email + password) via NextAuth.js v5
- [ ] Role-specific dashboard views after login
- [ ] Session persistence across browser refresh

**Employee Data Management**
- [ ] CRUD for employee profiles: personal info, employment details, department, position
- [ ] Document upload and management per employee (KTP, NPWP, contract, etc.)
- [ ] Emergency contact records per employee
- [ ] Role-based visibility: HR Admin sees all, Manager sees their department, Employee sees own profile

**Recruitment Management**
- [ ] Job posting creation and publishing by HR Admin
- [ ] Candidate application submission and tracking
- [ ] Interview scheduling linked to candidates
- [ ] Application status pipeline: Applied → Screening → Interview → Offered → Hired / Rejected
- [ ] Offer letter generation as downloadable PDF

**Attendance & Leave Management**
- [ ] Web-based daily clock-in / clock-out restricted to office IP or GPS zone
- [ ] Multiple office location support, each with its own allowed IP range or GPS zone
- [ ] Leave request submission by employees (annual, sick, maternity, and other types)
- [ ] Leave approval workflow (Manager or HR Admin approves/rejects)
- [ ] Real-time leave balance tracking per employee
- [ ] Attendance recap and reports (daily, monthly)

**Payroll Management**
- [ ] Monthly salary calculation: base salary + allowances + overtime − deductions
- [ ] BPJS Kesehatan deduction (employer and employee portions)
- [ ] BPJS Ketenagakerjaan deduction (employer and employee portions)
- [ ] Full PPh 21 calculation: annualization, PTKP tiers (TK/0, K/0, K/1, K/2, K/3), progressive rates
- [ ] Electronic payslip generation as downloadable PDF per employee
- [ ] Monthly payroll report for HR Admin

**General**
- [ ] Indonesian language UI labels throughout
- [ ] Responsive design for desktop and mobile
- [ ] Role-specific dashboard with summary widgets

### Out of Scope

- Biometric attendance — web clock-in only (IP/GPS restriction is sufficient)
- Email delivery of payslips or offer letters — download-only PDF
- ICONIX artifacts inside the system — they are separate thesis documentation
- Native mobile app — web responsive only
- Real-time messaging or chat between users
- Performance appraisal or KPI tracking — not in PT SAN's current HR scope
- OAuth / SSO login — credentials-based only per requirements

## Context

- **Client:** PT Sinergi Asta Nusantara — collection management company, Jakarta, Indonesia
- **Thesis:** Universitas Diponegoro, methodology: ICONIX Process (domain model → use cases → robustness diagrams → sequence diagrams → class diagrams → implementation). Artifacts are produced as separate thesis documents, not embedded in the system.
- **Office locations:** Multiple Jakarta locations, each requiring its own IP range or GPS zone for attendance validation
- **Indonesian payroll context:** BPJS Kesehatan (4% employer / 1% employee), BPJS Ketenagakerjaan (JHT 3.7% employer / 2% employee, JP 2% employer / 1% employee), PPh 21 with full annualization and PTKP tier lookup
- **Data scale:** PT SAN is a mid-size company — system should handle hundreds of employee records comfortably

## Constraints

- **Tech Stack:** Next.js 14 App Router + TypeScript — full-stack in one framework
- **Database:** PostgreSQL 16 + Prisma ORM — type-safe queries, migrations via Prisma
- **UI:** Tailwind CSS + shadcn/ui — consistent, accessible component library
- **Auth:** NextAuth.js v5, credentials provider, role-based access control
- **Forms & Validation:** React Hook Form + Zod — client and server-side validation
- **Deployment:** Vercel — serverless, automatic CI/CD
- **PDF Generation:** Server-side PDF (likely Puppeteer or @react-pdf/renderer) — no email, download only
- **Architecture:** Clean architecture with separation of concerns — API routes in `/app/api/`, server actions or service layer, Prisma in repository layer
- **Language:** All UI labels in Indonesian (Bahasa Indonesia)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Full PPh 21 calculation (annualization + PTKP tiers + progressive rates) | Thesis requires accurate real-world payroll, simplified approximation not acceptable | — Pending |
| IP/GPS attendance restriction (multiple zones) | No biometric hardware, but must prevent buddy-punching; multiple offices require per-location config | — Pending |
| PDF download only for payslips and offer letters | Avoids email infrastructure complexity (SMTP, deliverability) for thesis scope | — Pending |
| NextAuth.js v5 credentials-only (no OAuth) | PT SAN doesn't use Google Workspace or similar; password auth is sufficient | — Pending |
| ICONIX methodology as documentation only | Methodology governs design artifacts; system is implementation output, not a CASE tool | ✓ Good |

---
*Last updated: 2026-02-27 after initialization*
