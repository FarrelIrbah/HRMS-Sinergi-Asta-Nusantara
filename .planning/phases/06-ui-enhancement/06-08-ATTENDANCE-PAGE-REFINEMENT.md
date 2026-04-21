# 06-08: Attendance Page Refinement (Iteration)

**Date:** 2026-04-21
**Status:** Complete
**Scope:** `/attendance` page — "Hari Ini", "Ringkasan Minggu Ini", "Riwayat 7 Hari Terakhir" + admin carry-overs

---

## Context

Iteration on top of Phase 06-04 (Attendance & Leave Redesign). User feedback after live review flagged three unresolved issues on the employee Attendance page:

1. **"Hari Ini" card** — excessive whitespace to the right of "Jam Pulang" column; layout felt unbalanced.
2. **"Ringkasan Minggu Ini" card** — too much whitespace beneath the 5 weekday cells; card height felt empty.
3. **"Riwayat 7 Hari Terakhir" table** — whitespace beside the status column, columns unbalanced, and status badge colors were perceived as uncomfortable:
   - "Terlambat" → bright red felt alarming
   - "Pulang Awal" → pale gray felt ambiguous
   - "Tepat Waktu" → only border + text were green, so it looked hollow compared to the others

---

## Design Decisions

### Color System (new status palette)

Problem: the old palette mixed shadcn `destructive` (loud red), `secondary` (gray), and outline-only "Tepat Waktu" (hollow). The severity and semantics were inconsistent.

New palette, softer and semantically ordered:

| Status        | Token Colors                                | Rationale                                         |
| ------------- | ------------------------------------------- | ------------------------------------------------- |
| Tepat Waktu   | `bg-emerald-50 text-emerald-700 border-emerald-200` + dot | Filled pill = positive affirmation (not hollow) |
| Terlambat     | `bg-amber-50 text-amber-800 border-amber-200` + dot       | Warm warning, not alarming red                    |
| Pulang Awal   | `bg-rose-50 text-rose-700 border-rose-200` + dot          | Gentle red-pink = concern without alarm           |
| Lembur        | `bg-violet-50 text-violet-700 border-violet-200` + dot    | Neutral-positive info tone                        |
| Override/Manual | `bg-slate-50 text-slate-700 border-slate-200`           | Neutral meta-info                                 |

Each badge includes a **1.5px colored dot prefix** — improves scannability and adds a dynamic visual marker (WCAG: color is not the sole conveyor of meaning since badge text is also present).

### Card Layout — "Hari Ini"

Before: Two time columns flushed left → big whitespace to the right of Pulang.

After:
- 2-column grid with **vertical divider** (`divide-x divide-slate-200`), wrapped in a bordered container so both slots feel balanced
- Each slot has: icon chip + uppercase label + time + contextual badge (or "Target hh:mm" placeholder when empty)
- Below: **"Durasi Kerja" progress section** with:
  - Live elapsed time while clocked in (computed from `clockIn` timestamp)
  - `Progress` bar scaled against expected work-day duration (`workEndTime − workStartTime`)
  - Start/End work-hour anchor labels
- Bottom row: Clock-in/out button OR "Absen hari ini sudah lengkap" completion banner
- Header adds today's full date (`Senin, 21 Apr 2026`) aligned right

### Card Layout — "Ringkasan Minggu Ini"

Before: 5 day cells in grid with pale background; card content ended → big empty space below.

After:
- Day cells now **taller** (py-3, `flex-col justify-between`), each with:
  - Day name (EEE)
  - Date number (larger, `text-xl`)
  - Total hours (color-coded)
  - **Color-coded bottom bar strip** indicating status (emerald/amber/slate)
  - **Ring-2 emerald outline** on today's cell for orientation
- Below: **Separator** + footer row with 3 `WeekStat` tiles:
  - Total Jam, Rata-rata, Hari Hadir (x/5)
- Header now shows inline "N/5 hari hadir" chip
- Both cards use `flex flex-col` so heights equalize via the grid

### Table Layout — "Riwayat 7 Hari Terakhir"

Before: 5-column fixed table — status column auto-expanded to absorb whitespace.

After:
- **6 columns** with `table-fixed` + `<colgroup>` explicit widths: 22 / 12 / 12 / 14 / 28 / 12 (%)
  - New **"Lembur" column** (right-aligned, violet tint when present) — matches the admin detail view
- **Tanggal cell** now shows date + day name (EEEE, e.g. "senin") stacked, fills the wider column meaningfully
- Status column uses the new softer badge palette via shared `<AttendanceStatusBadges />`
- Overtime shown dedicated in Lembur column (not duplicated as a badge — `showOvertime={false}`)
- Row hover: `hover:bg-slate-50/50`
- Header adds "N catatan" count

---

## Shared Component

New: `src/components/attendance/attendance-status-badges.tsx`

Single source of truth for attendance status badges. Props:
- `record`: minimal attendance shape (isLate, isEarlyOut, overtimeMinutes, clockOut, isManualOverride, lateMinutes)
- `showOvertime` (default true) — hide when a dedicated Lembur column renders OT separately
- `showManual` (default true) — hide when "Manual" badge is rendered inline with date
- `className` — container override

Why centralized: three separate pages (`/attendance`, `/attendance-admin`, `/attendance-admin/[employeeId]`) previously rendered near-duplicate badge logic with inconsistent colors. Now all roles see identical badge semantics.

---

## Files Modified

### New
- `src/components/attendance/attendance-status-badges.tsx` (shared badge component)

### Modified
- `src/app/(dashboard)/attendance/_components/attendance-today.tsx` (major rewrite — grid + progress + weekly footer)
- `src/app/(dashboard)/attendance/_components/attendance-history.tsx` (added Lembur column, switched to shared badges, fixed widths)
- `src/app/(dashboard)/attendance/page.tsx` (pass `workStartTime`/`workEndTime` to AttendanceToday)
- `src/app/(dashboard)/attendance-admin/[employeeId]/page.tsx` (use shared badges, date+day layout, softer Manual badge)
- `src/app/(dashboard)/attendance-admin/_components/attendance-summary-table.tsx` (late-count badge switched from destructive to amber outline)

---

## Role Impact

| Role         | Pages affected                                                    |
| ------------ | ----------------------------------------------------------------- |
| EMPLOYEE     | `/attendance` — all three fixed                                   |
| MANAGER      | `/attendance-admin/[employeeId]` — badge palette + date/day stack |
| HR_ADMIN     | `/attendance-admin` (summary) + `/attendance-admin/[employeeId]` |
| SUPER_ADMIN  | Same as HR_ADMIN                                                  |

All roles see consistent badge semantics across every attendance surface.

---

## Skills Applied

- **`/shadcn-ui`** — Progress, Separator, Badge (outline variant with custom classes), Table with `colgroup`, Card composition
- **`/frontend-design`** — spacing rhythm, visual hierarchy, card-height parity via `flex flex-col` + parent grid
- **`/ui-ux-pro-max`** — semantic color assignment (warm warnings vs alarming destructives), dot-prefixed badges for at-a-glance parsing, contextual placeholder text ("Target 08:00") instead of blank slots
- **`/web-accessibility`** — `aria-label` on Progress, day cells, and table regions; decorative icons marked `aria-hidden`; color is redundant with text and shape (dot + label)
- **`/web-design-guidelines`** — Vercel-style neutrality (slate base, tone-on-tone surfaces), `tabular-nums` on all time/duration readouts, explicit column widths instead of auto-fill

---

## Verification

- `rtk tsc --noEmit` → 0 new errors (1 pre-existing in `recruitment/add-candidate-wrapper.tsx`)
- `rtk next build` → 0 errors, 0 warnings
- `rtk lint` → 0 new issues (7 pre-existing, none in modified files)

---

## Before/After Snapshot

**"Hari Ini" card**
- Before: 2 flex cols, unused right-half white space, no duration indicator
- After: bordered 2-col grid, vertical divider, progress bar tied to actual work hours, date label, equal card height with neighbor

**"Ringkasan Minggu Ini" card**
- Before: 5 thin day cells, hollow below
- After: 5 taller day cells with status-color bar strip + today-ring, separator + 3-tile stats footer

**"Riwayat 7 Hari Terakhir" table**
- Before: 5 cols, status column ballooning, bright-red "Terlambat", pale-gray "Pulang Awal", hollow "Tepat Waktu"
- After: 6 cols with explicit widths, amber-filled "Terlambat", rose-filled "Pulang Awal", emerald-filled "Tepat Waktu" (all with dot prefix), dedicated Lembur column

---

## Notes for Future Iterations

- The elapsed-time progress uses server-side `new Date()` at render — SSR-computed, not live. If a real-time counter is desired, wrap in a client component with `setInterval`. Trade-off: hydration cost vs accuracy. Current behavior acceptable because the page typically reloads on clock events.
- If `workStartTime`/`workEndTime` is null on `officeLocation`, fallback is 08:00–17:00 (8-hour day). Seeded dev data may have null values — handled gracefully.

---

## Sub-iteration (2026-04-21, follow-up)

User flagged that the Riwayat table was still too flush to card edges and the Lembur column felt isolated against the right rail.

**Changes applied:**

1. **Card padding restored.** Changed `CardContent className="p-0"` → `CardContent className="pt-0"` on three surfaces:
   - `attendance/_components/attendance-history.tsx`
   - `attendance-admin/[employeeId]/page.tsx`
   - `attendance-admin/_components/attendance-summary-table.tsx`
   Now the default `p-6 pt-0` applies, giving the table 24px horizontal breathing room from the card edge.

2. **Bordered table wrapper.** Replaced bare `<div class="overflow-x-auto">` with `<div class="overflow-hidden rounded-lg border border-slate-200">` so the table reads as a visually distinct container inside the card (instead of bleeding into it).

3. **Lembur column centered + pill-styled.** Changed alignment from `text-right` → `text-center` on header and cells. Overtime values now render as a small violet-tinted pill (`rounded-md border border-violet-200 bg-violet-50`) — matches the other status pills and no longer feels "mojok kanan".

4. **Column widths rebalanced.** Redistributed from `22/12/12/14/28/12` → `20/11/11/13/30/15` so Lembur gets more breathing room (15% vs 12%) and Status column (the widest content, 2 badges possible) grows slightly.

5. **Admin detail table aligned.** Applied the same `table-fixed` + `<colgroup>` structure to `attendance-admin/[employeeId]` detail table for consistency across all attendance tables.

---

## Sub-iteration 2 (2026-04-21, top-padding fix)

User flagged that the admin tables (`/attendance-admin` summary + `/attendance-admin/[employeeId]` detail) had their header row flush to the top of the Card — no breathing room.

**Root cause.** shadcn `CardContent` default class is `p-6 pt-0` — the baked-in `pt-0` assumes a `CardHeader` is rendered above it. On `/attendance` (employee view), a `CardHeader` is present so `pt-0` is correct. But on the two admin tables, the Card contains only `CardContent` (page header is outside the Card), so `pt-0` left the table flush to the top edge.

**Fix.** Changed `CardContent className="pt-0"` → `CardContent className="pt-6"` on:
- `attendance-admin/_components/attendance-summary-table.tsx`
- `attendance-admin/[employeeId]/page.tsx`

The employee-view `attendance/_components/attendance-history.tsx` retains `pt-0` because it has a `CardHeader` above (rendering the "Riwayat 7 Hari Terakhir" title).

**Rule of thumb going forward.** If a Card has no `CardHeader`, explicitly set `pt-6` on `CardContent` to restore the top padding that shadcn's default eats.

---

## Sub-iteration 3 (2026-04-21, Aksi column alignment)

User flagged that the "Aksi" column in `/attendance-admin` summary table was right-aligned, which felt uncomfortable to look at.

**Decision: center-align (per user preference).**

**Changes applied** in `attendance-admin/_components/attendance-summary-table.tsx`:
- `<TableHead className="text-right …">` → `text-center`
- `<div className="flex items-center justify-end gap-1">` → `justify-center`

Both the header and the button group are centered, so the action(s) sit mid-column and stay visually anchored to the row regardless of whether the viewer is HR Admin (2 buttons) or Manager (1 button).
