---
phase: 02-employee-data-management
plan: 07
subsystem: employee-profile
tags: [documents, emergency-contacts, file-upload, tabs]
depends_on:
  requires: ["02-03", "02-06"]
  provides: ["documents-tab", "emergency-contacts-tab", "employee-document-actions"]
  affects: []
tech-stack:
  added: []
  patterns: ["server-actions-with-audit", "inline-form-editing", "blob-download"]
key-files:
  created:
    - src/app/(dashboard)/employees/[id]/_components/documents-tab.tsx
    - src/app/(dashboard)/employees/[id]/_components/emergency-contacts-tab.tsx
    - src/lib/actions/employee-document.actions.ts
  modified:
    - src/app/(dashboard)/employees/[id]/_components/employee-profile-tabs.tsx
decisions: []
metrics:
  duration: "~10 min"
  completed: "2026-03-05"
---

# Phase 2 Plan 7: Documents & Emergency Contacts Tabs Summary

**One-liner:** Documents tab with upload/download/delete and emergency contacts tab with CRUD inline forms, replacing profile tab placeholders.

## What Was Done

### Task 1: Documents Tab (documents-tab.tsx)
- Created client component with upload section (document type select + file input)
- Document list table: type label, filename, size (formatted), upload date, action buttons
- Download via fetch-to-blob with createObjectURL and auto-click anchor pattern
- Delete with ConfirmDialog confirmation dialog
- readOnly mode hides upload section and delete buttons
- Empty state: "Belum ada dokumen yang diunggah"
- Loading states on upload, download, and delete operations

### Task 2: Emergency Contacts Tab + Actions + Profile Tabs Update
- **Server actions** (employee-document.actions.ts): createEmergencyContactAction, updateEmergencyContactAction, deleteEmergencyContactAction
  - All use requireHRAdmin() auth helper (HR_ADMIN + SUPER_ADMIN)
  - Zod validation via emergencyContactSchema
  - Max 3 contacts enforced in create action
  - Audit logging for all mutations
- **Emergency contacts tab** (emergency-contacts-tab.tsx): card layout showing name, relationship, phone, address
  - Inline add/edit form using react-hook-form + zodResolver
  - Edit and delete buttons per card (hidden in readOnly)
  - ConfirmDialog for delete confirmation
  - "Tambah Kontak Darurat" button hidden when 3 contacts exist or readOnly
- **Profile tabs update**: replaced placeholder divs with DocumentsTab and EmergencyContactsTab components
  - Extended SerializedEmployee type with documents and emergencyContacts arrays
  - Added imports for both new tab components

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

None - followed existing patterns from employee.actions.ts and document API routes.

## Verification

- `npx tsc --noEmit` passes with no errors
- employee-profile-tabs.tsx has no placeholder divs remaining

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 154fbb6 | feat(02-07): build documents tab with upload/download/delete |
| 2 | cb70996 | feat(02-07): build emergency contacts tab, actions, and update profile tabs |
