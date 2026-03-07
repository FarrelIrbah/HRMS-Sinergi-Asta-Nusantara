# Phase 5: Recruitment Management - Research

**Researched:** 2026-03-08
**Domain:** Kanban drag-and-drop, @react-pdf/renderer offer letters, file uploads, form pre-fill via URL params, Prisma schema extension
**Confidence:** HIGH (codebase findings) / MEDIUM (dnd-kit API details, verified against official search)

## Summary

Phase 5 adds recruitment pipeline management to an existing Next.js 14 / Prisma 6 / shadcn HRMS project. The codebase has well-established patterns for file upload (local filesystem at `uploads/` via API routes), PDF generation (`@react-pdf/renderer` v4.3.2 already installed), form validation (zod + react-hook-form), and server-component searchParams-based pre-filling. None of the drag-and-drop libraries are currently installed — `@dnd-kit/core` + `@dnd-kit/sortable` is the clear choice.

The five technical sub-problems are: (1) Kanban drag-and-drop with @dnd-kit, (2) offer letter PDF with the established @react-pdf/renderer pattern, (3) CV file upload using the existing document upload API pattern, (4) `router.push('/employees/new?...')` pre-fill using Next.js searchParams (the `/employees/new` page already supports `searchParams` via its server component), and (5) three new Prisma models (Vacancy, Candidate, Interview).

**Primary recommendation:** Use @dnd-kit/core + @dnd-kit/sortable for Kanban; mirror the payslip PDF route pattern for offer letters; mirror the employee document upload route for CV upload; use plain Next.js searchParams (no nuqs needed) for candidate-to-employee pre-fill.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dnd-kit/core | 6.3.1 | DnD primitives (sensors, collision, DndContext) | Active, modern, works with Next.js strict mode; react-beautiful-dnd unmaintained |
| @dnd-kit/sortable | 10.0.0 | Sortable presets (useSortable, SortableContext, arrayMove) | Companion to core, needed for multi-column Kanban |
| @react-pdf/renderer | 4.3.2 (already installed) | Offer letter PDF generation | Already in project, established pattern exists |
| nuqs | 2.8.8 (already installed) | URL query state for filters | Already used in employees/filters; NOT needed for simple pre-fill |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @dnd-kit/utilities | (peer of sortable) | CSS utilities, transform helpers | May be required as peer dep — check post-install |
| date-fns | 4.1.0 (already installed) | Date formatting in offer letter | Use `format()` from date-fns for letter date |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit | react-beautiful-dnd | RBD is officially unmaintained; requires `reactStrictMode: false` in next.config — not acceptable |
| @dnd-kit | @hello-pangea/dnd (RBD fork) | Community fork, less ecosystem support, harder to find examples |
| @dnd-kit | pragmatic-drag-and-drop | Atlassian's new lib, lower community adoption, fewer examples |

**Installation:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/(dashboard)/recruitment/
│   ├── page.tsx                          # Vacancy list (server component)
│   ├── new/
│   │   └── page.tsx                      # Create vacancy form
│   ├── [vacancyId]/
│   │   ├── page.tsx                      # Vacancy detail + Kanban (server component)
│   │   └── _components/
│   │       ├── kanban-board.tsx          # "use client" - DndContext wrapper
│   │       ├── kanban-column.tsx         # Column with SortableContext
│   │       ├── candidate-card.tsx        # useSortable item card
│   │       └── schedule-interview-dialog.tsx
│   └── [vacancyId]/candidates/
│       └── [candidateId]/
│           └── page.tsx                  # Candidate detail page
├── app/api/
│   ├── recruitment/
│   │   ├── vacancies/route.ts            # POST create vacancy
│   │   ├── vacancies/[id]/route.ts       # PATCH status
│   │   ├── candidates/route.ts           # POST add candidate
│   │   ├── candidates/[id]/route.ts      # PATCH update stage
│   │   ├── candidates/[id]/cv/route.ts   # POST upload CV (mirrors document upload)
│   │   ├── candidates/[id]/interview/route.ts  # POST/PATCH schedule interview
│   │   └── candidates/[id]/offer-letter/route.ts  # GET generate PDF
├── lib/
│   ├── actions/recruitment.actions.ts    # Server actions (vacancy CRUD, candidate stage)
│   ├── services/recruitment.service.ts   # DB queries
│   ├── pdf/offer-letter-pdf.tsx          # @react-pdf/renderer component
│   └── validations/recruitment.ts        # Zod schemas
```

### Pattern 1: Kanban Board with @dnd-kit Multi-Container

**What:** DndContext at board level, one SortableContext per column, useSortable on each card. DragOverlay shows a ghost of the dragged card.
**When to use:** Any multi-column drag-and-drop where items move between containers.

```typescript
// Source: docs.dndkit.com + verified against chetanverma.com/blog tutorial
"use client";

import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  KeyboardSensor, PointerSensor, closestCorners,
  useSensor, useSensors, type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Each column has an id and an array of candidate IDs
const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
);

<DndContext
  sensors={sensors}
  collisionDetection={closestCorners}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
>
  {STAGES.map((stage) => (
    <KanbanColumn key={stage} stage={stage} candidates={candidatesByStage[stage]}>
      <SortableContext items={candidatesByStage[stage].map(c => c.id)}>
        {candidatesByStage[stage].map((c) => (
          <CandidateCard key={c.id} candidate={c} />
        ))}
      </SortableContext>
    </KanbanColumn>
  ))}
  <DragOverlay>{activeCandidate && <CandidateCard candidate={activeCandidate} isOverlay />}</DragOverlay>
</DndContext>

// In CandidateCard:
const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: candidate.id });
const style = { transform: CSS.Transform.toString(transform), transition };
```

**CRITICAL:** The `onDragEnd` handler must call a server action to persist the stage change to DB. The optimistic UI update (local state) happens immediately; server update fires async. If server update fails, revert local state and show toast.

### Pattern 2: Offer Letter PDF (mirrors payslip-pdf.tsx pattern exactly)

**What:** A React component in `src/lib/pdf/offer-letter-pdf.tsx` using `@react-pdf/renderer` primitives. Served via a GET route handler at `src/app/api/recruitment/candidates/[id]/offer-letter/route.ts` using `renderToStream`.
**When to use:** REC-06 — HR clicks "Download Offer Letter".

```typescript
// Source: codebase src/app/api/payroll/payslip/[entryId]/route.ts
import { renderToStream } from "@react-pdf/renderer";
import React, { type JSXElementConstructor, type ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";

const element = React.createElement(OfferLetterDocument, { data })
  as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>;

const stream = await renderToStream(element);
const chunks: Buffer[] = [];
for await (const chunk of stream as AsyncIterable<Buffer | string>) {
  chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
}
const pdfBuffer = Buffer.concat(chunks);

return new Response(new Uint8Array(pdfBuffer), {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${safeFileName}"`,
  },
});
```

**Download button on the page uses direct `<a>` + `buttonVariants`** (project convention, not `Button asChild`):
```tsx
// Source: project MEMORY.md pattern
<a
  href={`/api/recruitment/candidates/${candidateId}/offer-letter`}
  className={buttonVariants({ variant: "default" })}
  download
>
  Download Surat Penawaran
</a>
```

### Pattern 3: CV File Upload (mirrors existing employee document upload)

**What:** POST to `/api/recruitment/candidates/[id]/cv` with `FormData`. The route handler writes file to `uploads/candidates/{candidateId}/{timestamp}-{filename}` and stores relative path in DB. Mirrors exactly `src/app/api/employees/[id]/documents/route.ts`.
**Key details from codebase:**
- Storage: `uploads/candidates/{candidateId}/` (local filesystem, `mkdir recursive`)
- Allowed types: `application/pdf`, `image/jpeg`, `image/png`
- Max size: 5MB
- File path stored as relative: `uploads/candidates/{candidateId}/{filename}`
- `filePath` is joined with `process.cwd()` when reading back

### Pattern 4: Candidate-to-Employee Pre-fill via searchParams

**What:** The `/employees/new` page is a server component that already accepts `searchParams`. The conversion button at `/recruitment/[vacancyId]/candidates/[candidateId]` simply redirects via `router.push` to `/employees/new?namaLengkap=...&email=...&nomorHp=...&departmentId=...&positionId=...`.

The `/employees/new/page.tsx` must be updated to read these searchParams and pass them as `defaultValues` overrides to `CreateEmployeeForm`. This does NOT require nuqs — plain `searchParams` prop suffices (already the project pattern for filters).

**Fields pre-fillable from candidate:**
- `namaLengkap` → from `Candidate.namaLengkap`
- `email` → from `Candidate.email`
- `nomorHp` → from `Candidate.nomorHp`
- `departmentId` → from `Vacancy.departmentId`
- `positionId` → from `Vacancy.positionId` (if stored as ID, otherwise leave blank)

**CV attachment after conversion:** After the HR admin submits the employee creation form, the converted candidateId is passed via an additional query param (e.g. `?candidateId=xxx`). The `createEmployeeAction` does NOT handle this. Instead: a separate server action `attachCvAfterConversionAction(candidateId, employeeId)` copies the CV file to `uploads/employees/{employeeId}/` and creates a `EmployeeDocument` record with `documentType: LAINNYA`.

### Pattern 5: Single Server Action for Stage Change

**What:** Stage updates go through a Server Action (`updateCandidateStageAction`), not an API route, consistent with how `createEmployeeAction` and payroll actions work in this project.

```typescript
// "use server"
export async function updateCandidateStageAction(
  candidateId: string,
  newStage: CandidateStage
): Promise<ServiceResult<null>> { ... }
```

The Kanban drag handler calls this action optimistically.

### Anti-Patterns to Avoid

- **Using `Button asChild` for the offer letter download link**: The project explicitly avoids this — use direct `<a>` + `buttonVariants`. This is in MEMORY.md.
- **Trying to import Prisma enums in client components**: New enums (`CandidateStage`, `VacancyStatus`) must be added to `src/types/enums.ts` (client-safe copy pattern).
- **Building a custom drag-and-drop with mouse events**: The complexity is non-trivial (touch support, accessibility, scroll containers). Use @dnd-kit.
- **Putting drag-and-drop state in the server component**: The Kanban board MUST be `"use client"` — `DndContext` requires browser APIs.
- **Missing `"use server"` on actions file**: All files in `src/lib/actions/` have `"use server"` at top — follow this pattern.
- **Storing CV in DB as blob**: Project stores files on disk (uploads/) and stores the relative path in DB. Do not change this pattern.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop between columns | Custom mouse/touch handlers | @dnd-kit/core + @dnd-kit/sortable | Touch support, keyboard accessibility, scroll containers, z-index with DragOverlay — all handled |
| PDF with formal Indonesian letter format | HTML-to-PDF conversion | @react-pdf/renderer (already installed) | Already established pattern, works server-side in route handlers |
| File type validation | Custom MIME sniffing | Use the existing pattern from document upload route | Already handles edge cases |
| Converting candidate to employee | Building a new form | Redirect to existing `/employees/new` with searchParams | DRY — the form already exists |

**Key insight:** The project has established every non-Kanban pattern already. Phase 5 mostly reuses existing code (PDF, file upload, form, validations) and adds only one genuinely new technical challenge: @dnd-kit Kanban.

## Common Pitfalls

### Pitfall 1: DndContext and Next.js strict mode
**What goes wrong:** react-beautiful-dnd breaks with `reactStrictMode: true`. @dnd-kit does NOT have this problem — this is one of the primary reasons to choose dnd-kit.
**Why it happens:** RBD uses deprecated React lifecycle features.
**How to avoid:** Use @dnd-kit. No config changes needed.
**Warning signs:** If you see stale drag states in development, check that `DndContext` is mounted only once per board.

### Pitfall 2: Kanban state sync (optimistic vs DB)
**What goes wrong:** The drag-end handler updates local React state immediately (for perceived performance), then calls the server action. If the server action fails, the UI is out of sync.
**Why it happens:** No rollback mechanism.
**How to avoid:** Wrap the server action call in try/catch. On failure, reset the state to its pre-drag value and show `toast.error`. Keep a `previousState` snapshot at `onDragStart`.
**Warning signs:** After a failed update, the card appears in the wrong column.

### Pitfall 3: `items` prop order in SortableContext
**What goes wrong:** If the `items` array passed to `SortableContext` is not in the same order as the rendered items, sorting animations glitch.
**Why it happens:** SortableContext uses item order for coordinate calculations.
**How to avoid:** Always derive `items` from the same sorted array as the rendered list: `items={column.candidates.map(c => c.id)}`.
**Warning signs:** Cards jump to wrong positions during drag.

### Pitfall 4: CV file copy on employee conversion
**What goes wrong:** The CV is stored under `uploads/candidates/{candidateId}/`. After conversion, it needs to exist under `uploads/employees/{employeeId}/` to be managed via the existing document system.
**Why it happens:** The paths are different namespaces.
**How to avoid:** Use Node's `fs.copyFile` in the attachment action — do NOT move the original (the candidate record remains visible after conversion). Copy and create a new `EmployeeDocument` record.
**Warning signs:** Employee documents tab shows "File not found on disk" after conversion.

### Pitfall 5: `@react-pdf/renderer` — no Tailwind inside PDF
**What goes wrong:** `className` props have no effect inside PDF Document/Page/View/Text components. All styling must use `StyleSheet.create({})`.
**Why it happens:** @react-pdf/renderer uses its own layout engine, not the browser DOM.
**How to avoid:** Copy the style pattern from `src/lib/pdf/payslip-pdf.tsx`. Use only the supported CSS subset.
**Warning signs:** Styles silently ignored, layout looks unstyled.

### Pitfall 6: Offer letter generated for wrong stage
**What goes wrong:** The GET /offer-letter route is called for a candidate not yet in `DITERIMA` stage.
**Why it happens:** The download link exists on the page and the URL could be accessed directly.
**How to avoid:** The route handler must verify `candidate.stage === "DITERIMA"` before generating PDF, returning 403 otherwise. The download button on the UI should only render if `candidate.stage === "DITERIMA"`.
**Warning signs:** Offer letter downloaded for a candidate still in `MELAMAR`.

### Pitfall 7: Duplicate employee conversion
**What goes wrong:** HR clicks "Convert to Employee" twice for the same accepted candidate.
**Why it happens:** No guard in place.
**How to avoid:** Set `isConverted: true` on the Candidate record after conversion. The conversion action checks this flag and returns an error if already converted. The UI shows a "Converted" badge and disables the button.
**Warning signs:** Two User/Employee records created with the same email.

## Code Examples

### Prisma Schema — New Models

```prisma
// Source: codebase prisma/schema.prisma patterns

enum VacancyStatus {
  BUKA
  TUTUP
}

enum CandidateStage {
  MELAMAR
  SELEKSI_BERKAS
  INTERVIEW
  PENAWARAN
  DITERIMA
  DITOLAK
}

model Vacancy {
  id           String        @id @default(cuid())
  title        String
  departmentId String
  positionId   String?       // Optional — vacancy may not tie to a specific position
  description  String?
  requirements String?
  openDate     DateTime      @db.Date
  status       VacancyStatus @default(BUKA)
  createdBy    String        // userId of HR who created it
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  department Department  @relation(fields: [departmentId], references: [id])
  candidates Candidate[]

  @@map("vacancies")
}

model Candidate {
  id              String         @id @default(cuid())
  vacancyId       String
  namaLengkap     String
  email           String?
  nomorHp         String?
  stage           CandidateStage @default(MELAMAR)
  appliedAt       DateTime       @default(now())
  cvFileName      String?
  cvFilePath      String?        // relative: uploads/candidates/{id}/...
  cvMimeType      String?
  cvFileSize      Int?
  // Penawaran/Diterima stage fields
  offeredSalary   Decimal?       @db.Decimal(15, 2)
  startDate       DateTime?      @db.Date
  notes           String?
  // Conversion tracking
  isConverted     Boolean        @default(false)
  convertedAt     DateTime?
  convertedToId   String?        // Employee.id after conversion
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  vacancy   Vacancy    @relation(fields: [vacancyId], references: [id], onDelete: Cascade)
  interview Interview?

  @@index([vacancyId, stage])
  @@map("candidates")
}

model Interview {
  id            String    @id @default(cuid())
  candidateId   String    @unique   // one interview per candidate
  scheduledAt   DateTime
  notes         String?
  interviewerId String              // userId of interviewer
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  candidate   Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  interviewer User      @relation("InterviewerInterviews", fields: [interviewerId], references: [id])

  @@map("interviews")
}
```

**Note on User model:** Add relation field `conductedInterviews Interview[] @relation("InterviewerInterviews")` to the existing `User` model.

### Client-Safe Enums — Add to src/types/enums.ts

```typescript
// Append to src/types/enums.ts
export const VacancyStatus = {
  BUKA: "BUKA",
  TUTUP: "TUTUP",
} as const;
export type VacancyStatus = (typeof VacancyStatus)[keyof typeof VacancyStatus];

export const CandidateStage = {
  MELAMAR: "MELAMAR",
  SELEKSI_BERKAS: "SELEKSI_BERKAS",
  INTERVIEW: "INTERVIEW",
  PENAWARAN: "PENAWARAN",
  DITERIMA: "DITERIMA",
  DITOLAK: "DITOLAK",
} as const;
export type CandidateStage = (typeof CandidateStage)[keyof typeof CandidateStage];
```

### Offer Letter PDF Component Skeleton

```typescript
// Source: adapted from src/lib/pdf/payslip-pdf.tsx
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

export interface OfferLetterData {
  candidateName: string;
  positionTitle: string;
  departmentName: string;
  offeredSalary: number;
  startDate: string;         // pre-formatted date string
  letterDate: string;        // date of letter generation
  hrAdminName: string;
  companyName: string;       // "PT Sinergi Asta Nusantara"
}

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 11, padding: 50, color: "#1e293b" },
  // ... letter-style layout: letterhead, date, address block, body paragraphs, signature
});

export function OfferLetterDocument({ data }: { data: OfferLetterData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Kop surat, tanggal, perihal, salam, isi surat, penutup, tanda tangan */}
      </Page>
    </Document>
  );
}
```

### Pre-fill /employees/new from searchParams

```typescript
// Source: verified from codebase /employees/new/page.tsx + Next.js docs
// In /employees/new/page.tsx — add searchParams prop:
interface NewEmployeePageProps {
  searchParams: Promise<{
    namaLengkap?: string;
    email?: string;
    nomorHp?: string;
    departmentId?: string;
    positionId?: string;
  }>;
}

export default async function NewEmployeePage({ searchParams }: NewEmployeePageProps) {
  const prefill = await searchParams;
  // Pass prefill to CreateEmployeeForm as a new `prefill` prop
  return <CreateEmployeeForm departments={...} positions={...} prefill={prefill} />;
}

// In CreateEmployeeForm: use prefill values in form defaultValues
const form = useForm<CreateEmployeeInput>({
  defaultValues: {
    namaLengkap: prefill?.namaLengkap ?? "",
    email: prefill?.email ?? "",
    nomorHp: prefill?.nomorHp ?? "",
    departmentId: prefill?.departmentId ?? "",
    positionId: prefill?.positionId ?? "",
    // ... rest unchanged
  },
});
```

### Stage Change Server Action

```typescript
// Source: pattern from src/lib/actions/leave.actions.ts, payroll.actions.ts
"use server";

export async function updateCandidateStageAction(
  candidateId: string,
  newStage: CandidateStage
): Promise<ServiceResult<null>> {
  const authResult = await requireHRAdmin();
  if (!authResult.success) return { success: false, error: authResult.error };

  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
  if (!candidate) return { success: false, error: "Kandidat tidak ditemukan" };

  await prisma.candidate.update({
    where: { id: candidateId },
    data: { stage: newStage },
  });

  revalidatePath(`/recruitment/${candidate.vacancyId}`);
  return { success: true, data: null };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit/core + @dnd-kit/sortable | ~2022, accelerating | RBD no longer maintained; dnd-kit is the ecosystem default |
| @react-pdf/renderer v3 | @react-pdf/renderer v4 | 2024 | `renderToStream` API stable, same import pattern |

**Deprecated/outdated:**
- `react-beautiful-dnd`: Not maintained by Atlassian. `@hello-pangea/dnd` is a community fork but @dnd-kit has more ecosystem momentum and better Next.js compatibility.
- `react-sortable-hoc`: Archived/unmaintained. Do not use.

## Open Questions

1. **positionId on Vacancy — name string or ID?**
   - What we know: The `Vacancy` model could store a `positionId` (FK to `Position`) or just a `jobTitle` string. Candidate conversion pre-fills `positionId` in the employee form.
   - What's unclear: Does each vacancy correspond to an existing `Position` in the DB, or is it a freeform job title?
   - Recommendation: Store both `positionId` (optional FK — for direct pre-fill of employee form) and `title` (freeform string for display). If vacancy is linked to an existing Position, positionId enables direct pre-fill.

2. **Offer letter: HR Admin name for signature block**
   - What we know: The session gives `session.user.name` and `session.user.id`.
   - What's unclear: Should it always be the currently logged-in HR Admin, or the one who created the vacancy?
   - Recommendation: Use `session.user.name` at PDF generation time (the person downloading signs it). Simple and consistent with how payslip works (no fixed author).

3. **CV upload: at candidate creation or later?**
   - What we know: REC-03 says "add a candidate with contact details and resume/CV upload."
   - What's unclear: Is the CV required at creation, or optional/uploadable separately?
   - Recommendation: CV is optional at creation (the Prisma schema has nullable CV fields). HR can upload later from the candidate detail page, matching how employee documents work.

## Sources

### Primary (HIGH confidence)
- Codebase `src/lib/pdf/payslip-pdf.tsx` — exact @react-pdf/renderer API in use
- Codebase `src/app/api/payroll/payslip/[entryId]/route.ts` — renderToStream pattern
- Codebase `src/app/api/employees/[id]/documents/route.ts` — file upload pattern (FormData, fs writes, relative path storage)
- Codebase `src/app/(dashboard)/employees/new/_components/create-employee-form.tsx` — form defaultValues pattern, Resolver<T> cast
- Codebase `src/app/(dashboard)/employees/page.tsx` — searchParams usage in server component
- Codebase `prisma/schema.prisma` — all existing model conventions
- Codebase `src/types/enums.ts` — client-safe enum pattern
- Codebase `package.json` — confirmed @dnd-kit NOT installed; @react-pdf/renderer 4.3.2 installed

### Secondary (MEDIUM confidence)
- WebSearch: `@dnd-kit/core` latest version 6.3.1, `@dnd-kit/sortable` 10.0.0 (multiple npm sources agree)
- WebSearch: react-beautiful-dnd officially unmaintained — multiple sources including Atlassian references confirm
- chetanverma.com/blog dnd-kit tutorial — DndContext + SortableContext multi-column pattern verified

### Tertiary (LOW confidence)
- `@dnd-kit/utilities` peer dependency — noted in tutorial imports (CSS.Transform.toString), but version not verified from npm directly

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from package.json (what's installed), npm for @dnd-kit versions
- Architecture: HIGH — directly derived from reading existing codebase patterns
- Pitfalls: MEDIUM — codebase-derived pitfalls are HIGH; @dnd-kit-specific pitfalls (strict mode, item ordering) are MEDIUM (WebSearch verified)

**Research date:** 2026-03-08
**Valid until:** 2026-04-07 (stable libraries; @dnd-kit version unlikely to change meaningfully in 30 days)
