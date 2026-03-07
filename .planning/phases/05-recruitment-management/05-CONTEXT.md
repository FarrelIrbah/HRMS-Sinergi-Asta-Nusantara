# Phase 5: Recruitment Management - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

HR Admin manages the full recruitment pipeline: creating job vacancies, tracking candidates through pipeline stages (Melamar → Seleksi Berkas → Interview → Penawaran → Diterima/Ditolak), scheduling interviews, generating offer letter PDFs, and converting accepted candidates into employee profiles. No candidate-facing portal. No external job board integration.

</domain>

<decisions>
## Implementation Decisions

### Pipeline & Candidate View

- Vacancy list page: simple table with Open/Closed status filter (consistent with existing DataTable patterns)
- Vacancy detail shows candidates as a **Kanban board** with columns per stage
- Stage columns: Melamar, Seleksi Berkas, Interview, Penawaran, Diterima, Ditolak
- HR moves candidates between stages via **drag-and-drop** on the Kanban
- Each candidate card shows: **name, applied date, interview date (if scheduled)**
- Clicking a candidate card opens the candidate detail/profile page

### Offer Letter Content & Generation

- Offer letter is accessible to **HR Admin only** — HR downloads the PDF and shares manually
- Salary offer and start date are **stored on the candidate record** (as fields on the Penawaran/Diterima stage), not entered ad-hoc at generation time
- Offer letter PDF content: candidate name, position applied for, offered salary, start date, company details (PT. Sinergi Asta Nusantara), HR Admin name/signature block, date of letter
- Letter body format: **formal narrative in Bahasa Indonesia** (professional letter style, not a form layout)

### Interview Scheduling UX

- Interview can be scheduled from **both** the Kanban card (when candidate is in Interview stage) and inside the candidate detail page
- **Single interview record** per candidate (editable if dates change)
- Interviewer selected from a **dropdown of system users** (Manager, HR Admin, Super Admin roles)
- Scheduling an interview **automatically moves the candidate to the Interview stage**
- No email notifications — interview is recorded in DB only

### Candidate-to-Employee Conversion

- "Convert to Employee" button available on candidates with **Diterima** status
- Clicking it **redirects to /employees/new** with candidate data pre-filled in the existing employee creation form
- Pre-filled fields: full name, email, phone, department (from vacancy), position (from vacancy)
- CV document is **automatically attached** as an employee document after conversion
- After conversion, candidate card **remains visible in the Diterima column** with a "Converted" badge — read-only, cannot be converted again

### Claude's Discretion

- Drag-and-drop library choice (react-beautiful-dnd, @dnd-kit, or similar)
- Exact Kanban card visual design and column scroll behavior
- Schema design for interview and offer details on candidate record
- Error state handling (e.g., converting a candidate when employee creation fails)

</decisions>

<specifics>
## Specific Ideas

- Kanban board should feel usable even with 10–15 candidates in a column (scrollable columns)
- The "Converted" badge on the candidate card should make it obvious the candidate is now an employee, preventing accidental duplicate conversion
- Offer letter narrative should feel like a real Indonesian company letter — respectful, formal tone (salam pembuka, body, penutup, tanda tangan)

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-recruitment-management*
*Context gathered: 2026-03-08*
