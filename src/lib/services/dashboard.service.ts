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
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
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
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    prisma.leaveRequest.findMany({
      where: { status: "PENDING" },
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
