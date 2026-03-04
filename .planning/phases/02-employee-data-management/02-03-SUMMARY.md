---
phase: 02-employee-data-management
plan: 03
subsystem: employee-documents
tags: [api-routes, file-upload, document-management, filesystem]

dependency_graph:
  requires: ["02-01"]
  provides: ["document-upload-api", "document-download-api", "document-delete-api", "employee-document-service"]
  affects: ["02-05"]

tech_stack:
  added: []
  patterns: ["API route for binary file handling", "local filesystem storage", "multipart form data parsing"]

key_files:
  created:
    - src/lib/services/employee-document.service.ts
    - src/app/api/employees/[id]/documents/route.ts
    - src/app/api/employees/[id]/documents/[docId]/route.ts
  modified:
    - .gitignore

decisions:
  - id: 27
    decision: "Use prisma directly for employee lookup in document access check instead of importing from employee.service.ts"
    rationale: "Plan 02-02 creates employee.service.ts in parallel; using prisma directly avoids import errors during parallel execution"
    plan: "02-03"

metrics:
  duration: "~8 minutes"
  completed: "2026-03-04"
---

# Phase 02 Plan 03: Document Upload/Download Infrastructure Summary

Local filesystem document storage with API routes for upload, download, and delete of employee documents (PDF/JPEG/PNG, max 5MB).

## What Was Built

### Employee Document Service (`src/lib/services/employee-document.service.ts`)
- `getDocumentsByEmployeeId(employeeId)` - List documents ordered by createdAt desc
- `getDocumentById(docId)` - Single document lookup for download path
- `createDocumentRecord(data)` - Create DB record with audit logging
- `deleteDocument(docId, actorId)` - Delete DB record, remove file from disk, audit log

### Upload API Route (`POST /api/employees/[id]/documents`)
- Accepts multipart form data with `file` and `documentType` fields
- Validates: file exists, mime type (PDF/JPEG/PNG only), size (5MB max), document type enum
- Saves to `uploads/employees/{employeeId}/{timestamp}-{sanitized-name}`
- Creates DB record via service, returns document metadata
- Auth: HR_ADMIN and SUPER_ADMIN only

### Download API Route (`GET /api/employees/[id]/documents/[docId]`)
- Streams file with correct Content-Type and Content-Disposition headers
- Role-based access control:
  - HR_ADMIN/SUPER_ADMIN: any document
  - MANAGER: documents of employees in same department
  - EMPLOYEE: own documents only
- Validates document belongs to specified employee (prevents URL manipulation)

### Delete API Route (`DELETE /api/employees/[id]/documents/[docId]`)
- Removes both DB record and filesystem file
- Auth: HR_ADMIN and SUPER_ADMIN only

### Infrastructure
- Added `/uploads/` to `.gitignore`
- Upload directory created on-demand with `mkdir recursive`

## Decisions Made

| # | Decision | Rationale |
|---|----------|-----------|
| 27 | Use prisma directly for employee lookup in document access check | Plan 02-02 creates employee.service.ts in parallel; avoids import errors |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Buffer not assignable to BodyInit in Response constructor**
- **Found during:** Task 2
- **Issue:** TypeScript error: `Buffer` type not assignable to `BodyInit` in `new Response(fileBuffer, ...)`
- **Fix:** Wrapped with `new Uint8Array(fileBuffer)` which is valid BodyInit
- **Files modified:** `src/app/api/employees/[id]/documents/[docId]/route.ts`
- **Commit:** 7ecc995

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 5c6e79c | feat | Create document service and upload API route |
| 7ecc995 | feat | Create document download and delete API routes |

## Next Phase Readiness

Plan 02-03 deliverables are ready for Plan 02-05 (document management UI). The service functions and API routes provide the full backend for document CRUD operations. When Plan 02-02 completes, the `canAccessEmployeeDocuments` helper in the download route could optionally be refactored to use `canManagerAccessEmployee` and `getEmployeeByUserId` from `employee.service.ts`, but the current implementation is functionally equivalent.
