import { prisma } from "@/lib/prisma"

export interface PayrollStatusData {
  status: string
  _count: {
    entries: number
  }
}

export interface SuperAdminDashboardData {
  totals: {
    employees: number
    departments: number
    positions: number
    openVacancies: number
    candidatesInPipeline: number
  }
  today: {
    date: string
    present: number
    onLeave: number
    absent: number
    lateCount: number
  }
  payrollStatus: PayrollStatusData | null
  attendanceTrend: Array<{ date: string; label: string; present: number; late: number }>
  payrollTrend: Array<{ period: string; label: string; netPay: number; entries: number }>
  departmentBreakdown: Array<{ departmentId: string; name: string; count: number }>
  pendingApprovals: {
    leave: Array<{
      id: string
      employeeName: string
      leaveTypeName: string
      startDate: string
      endDate: string
      workingDays: number
      createdAt: string
    }>
    totalLeave: number
  }
  recentHires: Array<{
    id: string
    name: string
    nik: string
    department: string
    position: string
    joinDate: string
  }>
  upcomingBirthdays: Array<{
    id: string
    name: string
    position: string
    birthDate: string
    daysUntil: number
  }>
  recruitment: {
    openVacancies: number
    stageBreakdown: Array<{ stage: string; count: number }>
    upcomingInterviews: number
  }
}

export interface DashboardData {
  totalUsers: number
  totalDepartments: number
  totalPositions: number
  totalEmployees: number
  pendingLeaveRequests: number
  pendingLeaveCount: number
  todayAttendanceCount: number
  openVacancies: number
  payrollStatus: PayrollStatusData | null
  todayAttendance: number
  leaveBalance: number
  upcomingLeave: {
    leaveTypeName: string
    startDate: string
    endDate: string
    workingDays: number
  } | null
}

// ─── Role-specific dashboard types ──────────────────────────────────

export interface HrAdminDashboardData {
  totals: {
    employees: number
    activeVacancies: number
    candidatesInPipeline: number
  }
  today: {
    date: string
    present: number
    onLeave: number
    absent: number
    lateCount: number
    checkedOut: number
  }
  pendingApprovals: {
    total: number
    list: Array<{
      id: string
      employeeName: string
      department: string
      leaveTypeName: string
      startDate: string
      endDate: string
      workingDays: number
      createdAt: string
    }>
  }
  payroll: {
    status: PayrollStatusData | null
    monthLabel: string
    netTotal: number
    entriesCount: number
  }
  attendanceTrend: Array<{ date: string; label: string; present: number; late: number }>
  departmentBreakdown: Array<{ departmentId: string; name: string; count: number }>
  recentHires: Array<{
    id: string
    name: string
    department: string
    position: string
    joinDate: string
  }>
  upcomingBirthdays: Array<{
    id: string
    name: string
    position: string
    birthDate: string
    daysUntil: number
  }>
  contractExpiring: Array<{
    id: string
    name: string
    department: string
    position: string
    joinDate: string
  }>
  recruitment: {
    openVacancies: number
    stageBreakdown: Array<{ stage: string; count: number }>
    upcomingInterviews: number
  }
}

export interface ManagerDashboardData {
  department: {
    id: string | null
    name: string
    totalMembers: number
  }
  today: {
    date: string
    present: number
    onLeave: number
    absent: number
    lateCount: number
  }
  pendingApprovals: {
    total: number
    list: Array<{
      id: string
      employeeName: string
      leaveTypeName: string
      startDate: string
      endDate: string
      workingDays: number
      createdAt: string
    }>
  }
  teamOnLeave: Array<{
    id: string
    employeeName: string
    leaveTypeName: string
    startDate: string
    endDate: string
  }>
  teamRoster: Array<{
    id: string
    name: string
    position: string
    joinDate: string
    isPresent: boolean
    isLate: boolean
    isOnLeave: boolean
  }>
  attendanceTrend: Array<{ date: string; label: string; present: number; late: number }>
  positionBreakdown: Array<{ positionId: string; name: string; count: number }>
  upcomingBirthdays: Array<{
    id: string
    name: string
    position: string
    birthDate: string
    daysUntil: number
  }>
}

export interface EmployeeDashboardData {
  employee: {
    id: string
    name: string
    position: string
    department: string
    joinDate: string
    tenureMonths: number
  } | null
  todayAttendance: {
    date: string
    clockedIn: boolean
    clockedOut: boolean
    clockIn: string | null
    clockOut: string | null
    isLate: boolean
    lateMinutes: number
    totalMinutes: number
    workStartTime: string | null
    workEndTime: string | null
  }
  monthlyStats: {
    monthLabel: string
    presentDays: number
    lateDays: number
    absentDays: number
    workingDaysSoFar: number
    overtimeMinutes: number
  }
  attendanceTrend: Array<{ date: string; label: string; clockedIn: boolean; isLate: boolean; totalMinutes: number }>
  leaveBalances: Array<{
    leaveTypeId: string
    leaveTypeName: string
    allocated: number
    used: number
    remaining: number
  }>
  upcomingLeave: {
    leaveTypeName: string
    startDate: string
    endDate: string
    workingDays: number
  } | null
  pendingLeaveCount: number
  latestPayslip: {
    runId: string
    month: number
    year: number
    monthLabel: string
    netPay: number
    status: string
  } | null
  coworkerBirthdays: Array<{
    id: string
    name: string
    position: string
    birthDate: string
    daysUntil: number
  }>
  teamOnLeave: Array<{
    id: string
    employeeName: string
    leaveTypeName: string
    startDate: string
    endDate: string
  }>
}

/**
 * Returns dashboard data for the given role.
 * Phase 1: Returns real counts for organizational data (users, departments, positions).
 * Phase 3: Adds pendingLeaveCount, todayAttendanceCount.
 * Phase 4: Adds payrollStatus with real PayrollRun data.
 * Phase 5: Adds openVacancies count from Vacancy table.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const sevenDaysLater = new Date(today)
  sevenDaysLater.setUTCDate(sevenDaysLater.getUTCDate() + 7)

  // Current month payroll run status
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const [
    totalUsers,
    totalDepartments,
    totalPositions,
    totalEmployees,
    pendingLeaveCount,
    todayAttendanceCount,
    currentPayrollRun,
    openVacancyCount,
  ] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.department.count({ where: { deletedAt: null } }),
    prisma.position.count({ where: { deletedAt: null } }),
    prisma.employee.count({ where: { isActive: true } }),
    prisma.leaveRequest.count({
      where: { status: { in: ["PENDING_MANAGER", "PENDING_HR"] } },
    }),
    prisma.attendanceRecord.count({ where: { date: today } }),
    prisma.payrollRun.findUnique({
      where: { month_year: { month: currentMonth, year: currentYear } },
      select: { status: true, _count: { select: { entries: true } } },
    }),
    prisma.vacancy.count({ where: { status: "OPEN" } }),
  ])

  return {
    totalUsers,
    totalDepartments,
    totalPositions,
    totalEmployees,
    pendingLeaveRequests: pendingLeaveCount, // kept for backward compat with super-admin-dashboard
    pendingLeaveCount,
    todayAttendanceCount,
    openVacancies: openVacancyCount,
    payrollStatus: currentPayrollRun, // Phase 4: real PayrollRun data (null if not yet run)
    todayAttendance: todayAttendanceCount, // kept for backward compat
    leaveBalance: 0, // Phase 3: resolved per-employee in leave page
    upcomingLeave: null, // Phase 3: resolved per-employee in dashboard page
  }
}

const MONTH_LABELS_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
] as const

const DAY_LABELS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"] as const

function startOfUTCDay(d: Date): Date {
  const copy = new Date(d)
  copy.setUTCHours(0, 0, 0, 0)
  return copy
}

export async function getSuperAdminDashboardData(): Promise<SuperAdminDashboardData> {
  const now = new Date()
  const today = startOfUTCDay(now)

  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6)

  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const [
    totalEmployees,
    totalDepartments,
    totalPositions,
    openVacancies,
    candidatesInPipeline,
    todayAttendance,
    todayLeavesApproved,
    pendingLeaveTotal,
    pendingLeaveList,
    weeklyAttendance,
    payrollRuns,
    currentPayrollRun,
    departments,
    employeesByDept,
    recentHires,
    birthdayEmployees,
    stageGroups,
    upcomingInterviews,
  ] = await Promise.all([
    prisma.employee.count({ where: { isActive: true } }),
    prisma.department.count({ where: { deletedAt: null } }),
    prisma.position.count({ where: { deletedAt: null } }),
    prisma.vacancy.count({ where: { status: "OPEN" } }),
    prisma.candidate.count({
      where: { stage: { in: ["MELAMAR", "SELEKSI_BERKAS", "INTERVIEW", "PENAWARAN"] } },
    }),
    prisma.attendanceRecord.findMany({
      where: { date: today },
      select: { isLate: true, clockIn: true },
    }),
    prisma.leaveRequest.count({
      where: {
        status: "APPROVED",
        startDate: { lte: today },
        endDate: { gte: today },
      },
    }),
    prisma.leaveRequest.count({
      where: { status: { in: ["PENDING_MANAGER", "PENDING_HR"] } },
    }),
    prisma.leaveRequest.findMany({
      where: { status: { in: ["PENDING_MANAGER", "PENDING_HR"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        employee: { select: { namaLengkap: true } },
        leaveType: { select: { name: true } },
      },
    }),
    prisma.attendanceRecord.findMany({
      where: { date: { gte: sevenDaysAgo, lte: today } },
      select: { date: true, isLate: true },
    }),
    prisma.payrollRun.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 6,
      include: {
        entries: { select: { netPay: true } },
      },
    }),
    prisma.payrollRun.findUnique({
      where: { month_year: { month: currentMonth, year: currentYear } },
      select: { status: true, _count: { select: { entries: true } } },
    }),
    prisma.department.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
    }),
    prisma.employee.groupBy({
      by: ["departmentId"],
      where: { isActive: true },
      _count: { _all: true },
    }),
    prisma.employee.findMany({
      where: { isActive: true },
      orderBy: { joinDate: "desc" },
      take: 5,
      select: {
        id: true,
        namaLengkap: true,
        nik: true,
        joinDate: true,
        department: { select: { name: true } },
        position: { select: { name: true } },
      },
    }),
    prisma.employee.findMany({
      where: { isActive: true, tanggalLahir: { not: null } },
      select: {
        id: true,
        namaLengkap: true,
        tanggalLahir: true,
        position: { select: { name: true } },
      },
    }),
    prisma.candidate.groupBy({
      by: ["stage"],
      _count: { _all: true },
    }),
    prisma.interview.count({
      where: { scheduledAt: { gte: now } },
    }),
  ])

  const presentCount = todayAttendance.filter((a) => a.clockIn !== null).length
  const lateCount = todayAttendance.filter((a) => a.isLate).length
  const absentCount = Math.max(totalEmployees - presentCount - todayLeavesApproved, 0)

  // 7-day attendance trend
  const attendanceByDay = new Map<string, { present: number; late: number }>()
  for (const rec of weeklyAttendance) {
    const key = rec.date.toISOString().slice(0, 10)
    const bucket = attendanceByDay.get(key) ?? { present: 0, late: 0 }
    bucket.present += 1
    if (rec.isLate) bucket.late += 1
    attendanceByDay.set(key, bucket)
  }

  const attendanceTrend: SuperAdminDashboardData["attendanceTrend"] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo)
    d.setUTCDate(d.getUTCDate() + i)
    const key = d.toISOString().slice(0, 10)
    const bucket = attendanceByDay.get(key) ?? { present: 0, late: 0 }
    attendanceTrend.push({
      date: key,
      label: DAY_LABELS_ID[d.getUTCDay()],
      present: bucket.present,
      late: bucket.late,
    })
  }

  // Payroll trend (last 6 runs, oldest first for chart)
  const payrollTrend = payrollRuns
    .map((run) => {
      const total = run.entries.reduce(
        (sum, e) => sum + Number(e.netPay),
        0,
      )
      return {
        period: `${run.year}-${String(run.month).padStart(2, "0")}`,
        label: `${MONTH_LABELS_ID[run.month - 1]} ${String(run.year).slice(2)}`,
        netPay: total,
        entries: run.entries.length,
      }
    })
    .reverse()

  // Department breakdown
  const deptNameById = new Map(departments.map((d) => [d.id, d.name]))
  const departmentBreakdown = employeesByDept
    .map((row) => ({
      departmentId: row.departmentId,
      name: deptNameById.get(row.departmentId) ?? "—",
      count: row._count._all,
    }))
    .sort((a, b) => b.count - a.count)

  // Upcoming birthdays (next 30 days)
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  const upcomingBirthdays = birthdayEmployees
    .map((emp) => {
      if (!emp.tanggalLahir) return null
      const birth = emp.tanggalLahir
      const thisYearBirthday = new Date(
        Date.UTC(today.getUTCFullYear(), birth.getUTCMonth(), birth.getUTCDate()),
      )
      let next = thisYearBirthday
      if (next.getTime() < today.getTime()) {
        next = new Date(
          Date.UTC(today.getUTCFullYear() + 1, birth.getUTCMonth(), birth.getUTCDate()),
        )
      }
      const daysUntil = Math.round((next.getTime() - today.getTime()) / MS_PER_DAY)
      if (daysUntil > 30) return null
      return {
        id: emp.id,
        name: emp.namaLengkap,
        position: emp.position.name,
        birthDate: next.toISOString().slice(0, 10),
        daysUntil,
      }
    })
    .filter(
      (x): x is NonNullable<typeof x> => x !== null,
    )
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5)

  return {
    totals: {
      employees: totalEmployees,
      departments: totalDepartments,
      positions: totalPositions,
      openVacancies,
      candidatesInPipeline,
    },
    today: {
      date: today.toISOString().slice(0, 10),
      present: presentCount,
      onLeave: todayLeavesApproved,
      absent: absentCount,
      lateCount,
    },
    payrollStatus: currentPayrollRun,
    attendanceTrend,
    payrollTrend,
    departmentBreakdown,
    pendingApprovals: {
      leave: pendingLeaveList.map((lr) => ({
        id: lr.id,
        employeeName: lr.employee.namaLengkap,
        leaveTypeName: lr.leaveType.name,
        startDate: lr.startDate.toISOString().slice(0, 10),
        endDate: lr.endDate.toISOString().slice(0, 10),
        workingDays: lr.workingDays,
        createdAt: lr.createdAt.toISOString(),
      })),
      totalLeave: pendingLeaveTotal,
    },
    recentHires: recentHires.map((e) => ({
      id: e.id,
      name: e.namaLengkap,
      nik: e.nik,
      department: e.department.name,
      position: e.position.name,
      joinDate: e.joinDate.toISOString().slice(0, 10),
    })),
    upcomingBirthdays,
    recruitment: {
      openVacancies,
      stageBreakdown: stageGroups.map((g) => ({
        stage: g.stage,
        count: g._count._all,
      })),
      upcomingInterviews,
    },
  }
}

// ─── Shared helpers ─────────────────────────────────────────────────

function computeUpcomingBirthdays(
  employees: Array<{
    id: string
    namaLengkap: string
    tanggalLahir: Date | null
    position: { name: string }
  }>,
  today: Date,
  limit = 5,
): Array<{ id: string; name: string; position: string; birthDate: string; daysUntil: number }> {
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  return employees
    .map((emp) => {
      if (!emp.tanggalLahir) return null
      const birth = emp.tanggalLahir
      let next = new Date(
        Date.UTC(today.getUTCFullYear(), birth.getUTCMonth(), birth.getUTCDate()),
      )
      if (next.getTime() < today.getTime()) {
        next = new Date(
          Date.UTC(today.getUTCFullYear() + 1, birth.getUTCMonth(), birth.getUTCDate()),
        )
      }
      const daysUntil = Math.round((next.getTime() - today.getTime()) / MS_PER_DAY)
      if (daysUntil > 30) return null
      return {
        id: emp.id,
        name: emp.namaLengkap,
        position: emp.position.name,
        birthDate: next.toISOString().slice(0, 10),
        daysUntil,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, limit)
}

function buildAttendanceTrend(
  records: Array<{ date: Date; isLate: boolean }>,
  sevenDaysAgo: Date,
): Array<{ date: string; label: string; present: number; late: number }> {
  const byDay = new Map<string, { present: number; late: number }>()
  for (const rec of records) {
    const key = rec.date.toISOString().slice(0, 10)
    const bucket = byDay.get(key) ?? { present: 0, late: 0 }
    bucket.present += 1
    if (rec.isLate) bucket.late += 1
    byDay.set(key, bucket)
  }
  const trend: Array<{ date: string; label: string; present: number; late: number }> = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo)
    d.setUTCDate(d.getUTCDate() + i)
    const key = d.toISOString().slice(0, 10)
    const bucket = byDay.get(key) ?? { present: 0, late: 0 }
    trend.push({
      date: key,
      label: DAY_LABELS_ID[d.getUTCDay()],
      present: bucket.present,
      late: bucket.late,
    })
  }
  return trend
}

// ─── HR Admin dashboard ─────────────────────────────────────────────

export async function getHrAdminDashboardData(): Promise<HrAdminDashboardData> {
  const now = new Date()
  const today = startOfUTCDay(now)
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6)

  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const ninetyDaysAhead = new Date(today)
  ninetyDaysAhead.setUTCDate(ninetyDaysAhead.getUTCDate() + 90)

  const [
    totalEmployees,
    openVacancies,
    candidatesInPipeline,
    todayAttendance,
    todayLeavesApproved,
    pendingLeaveTotal,
    pendingLeaveList,
    weeklyAttendance,
    currentPayrollRun,
    departments,
    employeesByDept,
    recentHires,
    birthdayEmployees,
    stageGroups,
    upcomingInterviews,
    contractExpiring,
  ] = await Promise.all([
    prisma.employee.count({ where: { isActive: true } }),
    prisma.vacancy.count({ where: { status: "OPEN" } }),
    prisma.candidate.count({
      where: { stage: { in: ["MELAMAR", "SELEKSI_BERKAS", "INTERVIEW", "PENAWARAN"] } },
    }),
    prisma.attendanceRecord.findMany({
      where: { date: today },
      select: { isLate: true, clockIn: true, clockOut: true },
    }),
    prisma.leaveRequest.count({
      where: {
        status: "APPROVED",
        startDate: { lte: today },
        endDate: { gte: today },
      },
    }),
    // HR queue: only PENDING_HR (already passed manager stage, now needs HR action)
    prisma.leaveRequest.count({ where: { status: "PENDING_HR" } }),
    prisma.leaveRequest.findMany({
      where: { status: "PENDING_HR" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        employee: {
          select: {
            namaLengkap: true,
            department: { select: { name: true } },
          },
        },
        leaveType: { select: { name: true } },
      },
    }),
    prisma.attendanceRecord.findMany({
      where: { date: { gte: sevenDaysAgo, lte: today } },
      select: { date: true, isLate: true },
    }),
    prisma.payrollRun.findUnique({
      where: { month_year: { month: currentMonth, year: currentYear } },
      select: {
        status: true,
        _count: { select: { entries: true } },
        entries: { select: { netPay: true } },
      },
    }),
    prisma.department.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
    }),
    prisma.employee.groupBy({
      by: ["departmentId"],
      where: { isActive: true },
      _count: { _all: true },
    }),
    prisma.employee.findMany({
      where: { isActive: true },
      orderBy: { joinDate: "desc" },
      take: 5,
      select: {
        id: true,
        namaLengkap: true,
        joinDate: true,
        department: { select: { name: true } },
        position: { select: { name: true } },
      },
    }),
    prisma.employee.findMany({
      where: { isActive: true, tanggalLahir: { not: null } },
      select: {
        id: true,
        namaLengkap: true,
        tanggalLahir: true,
        position: { select: { name: true } },
      },
    }),
    prisma.candidate.groupBy({
      by: ["stage"],
      _count: { _all: true },
    }),
    prisma.interview.count({
      where: { scheduledAt: { gte: now } },
    }),
    prisma.employee.findMany({
      where: {
        isActive: true,
        contractType: "PKWT",
        // Approx: contracts nearing 1-year anniversary (common PKWT length).
        // Surfaces employees whose joinDate falls within next 90 days when shifted by a year.
      },
      select: {
        id: true,
        namaLengkap: true,
        joinDate: true,
        department: { select: { name: true } },
        position: { select: { name: true } },
      },
      take: 50,
    }),
  ])

  const presentCount = todayAttendance.filter((a) => a.clockIn !== null).length
  const lateCount = todayAttendance.filter((a) => a.isLate).length
  const checkedOutCount = todayAttendance.filter((a) => a.clockOut !== null).length
  const absentCount = Math.max(totalEmployees - presentCount - todayLeavesApproved, 0)

  const attendanceTrend = buildAttendanceTrend(weeklyAttendance, sevenDaysAgo)

  const deptNameById = new Map(departments.map((d) => [d.id, d.name]))
  const departmentBreakdown = employeesByDept
    .map((row) => ({
      departmentId: row.departmentId,
      name: deptNameById.get(row.departmentId) ?? "—",
      count: row._count._all,
    }))
    .sort((a, b) => b.count - a.count)

  const upcomingBirthdays = computeUpcomingBirthdays(birthdayEmployees, today)

  // Contract expiring within 90 days (assume PKWT = 1 year default; surface approx renewals)
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  const contractExpiringSoon = contractExpiring
    .map((e) => {
      const anniversary = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          e.joinDate.getUTCMonth(),
          e.joinDate.getUTCDate(),
        ),
      )
      let next = anniversary
      if (next.getTime() < today.getTime()) {
        next = new Date(
          Date.UTC(
            today.getUTCFullYear() + 1,
            e.joinDate.getUTCMonth(),
            e.joinDate.getUTCDate(),
          ),
        )
      }
      const daysUntil = Math.round((next.getTime() - today.getTime()) / MS_PER_DAY)
      return { e, daysUntil }
    })
    .filter(({ daysUntil }) => daysUntil <= 90 && daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5)
    .map(({ e }) => ({
      id: e.id,
      name: e.namaLengkap,
      department: e.department.name,
      position: e.position.name,
      joinDate: e.joinDate.toISOString().slice(0, 10),
    }))

  const payrollNetTotal = currentPayrollRun
    ? currentPayrollRun.entries.reduce((s, x) => s + Number(x.netPay), 0)
    : 0

  return {
    totals: {
      employees: totalEmployees,
      activeVacancies: openVacancies,
      candidatesInPipeline,
    },
    today: {
      date: today.toISOString().slice(0, 10),
      present: presentCount,
      onLeave: todayLeavesApproved,
      absent: absentCount,
      lateCount,
      checkedOut: checkedOutCount,
    },
    pendingApprovals: {
      total: pendingLeaveTotal,
      list: pendingLeaveList.map((lr) => ({
        id: lr.id,
        employeeName: lr.employee.namaLengkap,
        department: lr.employee.department.name,
        leaveTypeName: lr.leaveType.name,
        startDate: lr.startDate.toISOString().slice(0, 10),
        endDate: lr.endDate.toISOString().slice(0, 10),
        workingDays: lr.workingDays,
        createdAt: lr.createdAt.toISOString(),
      })),
    },
    payroll: {
      status: currentPayrollRun
        ? {
            status: currentPayrollRun.status,
            _count: currentPayrollRun._count,
          }
        : null,
      monthLabel: `${MONTH_LABELS_ID[currentMonth - 1]} ${currentYear}`,
      netTotal: payrollNetTotal,
      entriesCount: currentPayrollRun?._count.entries ?? 0,
    },
    attendanceTrend,
    departmentBreakdown,
    recentHires: recentHires.map((e) => ({
      id: e.id,
      name: e.namaLengkap,
      department: e.department.name,
      position: e.position.name,
      joinDate: e.joinDate.toISOString().slice(0, 10),
    })),
    upcomingBirthdays,
    contractExpiring: contractExpiringSoon,
    recruitment: {
      openVacancies,
      stageBreakdown: stageGroups.map((g) => ({
        stage: g.stage,
        count: g._count._all,
      })),
      upcomingInterviews,
    },
  }
}

// ─── Manager dashboard ──────────────────────────────────────────────

export async function getManagerDashboardData(
  userId: string,
): Promise<ManagerDashboardData> {
  const now = new Date()
  const today = startOfUTCDay(now)
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6)

  // Scope to manager's department
  const managerEmployee = await prisma.employee.findUnique({
    where: { userId },
    select: { departmentId: true, department: { select: { id: true, name: true } } },
  })

  const departmentId = managerEmployee?.departmentId ?? null
  const departmentName = managerEmployee?.department.name ?? "—"

  const teamWhere = departmentId
    ? { isActive: true, departmentId }
    : { isActive: true, id: "__NONE__" }

  const [
    totalMembers,
    teamMembers,
    todayAttendance,
    todayLeavesApproved,
    pendingLeaveTotal,
    pendingLeaveList,
    teamOnLeaveNow,
    weeklyAttendance,
    positions,
    membersByPos,
    birthdayEmployees,
  ] = await Promise.all([
    prisma.employee.count({ where: teamWhere }),
    prisma.employee.findMany({
      where: teamWhere,
      select: {
        id: true,
        namaLengkap: true,
        joinDate: true,
        position: { select: { name: true } },
      },
      orderBy: { namaLengkap: "asc" },
    }),
    prisma.attendanceRecord.findMany({
      where: { date: today, employee: teamWhere },
      select: { employeeId: true, isLate: true, clockIn: true },
    }),
    prisma.leaveRequest.count({
      where: {
        status: "APPROVED",
        employee: teamWhere,
        startDate: { lte: today },
        endDate: { gte: today },
      },
    }),
    // Manager queue: only PENDING_MANAGER from their team (stage 1 awaiting manager)
    prisma.leaveRequest.count({
      where: { status: "PENDING_MANAGER", employee: teamWhere },
    }),
    prisma.leaveRequest.findMany({
      where: { status: "PENDING_MANAGER", employee: teamWhere },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        employee: { select: { namaLengkap: true } },
        leaveType: { select: { name: true } },
      },
    }),
    prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        employee: teamWhere,
        startDate: { lte: today },
        endDate: { gte: today },
      },
      orderBy: { startDate: "asc" },
      take: 10,
      include: {
        employee: { select: { id: true, namaLengkap: true } },
        leaveType: { select: { name: true } },
      },
    }),
    prisma.attendanceRecord.findMany({
      where: { date: { gte: sevenDaysAgo, lte: today }, employee: teamWhere },
      select: { date: true, isLate: true },
    }),
    prisma.position.findMany({
      where: { deletedAt: null, departmentId: departmentId ?? undefined },
      select: { id: true, name: true },
    }),
    prisma.employee.groupBy({
      by: ["positionId"],
      where: teamWhere,
      _count: { _all: true },
    }),
    prisma.employee.findMany({
      where: { ...teamWhere, tanggalLahir: { not: null } },
      select: {
        id: true,
        namaLengkap: true,
        tanggalLahir: true,
        position: { select: { name: true } },
      },
    }),
  ])

  const attendanceByEmployee = new Map(
    todayAttendance.map((a) => [a.employeeId, a]),
  )
  const onLeaveEmployeeIds = new Set(teamOnLeaveNow.map((l) => l.employee.id))

  const presentCount = todayAttendance.filter((a) => a.clockIn !== null).length
  const lateCount = todayAttendance.filter((a) => a.isLate).length
  const absentCount = Math.max(totalMembers - presentCount - todayLeavesApproved, 0)

  const attendanceTrend = buildAttendanceTrend(weeklyAttendance, sevenDaysAgo)

  const posNameById = new Map(positions.map((p) => [p.id, p.name]))
  const positionBreakdown = membersByPos
    .map((row) => ({
      positionId: row.positionId,
      name: posNameById.get(row.positionId) ?? "—",
      count: row._count._all,
    }))
    .sort((a, b) => b.count - a.count)

  const upcomingBirthdays = computeUpcomingBirthdays(birthdayEmployees, today)

  const teamRoster = teamMembers.map((m) => {
    const rec = attendanceByEmployee.get(m.id)
    return {
      id: m.id,
      name: m.namaLengkap,
      position: m.position.name,
      joinDate: m.joinDate.toISOString().slice(0, 10),
      isPresent: !!rec?.clockIn,
      isLate: !!rec?.isLate,
      isOnLeave: onLeaveEmployeeIds.has(m.id),
    }
  })

  return {
    department: {
      id: departmentId,
      name: departmentName,
      totalMembers,
    },
    today: {
      date: today.toISOString().slice(0, 10),
      present: presentCount,
      onLeave: todayLeavesApproved,
      absent: absentCount,
      lateCount,
    },
    pendingApprovals: {
      total: pendingLeaveTotal,
      list: pendingLeaveList.map((lr) => ({
        id: lr.id,
        employeeName: lr.employee.namaLengkap,
        leaveTypeName: lr.leaveType.name,
        startDate: lr.startDate.toISOString().slice(0, 10),
        endDate: lr.endDate.toISOString().slice(0, 10),
        workingDays: lr.workingDays,
        createdAt: lr.createdAt.toISOString(),
      })),
    },
    teamOnLeave: teamOnLeaveNow.map((l) => ({
      id: l.id,
      employeeName: l.employee.namaLengkap,
      leaveTypeName: l.leaveType.name,
      startDate: l.startDate.toISOString().slice(0, 10),
      endDate: l.endDate.toISOString().slice(0, 10),
    })),
    teamRoster,
    attendanceTrend,
    positionBreakdown,
    upcomingBirthdays,
  }
}

// ─── Employee dashboard ─────────────────────────────────────────────

export async function getEmployeeDashboardData(
  userId: string,
): Promise<EmployeeDashboardData> {
  const now = new Date()
  const today = startOfUTCDay(now)
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6)

  const sevenDaysAhead = new Date(today)
  sevenDaysAhead.setUTCDate(sevenDaysAhead.getUTCDate() + 7)

  const currentYear = now.getFullYear()

  // Resolve the employee record for this user
  const emp = await prisma.employee.findFirst({
    where: { userId, isActive: true },
    select: {
      id: true,
      namaLengkap: true,
      departmentId: true,
      joinDate: true,
      department: { select: { name: true } },
      position: { select: { name: true } },
      officeLocation: {
        select: { workStartTime: true, workEndTime: true },
      },
    },
  })

  if (!emp) {
    return {
      employee: null,
      todayAttendance: {
        date: today.toISOString().slice(0, 10),
        clockedIn: false,
        clockedOut: false,
        clockIn: null,
        clockOut: null,
        isLate: false,
        lateMinutes: 0,
        totalMinutes: 0,
        workStartTime: null,
        workEndTime: null,
      },
      monthlyStats: {
        monthLabel: MONTH_LABELS_ID[now.getMonth()],
        presentDays: 0,
        lateDays: 0,
        absentDays: 0,
        workingDaysSoFar: 0,
        overtimeMinutes: 0,
      },
      attendanceTrend: [],
      leaveBalances: [],
      upcomingLeave: null,
      pendingLeaveCount: 0,
      latestPayslip: null,
      coworkerBirthdays: [],
      teamOnLeave: [],
    }
  }

  const firstOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

  const [
    todayAttendance,
    weeklyAttendance,
    monthlyAttendance,
    leaveBalances,
    upcomingLeaveRaw,
    pendingLeaveCount,
    latestPayrollEntry,
    teamOnLeaveNow,
    coworkerBirthdayEmployees,
  ] = await Promise.all([
    prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId: emp.id, date: today } },
      select: {
        clockIn: true,
        clockOut: true,
        isLate: true,
        lateMinutes: true,
        totalMinutes: true,
      },
    }),
    prisma.attendanceRecord.findMany({
      where: {
        employeeId: emp.id,
        date: { gte: sevenDaysAgo, lte: today },
      },
      select: { date: true, isLate: true, clockIn: true, totalMinutes: true },
    }),
    prisma.attendanceRecord.findMany({
      where: {
        employeeId: emp.id,
        date: { gte: firstOfMonth, lte: today },
      },
      select: { isLate: true, clockIn: true, overtimeMinutes: true },
    }),
    prisma.leaveBalance.findMany({
      where: { employeeId: emp.id, year: currentYear },
      include: { leaveType: { select: { name: true } } },
    }),
    prisma.leaveRequest.findFirst({
      where: {
        employeeId: emp.id,
        status: "APPROVED",
        startDate: { gte: today, lte: sevenDaysAhead },
      },
      orderBy: { startDate: "asc" },
      include: { leaveType: { select: { name: true } } },
    }),
    // Employee's own pending count: still in either approval stage
    prisma.leaveRequest.count({
      where: {
        employeeId: emp.id,
        status: { in: ["PENDING_MANAGER", "PENDING_HR"] },
      },
    }),
    prisma.payrollEntry.findFirst({
      where: { employeeId: emp.id },
      orderBy: [
        { payrollRun: { year: "desc" } },
        { payrollRun: { month: "desc" } },
      ],
      include: {
        payrollRun: { select: { id: true, month: true, year: true, status: true } },
      },
    }),
    prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: today },
        endDate: { gte: today },
        employeeId: { not: emp.id },
        employee: { isActive: true, departmentId: emp.departmentId },
      },
      orderBy: { startDate: "asc" },
      take: 5,
      include: {
        employee: { select: { id: true, namaLengkap: true } },
        leaveType: { select: { name: true } },
      },
    }),
    prisma.employee.findMany({
      where: {
        isActive: true,
        departmentId: emp.departmentId,
        tanggalLahir: { not: null },
        id: { not: emp.id },
      },
      select: {
        id: true,
        namaLengkap: true,
        tanggalLahir: true,
        position: { select: { name: true } },
      },
    }),
  ])

  // Build attendance trend
  const attByDay = new Map(
    weeklyAttendance.map((r) => [r.date.toISOString().slice(0, 10), r]),
  )
  const attendanceTrend: EmployeeDashboardData["attendanceTrend"] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo)
    d.setUTCDate(d.getUTCDate() + i)
    const key = d.toISOString().slice(0, 10)
    const rec = attByDay.get(key)
    attendanceTrend.push({
      date: key,
      label: DAY_LABELS_ID[d.getUTCDay()],
      clockedIn: !!rec?.clockIn,
      isLate: !!rec?.isLate,
      totalMinutes: rec?.totalMinutes ?? 0,
    })
  }

  // Tenure
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  const tenureDays = Math.floor(
    (today.getTime() - startOfUTCDay(emp.joinDate).getTime()) / MS_PER_DAY,
  )
  const tenureMonths = Math.max(0, Math.floor(tenureDays / 30))

  // Monthly stats
  const workingDaysSoFar = monthlyAttendance.length
  const presentDays = monthlyAttendance.filter((r) => r.clockIn).length
  const lateDays = monthlyAttendance.filter((r) => r.isLate).length
  const overtimeMinutes = monthlyAttendance.reduce(
    (s, r) => s + (r.overtimeMinutes ?? 0),
    0,
  )
  const absentDays = Math.max(0, workingDaysSoFar - presentDays)

  const coworkerBirthdays = computeUpcomingBirthdays(
    coworkerBirthdayEmployees,
    today,
    3,
  )

  return {
    employee: {
      id: emp.id,
      name: emp.namaLengkap,
      position: emp.position.name,
      department: emp.department.name,
      joinDate: emp.joinDate.toISOString().slice(0, 10),
      tenureMonths,
    },
    todayAttendance: {
      date: today.toISOString().slice(0, 10),
      clockedIn: !!todayAttendance?.clockIn,
      clockedOut: !!todayAttendance?.clockOut,
      clockIn: todayAttendance?.clockIn?.toISOString() ?? null,
      clockOut: todayAttendance?.clockOut?.toISOString() ?? null,
      isLate: todayAttendance?.isLate ?? false,
      lateMinutes: todayAttendance?.lateMinutes ?? 0,
      totalMinutes: todayAttendance?.totalMinutes ?? 0,
      workStartTime: emp.officeLocation?.workStartTime ?? null,
      workEndTime: emp.officeLocation?.workEndTime ?? null,
    },
    monthlyStats: {
      monthLabel: `${MONTH_LABELS_ID[now.getMonth()]} ${currentYear}`,
      presentDays,
      lateDays,
      absentDays,
      workingDaysSoFar,
      overtimeMinutes,
    },
    attendanceTrend,
    leaveBalances: leaveBalances.map((lb) => ({
      leaveTypeId: lb.leaveTypeId,
      leaveTypeName: lb.leaveType.name,
      allocated: lb.allocatedDays,
      used: lb.usedDays,
      remaining: Math.max(0, lb.allocatedDays - lb.usedDays),
    })),
    upcomingLeave: upcomingLeaveRaw
      ? {
          leaveTypeName: upcomingLeaveRaw.leaveType.name,
          startDate: upcomingLeaveRaw.startDate.toISOString().slice(0, 10),
          endDate: upcomingLeaveRaw.endDate.toISOString().slice(0, 10),
          workingDays: upcomingLeaveRaw.workingDays,
        }
      : null,
    pendingLeaveCount,
    latestPayslip: latestPayrollEntry
      ? {
          runId: latestPayrollEntry.payrollRun.id,
          month: latestPayrollEntry.payrollRun.month,
          year: latestPayrollEntry.payrollRun.year,
          monthLabel: `${MONTH_LABELS_ID[latestPayrollEntry.payrollRun.month - 1]} ${latestPayrollEntry.payrollRun.year}`,
          netPay: Number(latestPayrollEntry.netPay),
          status: latestPayrollEntry.payrollRun.status,
        }
      : null,
    coworkerBirthdays,
    teamOnLeave: teamOnLeaveNow.map((l) => ({
      id: l.id,
      employeeName: l.employee.namaLengkap,
      leaveTypeName: l.leaveType.name,
      startDate: l.startDate.toISOString().slice(0, 10),
      endDate: l.endDate.toISOString().slice(0, 10),
    })),
  }
}
