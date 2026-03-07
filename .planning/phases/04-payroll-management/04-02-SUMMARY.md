---
phase: 04-payroll-management
plan: "02"
subsystem: payments
tags: [bpjs, pph21, ter, decimal.js, payroll, indonesia-tax, pure-functions]

# Dependency graph
requires:
  - phase: 04-01
    provides: BPJS_RATES, PTKP_ANNUAL, TER_CATEGORY, TER_TABLE_A/B/C, PPH21_PROGRESSIVE_BRACKETS, BIAYA_JABATAN_RATE/MAX constants; PTKPStatus enum; decimal.js

provides:
  - calculateBPJS(grossSalary) — all 9 BPJS components with Kesehatan cap (12M) and JP cap (10,547,400)
  - calculateMonthlyPPh21(grossMonthly, ptkpStatus) — TER lookup returning category, rate%, and withheld amount
  - calculateDecemberPPh21(params) — full PMK 168/2023 annualization true-up with progressive tax and NPWP surcharge
  - BPJSResult, PPh21MonthlyResult, DecemberPPh21Result TypeScript interfaces

affects:
  - 04-03 (batch payroll engine will call calculateBPJS and calculateMonthlyPPh21/calculateDecemberPPh21)
  - 04-04 through 04-08 (all payroll UI and reporting ultimately depends on these calculation primitives)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure calculation services: no database calls, no side effects; input/output only"
    - "Decimal.js toDecimalPlaces(0) for rupiah rounding in all monetary results"
    - "TER table lookup: linear scan of sorted [upperLimit, rate] pairs; last row Infinity covers all values"
    - "Progressive tax: cumulative bracket loop with prevUpper tracking"
    - "PKP rounding: dividedToIntegerBy(1000).mul(1000) for floor-to-nearest-1000"

key-files:
  created:
    - src/lib/services/bpjs.service.ts
    - src/lib/services/pph21.service.ts
  modified: []

key-decisions:
  - "annualBpjsEmployee parameter in calculateDecemberPPh21 includes only JHT + JP employee contributions (not kesEmp) — BPJS Kesehatan is not deductible for PPh 21 per PMK 168/2023"
  - "decemberPPh21 floored at 0 in service layer; caller (payroll engine) handles negative case as employee refund"
  - "getTERCategory exported for use by batch engine to store category alongside payslip snapshot"
  - "No NPWP surcharge applied in monthly TER — only in December annualization (PMK 168/2023 §9)"

patterns-established:
  - "Pure service pattern: payroll calculation services import only Decimal, constants, and enums — never Prisma"
  - "Reference verification comments in file: test cases with expected values documented as code comments for future auditors"

# Metrics
duration: 3min
completed: 2026-03-07
---

# Phase 4 Plan 02: BPJS and PPh 21 Pure Calculation Services Summary

**Pure-function BPJS component calculator with cap logic and full PPh 21 TER + December annualization true-up per PP 58/2023 and PMK 168/2023**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-07T12:17:50Z
- **Completed:** 2026-03-07T12:21:10Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `calculateBPJS(grossSalary)` returns all 9 BPJS components with correct Kesehatan cap (Rp 12M) and JP cap (Rp 10,547,400); all values rounded to nearest rupiah
- `calculateMonthlyPPh21(grossMonthly, ptkpStatus)` performs TER category mapping and table lookup across all three PP 58/2023 tables (A, B, C)
- `calculateDecemberPPh21(params)` implements the full PMK 168/2023 six-step annualization: biaya jabatan cap, BPJS deduction, PTKP subtraction, PKP rounding, progressive Article 17 tax, and NPWP surcharge

## Task Commits

Each task was committed atomically:

1. **Task 1: Create bpjs.service.ts** - `e433c23` (feat)
2. **Task 2: Create pph21.service.ts** - `f67fa88` (feat)

**Plan metadata:** committed with docs entry below

## Files Created/Modified

- `src/lib/services/bpjs.service.ts` — BPJS pure calculation service with BPJSResult type and calculateBPJS function
- `src/lib/services/pph21.service.ts` — PPh 21 pure calculation service with TER lookup, monthly withholding, and December annualization

## Decisions Made

- **BPJS Kesehatan excluded from PPh 21 deduction**: `annualBpjsEmployee` in `calculateDecemberPPh21` represents only JHT + JP employee shares. BPJS Kesehatan premiums are not deductible for income tax purposes under PMK 168/2023.
- **`decemberPPh21` floored at 0**: The service returns 0 if the TER withholding exceeded annual obligation. The calling engine decides whether to refund the difference or carry it forward. This keeps the service layer clean and the decision in the business logic layer.
- **`getTERCategory` exported**: The batch engine needs to persist the TER category alongside the payslip snapshot (Decision #48 from 04-01 — snapshot pattern). Exporting this helper avoids re-deriving it in the engine.
- **No NPWP surcharge in monthly TER**: The 20% surcharge for missing NPWP applies only at the December annualization step per PMK 168/2023 §9. Monthly TER does not apply this surcharge.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Both pure calculation services are ready for the batch payroll engine (04-03)
- `calculateBPJS` and `calculateMonthlyPPh21` are the primary inputs for January–November payslip generation
- `calculateDecemberPPh21` receives accumulated annual data from the engine and returns the December withholding
- TypeScript compiles cleanly with `npx tsc --noEmit` — no new errors introduced
- No prisma imports in either service file (confirmed by grep)

---
*Phase: 04-payroll-management*
*Completed: 2026-03-07*
