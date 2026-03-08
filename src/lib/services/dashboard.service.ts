import { prisma } from "@/lib/prisma"

export interface PayrollStatusData {
  status: string
  _count: {
    entries: number
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
