# Features Research: HRMS PT. Sinergi Asta Nusantara

**Domain:** Human Resource Management System (Indonesian market)
**Researched:** 2026-02-27
**Research Mode:** Features dimension (sub-features, Indonesian law compliance, anti-features)
**Confidence Note:** WebSearch was unavailable. Indonesian labor law findings are based on training knowledge of UU No. 13/2003, UU Cipta Kerja No. 6/2020 (and its derivative PP 35/2021), and BPJS/PPh 21 regulations current through early 2025. Flag items marked LOW confidence for manual verification against current gazette.

---

## Module 1: Employee Data Management

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Employee profile CRUD (nama, NIK, alamat, tempat/tanggal lahir, agama, jenis kelamin, status perkawinan, jumlah tanggungan) | Core entity. Every other module references this. | Low | Status perkawinan + tanggungan feeds PPh 21 PTKP calculation directly |
| Employment details (tanggal masuk, departemen, jabatan, status karyawan, gaji pokok, tunjangan) | Needed for payroll, attendance, org structure | Low | Tanggal masuk matters for prorate, cuti accrual, THR eligibility |
| Document upload per employee (KTP, NPWP, BPJS cards, ijazah, kontrak kerja) | Regulatory — employers must retain copies | Medium | File storage strategy matters (local vs cloud). Keep it simple: local/S3 |
| Emergency contact records | Standard HR practice | Low | |
| Employee status tracking (aktif, resign, PHK, kontrak habis, pensiun) | Must know who is currently employed | Low | Inactive employees should remain in DB for historical payroll/reports |
| Profile photo | Expected in any modern HR system | Low | |
| Department & position master data | Referenced by employee records, org structure | Low | Seed with PT SAN's actual departments |
| Role-based visibility (HR sees all, Manager sees department, Employee sees self) | Already in scope. Non-negotiable for multi-role system. | Medium | Row-level filtering, not just page-level |

### Differentiators (for thesis)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Employee timeline/history log | Shows all changes to an employee record over time (promotions, salary changes, department transfers) | Medium | Audit trail. Impressive in thesis defense. Implement as separate history table with timestamps |
| Organizational chart visualization | Visual department hierarchy | Medium | Nice for demo but not critical. Could use a simple tree component |
| Bulk import from Excel/CSV | Practical for initial data migration | Medium | Good thesis talking point (data migration strategy) |

### Indonesian-Specific

| Feature | Legal Basis | Complexity | Notes |
|---------|-------------|------------|-------|
| PKWT vs PKWTT contract type tracking | UU Cipta Kerja No. 6/2020, PP 35/2021 | Low | PKWT (kontrak/waktu tertentu) has max duration rules. PKWTT (tetap). Store contract type, start date, end date (for PKWT) |
| Contract expiry alerts for PKWT | PP 35/2021: PKWT max 5 years including extensions | Low | Query PKWT employees nearing end date. Simple but valuable |
| NPWP number field | Required for PPh 21 reporting. Employees without NPWP get 20% higher tax rate | Low | Boolean flag: has_npwp. If false, PPh 21 is 120% of normal rate |
| BPJS membership numbers (Kesehatan + Ketenagakerjaan) | Required for BPJS contribution reporting | Low | Two separate fields. Both mandatory for active employees |
| PTKP status field (TK/0, TK/1, K/0, K/1, K/2, K/3) | Drives PPh 21 calculation | Low | Derived from marital status + dependents, but should be explicitly confirmable since tax status may differ from actual marital status |
| Agama (religion) field | Relevant for THR calculation timing (which holiday), also standard Indonesian HR form | Low | Maps to which religious holiday triggers THR |

---

## Module 2: Recruitment Management

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Job posting CRUD (judul, deskripsi, departemen, requirements, status buka/tutup) | Core recruitment entity | Low | |
| Candidate/applicant records (nama, email, telepon, CV upload, posisi dilamar) | Core entity | Low | |
| Application status pipeline (Applied > Screening > Interview > Offered > Hired / Rejected) | Already in scope. Standard ATS pattern | Medium | State machine pattern. Each transition should be logged with timestamp + actor |
| Interview scheduling (tanggal, waktu, interviewer, lokasi/link) | Basic scheduling | Medium | Don't over-engineer: a date/time + notes field is sufficient |
| Notes/comments per candidate | Interviewers need to record feedback | Low | Simple text field per stage transition |
| Offer letter PDF generation | Already in scope | Medium | Template with merge fields (nama, posisi, gaji, tanggal mulai) |
| Convert hired candidate to employee record | Critical workflow: when status = Hired, create employee record pre-populated | Medium | Eliminates double data entry. Strong thesis point |

### Differentiators (for thesis)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Recruitment dashboard/analytics (time-to-hire, candidates per posting, conversion rates) | Shows data-driven HR capability | Medium | Aggregate queries. Good for thesis charts |
| Email notification to candidates on status change | Professional touch | Medium | BUT: this is marked out of scope (no email infra). Skip or use simple mailto: link |
| Candidate rating/scoring per interviewer | Structured evaluation | Low | Simple 1-5 rating + notes per interviewer. Adds rigor |

### Deliberately Simplified

| Feature | Why Simplify | Approach |
|---------|-------------|----------|
| Job posting publication | No need for external job board integration | Internal posting list only. No Indeed/LinkedIn API |
| Candidate application submission | No need for public career page | HR Admin manually enters candidates. Avoids building a public-facing portal |

---

## Module 3: Attendance & Leave Management

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Daily clock-in / clock-out | Core attendance function | Medium | One record per employee per day. Store exact timestamps |
| IP address restriction per office location | Already in scope. Prevents remote buddy-punching | Medium | Compare request IP against allowed ranges per office. Be aware of VPN/proxy edge cases |
| GPS geofencing per office location | Already in scope | Medium | HTML5 Geolocation API. Store lat/lng + radius per office. Calculate haversine distance |
| Leave request submission (type, dates, reason, attachment for sick leave) | Core leave function | Medium | |
| Leave approval workflow (Employee submits > Manager/HR approves/rejects) | Already in scope | Medium | Simple two-level: direct manager or HR. Don't build multi-level approval chains |
| Leave balance tracking per employee per year | Must know remaining days | Medium | Initialize on Jan 1 or on hire date anniversary. Decrement on approved leave |
| Attendance daily recap (hadir, absen, terlambat, pulang awal) | HR needs daily visibility | Low | Query + aggregate |
| Monthly attendance report per employee | For payroll input and compliance | Low | Summary: total hadir, total absen, total terlambat, total lembur hours |

### Indonesian Leave Types (Legal Compliance)

Based on UU No. 13/2003 (Ketenagakerjaan) as amended by UU Cipta Kerja No. 6/2020. **Confidence: MEDIUM** -- these are well-established regulations but specific amendments under Cipta Kerja should be verified.

| Leave Type | Indonesian Name | Entitlement | Notes |
|------------|----------------|-------------|-------|
| Annual leave | Cuti Tahunan | 12 days/year after 12 months of service | Resets annually. Carryover policy varies by company (common: unused days expire or carry max 6 days) |
| Sick leave | Cuti Sakit | As needed with doctor's note (surat dokter) | First 4 months: 100% salary. Months 5-8: 75%. Months 9-12: 50%. After 12 months: 25% before PHK. For short sick leave (1-2 days), many companies allow without doctor note |
| Maternity leave | Cuti Melahirkan | 3 months (1.5 months before + 1.5 months after delivery) | Full salary. Mandatory by law |
| Miscarriage leave | Cuti Keguguran | 1.5 months | With doctor/midwife certificate |
| Menstrual leave | Cuti Haid | First 2 days of menstrual period | Controversial in practice but legally exists (Art. 81 UU 13/2003). Many companies require employee to report, not require proof |
| Marriage leave | Cuti Menikah | 3 days | Paid leave |
| Child's marriage | Cuti Pernikahan Anak | 2 days | Paid leave |
| Child's circumcision/baptism | Cuti Khitanan/Pembaptisan Anak | 2 days | Paid leave |
| Spouse/parent/child/household member death | Cuti Kematian (keluarga inti) | 2 days | Paid leave |
| Other family member death | Cuti Kematian (keluarga lain) | 1 day | Paid leave |
| Hajj/long leave | Cuti Besar / Istirahat Panjang | Varies by company policy | UU Cipta Kerja made this company-policy-dependent rather than mandatory. Not required to implement for thesis |

**Implementation recommendation:** Create a `leave_types` master table seeded with the above. Each type has: name, is_paid (boolean), default_quota (nullable -- null means unlimited/as-needed like sick leave), requires_attachment (boolean), gender_specific (nullable: 'F' for maternity/menstrual, null for all).

### Attendance Edge Cases

| Edge Case | How to Handle | Complexity | Notes |
|-----------|---------------|------------|-------|
| Late arrival (terlambat) | Compare clock-in time against scheduled start time. Flag if > threshold (e.g., 15 min) | Low | Need a "work schedule" concept: jam masuk, jam pulang per employee or per company |
| Early departure (pulang awal) | Compare clock-out against scheduled end time | Low | Same schedule dependency |
| Forgot to clock out | Allow HR to manually edit/add clock-out time with audit note | Low | Important: must be editable. People forget |
| Overtime (lembur) | Track hours beyond scheduled end time. Requires manager approval | Medium | Indonesian law (Kepmenakertrans KEP.102/MEN/VI/2004): overtime pay = 1.5x hourly for first hour, 2x for subsequent hours on workdays. On rest days/holidays: different multiplier schedule. Store approved overtime hours separately |
| Work from home / remote | Flag attendance as WFH (skip IP/GPS validation) | Low | Need a WFH request/approval or HR override. Don't force GPS for legitimate WFH |
| Multiple clock-in same day | Prevent duplicate. Only one clock-in per day per employee | Low | DB unique constraint on (employee_id, date) |
| Weekend/holiday attendance | Should only be allowed if overtime is approved | Low | Maintain a holiday calendar + work schedule (5-day or 6-day week) |
| Missing attendance (alpha/absen tanpa keterangan) | Auto-flag days with no clock-in and no approved leave | Low | Important for payroll deductions |

**Critical concept: Work Schedule.** You need a base work schedule model (jam masuk, jam pulang, hari kerja). This can be company-wide for simplicity. Without this, you cannot calculate late/early/overtime.

### Differentiators (for thesis)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Attendance calendar view | Visual monthly calendar showing present/absent/leave per employee | Medium | Very demo-friendly for thesis defense. Use a calendar component |
| Overtime request & approval workflow | Structured overtime management before it happens | Medium | More rigorous than just tracking post-hoc |
| Holiday calendar management | Admin can set national holidays + company holidays per year | Low | Feeds into overtime calculation and attendance validation |
| Leave balance auto-calculation on hire anniversary | Automatically grants cuti tahunan after 12 months | Low | Nice automation touch |

---

## Module 4: Payroll Management

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Monthly payroll run (batch calculation for all active employees) | Core payroll function | High | Process all employees for a given month. Store results as immutable payroll records |
| Salary components: gaji pokok + tunjangan tetap + tunjangan tidak tetap | Standard Indonesian salary structure | Medium | Tunjangan tetap (fixed allowances: transport, meal, position) vs tunjangan tidak tetap (variable: overtime, bonus) matters for BPJS/tax base |
| Deductions: BPJS Kesehatan + BPJS Ketenagakerjaan (employee portion) | Mandatory by law | Medium | See rates below |
| PPh 21 calculation | Mandatory by law | High | See detailed section below |
| Payslip (slip gaji) PDF generation per employee | Already in scope | Medium | Must show all components: penghasilan bruto, potongan-potongan, penghasilan neto, PPh 21, take-home pay |
| Monthly payroll summary report | HR needs aggregate view | Low | Total gaji, total BPJS employer, total BPJS employee, total PPh 21 |
| Payroll history (cannot be edited after finalization) | Audit trail. Payroll must be immutable once "closed" | Medium | Draft > Finalized status. Once finalized, no edits (create adjustment in next month instead) |

### Indonesian Payroll Specifics

#### BPJS Kesehatan (Health Insurance)

**Confidence: MEDIUM** -- rates have been stable but verify against latest Perpres.

| Component | Rate | Basis | Cap |
|-----------|------|-------|-----|
| Employer contribution | 4% | Gaji pokok + tunjangan tetap | Max basis: Rp 12.000.000/month |
| Employee contribution | 1% | Gaji pokok + tunjangan tetap | Max basis: Rp 12.000.000/month |

- Minimum basis: UMK/UMP of the region
- Covers employee + max 4 family members (employee + spouse + 3 children)
- Additional family members: extra 1% per person (employee-paid)

#### BPJS Ketenagakerjaan (Employment Social Security)

**Confidence: MEDIUM** -- rates are well-established.

| Program | Employer | Employee | Basis |
|---------|----------|----------|-------|
| JHT (Jaminan Hari Tua) | 3.7% | 2% | Gaji pokok + tunjangan tetap |
| JKK (Jaminan Kecelakaan Kerja) | 0.24% - 1.74% (risk-tier based) | 0% | Gaji pokok + tunjangan tetap. For a collection company (office work), likely tier I: 0.24% |
| JKM (Jaminan Kematian) | 0.30% | 0% | Gaji pokok + tunjangan tetap |
| JP (Jaminan Pensiun) | 2% | 1% | Gaji pokok + tunjangan tetap. Max basis cap exists (adjusts annually, ~Rp 10.042.300 as of 2024). **Verify current cap** |

**Implementation note:** Store BPJS rates in a configuration table, not hardcoded. Rates change occasionally. JP has an annually-adjusting cap.

#### PPh 21 (Income Tax)

**Confidence: MEDIUM** -- The TER (Tarif Efektif Rata-rata) method was introduced via PP 58/2023, effective January 2024. This is a significant change from the old annualization method.

**Method as of 2024+: TER (Tarif Efektif Rata-rata)**

The new PPh 21 calculation uses two approaches depending on the month:

**January - November: Use TER (monthly effective rate)**
- Look up the employee's TER category (A, B, or C) based on PTKP status
- Category A: TK/0, TK/1, TK/2, TK/3 (single/no dependents up to 3)
- Category B: K/0, K/1, K/2 (married, 0-2 dependents)
- Category C: K/3 (married, 3 dependents)
- Apply the TER percentage directly to gross monthly income (penghasilan bruto)
- PPh 21 monthly = TER% x Gross Monthly Income
- This is simpler than the old method for monthly calculations

**December: Use full annualization (true-up)**
- Calculate actual annual PPh 21 using the standard method:
  1. Total annual gross income (Jan-Dec)
  2. Subtract: biaya jabatan (5% of gross, max Rp 6.000.000/year)
  3. Subtract: iuran pensiun/JHT employee portion
  4. = Penghasilan neto setahun
  5. Subtract: PTKP based on status
  6. = PKP (Penghasilan Kena Pajak)
  7. Apply progressive rates:
     - 0 - Rp 60.000.000: 5%
     - Rp 60.000.000 - Rp 250.000.000: 15%
     - Rp 250.000.000 - Rp 500.000.000: 25%
     - Rp 500.000.000 - Rp 5.000.000.000: 30%
     - > Rp 5.000.000.000: 35%
  8. PPh 21 December = Annual PPh 21 - Sum of PPh 21 already paid (Jan-Nov)

**PTKP Values (2024, verify if updated):**

| Status | Annual PTKP |
|--------|-------------|
| TK/0 | Rp 54.000.000 |
| TK/1 | Rp 58.500.000 |
| TK/2 | Rp 63.000.000 |
| TK/3 | Rp 67.500.000 |
| K/0 | Rp 58.500.000 |
| K/1 | Rp 63.000.000 |
| K/2 | Rp 67.500.000 |
| K/3 | Rp 72.000.000 |

**No NPWP penalty:** Employees without NPWP pay 20% higher PPh 21 (rate x 120%).

**Implementation recommendation:**
- Store TER lookup table in database (configurable). The TER table has ~50+ rows mapping income brackets to rates per category.
- Store PTKP values in config table.
- Store progressive tax brackets in config table.
- Monthly payroll (Jan-Nov): simple TER lookup and multiply.
- December payroll: full annualization true-up.
- **This is the single most complex feature in the entire system.** Budget significant time.

#### THR (Tunjangan Hari Raya)

**Confidence: MEDIUM** -- THR rules are well-established (Permenaker No. 6/2016).

| Rule | Detail |
|------|--------|
| Eligibility | Employees with >= 1 month of service |
| Amount (>= 12 months service) | 1x monthly salary (gaji pokok + tunjangan tetap) |
| Amount (1-12 months service) | Prorated: (masa kerja / 12) x monthly salary |
| Payment deadline | Latest 7 days before the religious holiday |
| Which holiday | Based on employee's religion (agama field in employee data). Islam: Idul Fitri. Christian: Christmas. Hindu: Nyepi. Buddhist: Waisak. Confucian: Imlek |
| Tax treatment | THR is taxable income. Under TER method, THR paid in same month is added to gross income for that month's TER calculation |

**Implementation:** THR is essentially a special payroll run. Can be integrated into the normal monthly payroll for the month it's paid, or run as a separate "THR payroll" batch. Recommendation: integrate into the monthly payroll as a special income component for the relevant month.

### Payroll Edge Cases

| Edge Case | How to Handle | Complexity | Notes |
|-----------|---------------|------------|-------|
| New hire mid-month (prorate) | Gaji = (hari kerja aktual / total hari kerja bulan) x gaji bulanan | Medium | Must define: prorate by calendar days or working days? Working days is more common. First month only |
| Resignation mid-month | Same prorate logic. Plus: calculate any remaining cuti tahunan compensation | Medium | Unused cuti tahunan is compensated financially on resignation (UU 13/2003 Art. 156) |
| Termination (PHK) | Severance calculation per UU Cipta Kerja | High | Complex formula based on masa kerja. **Recommend: OUT OF SCOPE for thesis.** Just handle the final month's prorated salary |
| Overtime pay (lembur) | Workday: 1.5x hourly (1st hour) + 2x (subsequent). Rest day: different schedule | Medium | Hourly rate = 1/173 x monthly salary (for 40hr/week schedule). Must pull approved overtime hours from attendance module |
| Salary adjustment mid-month | Rare. Can use new salary starting next full month | Low | Don't prorate salary changes within a month |
| Back-pay / retroactive adjustment | If salary increase is retroactive, calculate difference for prior months | High | **Recommend: handle as manual adjustment line item, not automated retro-calc** |
| Bonus payments | One-time additional income | Low | Add as income component for that month. Taxed via TER in the month paid |
| Employee without NPWP | PPh 21 x 120% | Low | Flag in employee data. Apply multiplier in calculation |
| BPJS cap changes mid-year | JP basis cap adjusts annually (usually Feb) | Low | Store cap in config table with effective date |
| December true-up results in negative PPh 21 | If TER overpaid during the year, December calculation produces negative (refund) | Medium | This is expected behavior under TER method. Handle gracefully: PPh 21 December can be negative, meaning employee gets money back |

### Differentiators (for thesis)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Payroll simulation/preview before finalization | HR can review calculated payroll before "closing" the month | Medium | Draft status with full calculation preview. Critical for catching errors |
| Year-to-date tax summary per employee | Shows cumulative PPh 21 paid, useful for annual tax filing | Low | Aggregate from monthly payroll records |
| Payroll comparison report (month-over-month) | Shows what changed vs last month | Medium | Useful for HR to spot anomalies |
| BPJS contribution report formatted for BPJS submission | Report matching BPJS's expected format | Medium | Very practical but adds complexity. Nice-to-have |

---

## Anti-Features (Deliberately Exclude)

These are features commonly found in enterprise HRMS that would balloon thesis scope without proportional value.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Multi-company / multi-tenant | Massive complexity (separate payroll configs, separate everything). This is for one company | Hardcode single-company. All config is company-wide |
| Performance management / KPI | Entire separate module with subjective scoring, 360 reviews, goal setting. Already marked out of scope | Not needed for PT SAN's current requirements |
| Training / learning management | Another full module. Not in scope | Skip entirely |
| Employee self-service portal for benefits enrollment | Enterprise feature. BPJS enrollment is handled externally | HR manages BPJS data directly in employee records |
| Automated bank transfer / payment gateway integration | Requires actual banking APIs, financial security concerns, PCI-like compliance | Payroll calculates amounts. Actual payment is done manually by finance. System just reports |
| Complex approval chains (multi-level, conditional routing) | 3+ level approval hierarchies are an engineering rabbit hole | Two-level max: Employee > Manager (or HR). Simple approve/reject |
| Shift scheduling / roster management | PT SAN is a standard office (likely 9-5). Shift scheduling is for manufacturing/retail | Single work schedule for the company. If needed later, add per-department schedules |
| Biometric integration | Already marked out of scope. Would require hardware + drivers | Web clock-in with IP/GPS is sufficient |
| Mobile native app | Already marked out of scope | Responsive web design covers mobile use |
| Email notifications / SMTP integration | Already marked out of scope. SMTP setup, deliverability, templates = scope creep | In-app notifications only (simple notification table + polling or just dashboard indicators) |
| Comprehensive severance calculator (pesangon) | PHK severance under Indonesian law has complex tiers based on reason for termination, masa kerja, etc. | Handle only the final month's prorated salary. Document severance as a future enhancement |
| Tax filing / e-SPT export | Generating files for DJP (tax authority) electronic filing is a separate compliance tool | Generate summary reports. Actual tax filing is done manually or via DJP's own system |
| Loan / salary advance management | Some HRMS include kasbon/pinjaman features. Separate financial tracking | Out of scope. Not core HR |
| Complex allowance formulas (tunjangan based on attendance %, KPI, etc.) | Variable allowance calculations that depend on other module outputs | Use fixed tunjangan amounts per employee. Variable components limited to overtime (from attendance data) |

---

## Complexity Notes

Features that are deceptively more complex than they appear.

### 1. PPh 21 Calculation -- HIGHEST COMPLEXITY

**Apparent complexity:** "Just apply a tax formula"
**Actual complexity:**
- TER lookup table has ~50+ rows with income brackets per category (A/B/C)
- December true-up requires full annualization with different logic than Jan-Nov
- Edge cases: mid-year hire (annualize partial year), resignation (final tax calculation), no NPWP surcharge
- THR month: THR added to gross income changes the TER bracket for that month
- Negative December tax (refund scenario)
- Must be testable: provide test cases with known correct outputs

**Recommendation:** Build and test PPh 21 as an isolated, pure-function calculation engine before integrating with payroll. Write extensive unit tests. This is the feature most likely to have bugs.

### 2. Attendance IP/GPS Validation -- MEDIUM-HIGH COMPLEXITY

**Apparent complexity:** "Just check if IP matches"
**Actual complexity:**
- Client IP detection behind proxies/load balancers (X-Forwarded-For header chain)
- Vercel serverless: need to correctly extract client IP from request headers
- GPS: browser geolocation API requires HTTPS + user permission. Can be denied or spoofed
- GPS accuracy varies (10m to 100m+). Need reasonable radius threshold
- Multiple office locations: must match against any allowed location
- WFH exception: need mechanism to bypass for approved remote work
- Timezone: ensure clock-in times are stored in WIB (UTC+7) or consistently in UTC

**Recommendation:** Start with IP restriction only (simpler, more reliable on desktop). Add GPS as a secondary/mobile option. Don't make GPS mandatory -- it's unreliable indoors.

### 3. Leave Balance Tracking -- MEDIUM COMPLEXITY

**Apparent complexity:** "Just count days"
**Actual complexity:**
- Accrual timing: cuti tahunan only after 12 months of service (first year = 0 days)
- Reset logic: calendar year vs anniversary date? Most companies use calendar year with prorate for first year
- Carryover: do unused days carry over? If so, max how many? Company policy decision
- Half-day leave: does the company allow it? Adds fractional tracking
- Sick leave: no fixed quota but extended sick leave triggers salary reduction tiers
- Calculating remaining balance must account for: approved leaves, pending leaves (reserved but not yet taken)
- Multiple leave types each with different rules (quota-based vs unlimited vs gender-specific)

**Recommendation:** Start simple -- calendar year reset, no carryover, no half-days. Make leave type rules configurable in the master table.

### 4. Payroll Run as Batch Process -- MEDIUM COMPLEXITY

**Apparent complexity:** "Calculate salary for each employee"
**Actual complexity:**
- Must pull data from multiple modules: employee (salary, PTKP status), attendance (overtime hours, absences), leave (unpaid leave days)
- All employees processed atomically -- partial payroll run is dangerous
- Draft vs finalized state management
- Cannot re-run a finalized month (immutability)
- Performance: calculating PPh 21 for hundreds of employees with TER lookups
- Data snapshot: payroll should record the values used at calculation time (salary, rates), not reference current values (which may change later)

**Recommendation:** Store a complete snapshot of all calculation inputs and outputs per employee per month in the payroll record. This makes the payroll record self-contained and auditable.

### 5. Offer Letter PDF Generation -- LOW-MEDIUM COMPLEXITY

**Apparent complexity:** "Just generate a PDF"
**Actual complexity:**
- Server-side PDF generation in Next.js serverless (Vercel) has constraints
- Puppeteer requires a Chromium binary (~300MB) -- too heavy for Vercel serverless
- @react-pdf/renderer works but has limited styling capability
- Alternative: use a lightweight library like jsPDF or pdf-lib
- Template management: hardcoded vs configurable template

**Recommendation:** Use @react-pdf/renderer for both payslip and offer letter PDFs. It works in serverless environments without a browser binary. Accept limited styling as a tradeoff. Alternatively, investigate pdf-lib for more control. **Verify Vercel compatibility before committing to a library.**

---

## MVP Feature Prioritization

For a thesis with 4 required modules, all modules must be functional. But within each module, prioritize:

### Must Ship (Table Stakes)
1. Employee CRUD with Indonesian fields (PTKP, NPWP, BPJS numbers, contract type)
2. Basic recruitment pipeline (posting > candidate > status tracking > offer letter PDF)
3. Clock-in/out with IP restriction + leave request/approval + balance tracking
4. Full payroll calculation (BPJS + PPh 21 TER method + payslip PDF)

### Should Ship (Strong Thesis)
5. Overtime tracking and calculation feeding into payroll
6. THR calculation
7. Attendance calendar view
8. Payroll draft/preview before finalization
9. Indonesian leave types fully modeled per law
10. Contract expiry alerts for PKWT

### Nice to Have (If Time Permits)
11. Employee history/audit log
12. Recruitment analytics dashboard
13. Bulk employee import
14. Year-to-date tax summary
15. GPS geofencing (in addition to IP)

---

## Sources and Confidence

| Topic | Confidence | Basis |
|-------|------------|-------|
| Indonesian leave types (UU 13/2003) | MEDIUM | Training knowledge of well-established law. Verified structure against commonly cited articles. UU Cipta Kerja amendments may have modified some provisions -- verify |
| BPJS rates | MEDIUM | Rates have been stable for years but exact caps (especially JP) adjust annually. Verify current JP cap |
| PPh 21 TER method | MEDIUM | PP 58/2023 introduced TER effective Jan 2024. Core mechanism is well-documented. TER lookup table values should be sourced from official DJP publication |
| THR rules | MEDIUM | Permenaker No. 6/2016. Well-established. Unlikely to have changed significantly |
| PTKP values | MEDIUM | Rp 54.000.000 for TK/0 has been stable since 2016. Verify if updated |
| Progressive tax brackets | MEDIUM | UU HPP added 35% bracket for >Rp 5B. Brackets established since 2022 |
| Overtime calculation formula | MEDIUM | KEP.102/MEN/VI/2004. 1/173 divisor for hourly rate is standard for 40hr/week. Verify still current |
| Feature categorization (table stakes vs differentiators) | HIGH | Based on domain knowledge of HRMS systems and thesis project scoping |

**Items flagged for manual verification:**
1. Current JP (Jaminan Pensiun) maximum basis cap for 2025/2026
2. TER lookup table values -- source from DJP Lampiran PP 58/2023
3. Whether PTKP values have been updated since 2016
4. BPJS Kesehatan maximum basis cap (verify Rp 12.000.000 is still current)
5. Any UU Cipta Kerja amendments affecting leave entitlements beyond what's documented here
