# Phase 3: Attendance and Leave Management - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Employees clock in/out from a web interface with IP and GPS location verification tied to their assigned office location. The system auto-flags late arrivals, early departures, and overtime. Employees submit leave requests through a Manager/HR approval workflow with real-time balance tracking. HR Admin gets attendance and leave data that feeds into payroll. Payroll calculations and notifications (email/push) are out of scope for this phase.

</domain>

<decisions>
## Implementation Decisions

### Clock-in interface
- Single toggle button: shows "Clock In" when not clocked in, switches to "Clock Out" after clocking in
- Lives as a dedicated top-level "Attendance" page in the sidebar navigation (not embedded in dashboard)
- Page shows: today's clock-in time + weekly hours summary (Mon-Fri progress/totals) alongside the button
- Recent attendance history (last ~7 days) displayed as a table below the clock-in button on the same page

### Attendance history table (employee view)
- Simple table format: Date | Clock In | Clock Out | Total Hours | Status
- Status values: On Time / Late / Early Out / Overtime (or combinations)

### Location verification UX
- Visible "Verifying location..." checking state shown after employee clicks the button
- On failure: show which specific check failed — "Your IP address is not in the allowed range" or "Your location is outside the allowed radius"
- If employee denies GPS permission or GPS is unavailable: fall back to IP check only (if IP passes, clock-in proceeds)
- HR Admin can manually add or correct attendance records for any employee (to handle legitimate exceptions and system errors)

### Work schedule definition
- Scheduled work hours (start/end time) are configured per office location
- All employees assigned to an office share that office's schedule for late/early/overtime calculation

### Leave request form
- Fields: leave type (dropdown), start date, end date, reason (required text), optional file attachment (e.g., doctor's note)
- Leave balance displayed in two places: always visible on the leave page for all leave types, AND shown inline in the submission form when a leave type is selected

### Leave cancellation
- Employee can cancel their own request only while status is still Pending
- Once approved or rejected, the employee cannot cancel self-service (must contact HR)

### Leave approver view
- Dashboard widget shows pending leave request count for Manager and HR Admin
- Full-page leave management list for reviewing and acting on requests
- Approve/Reject with optional notes inline or in a detail view

### Attendance views (HR Admin and Manager)
- Two-level view: all-employees summary table (monthly totals per employee) + drill-down into per-employee monthly detail
- Per-employee detail shows: date, clock-in, clock-out, late/early flags, total hours, overtime per day
- Manager sees only their department's employees
- HR Admin sees all employees

### Export
- Monthly attendance recap exportable as both Excel (.xlsx) and PDF
- Excel for data processing; PDF for formal printed records

### Claude's Discretion
- Exact overtime threshold calculation (e.g., minutes grace period before flagging late)
- Loading skeleton and empty state designs
- Exact pagination or row limits for history tables
- File attachment storage approach for leave documents
- How HR Admin manually override UI is structured (modal, inline edit, separate form)

</decisions>

<specifics>
## Specific Ideas

- Clock-in button should feel immediate and satisfying — it's something employees do every single day
- The toggle button pattern (single button that changes state) was explicitly preferred over two separate buttons
- Error messages for location failure should be specific enough that the employee knows what to fix, not just "access denied"
- The leave balance should be visible both passively (always on page) and actively (during form submission) — employee should never be surprised by their balance

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-attendance-leave-management*
*Context gathered: 2026-03-05*
