import { prisma } from "@/lib/prisma"

export interface DashboardData {
  totalUsers: number
  totalDepartments: number
  totalPositions: number
  totalEmployees: number
  pendingLeaveRequests: number
  pendingLeaveCount: number
  todayAttendanceCount: number
  openVacancies: number
  payrollStatus: string
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
 * Attendance, leave, payroll, and vacancy data are placeholders for other phases.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const sevenDaysLater = new Date(today)
  sevenDaysLater.setUTCDate(sevenDaysLater.getUTCDate() + 7)

  const [
    totalUsers,
    totalDepartments,
    totalPositions,
    totalEmployees,
    pendingLeaveCount,
    todayAttendanceCount,
  ] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.department.count({ where: { deletedAt: null } }),
    prisma.position.count({ where: { deletedAt: null } }),
    prisma.employee.count({ where: { isActive: true } }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    prisma.attendanceRecord.count({ where: { date: today } }),
  ])

  return {
    totalUsers,
    totalDepartments,
    totalPositions,
    totalEmployees,
    pendingLeaveRequests: pendingLeaveCount, // kept for backward compat with super-admin-dashboard
    pendingLeaveCount,
    todayAttendanceCount,
    openVacancies: 0, // Phase 5: Recruitment
    payrollStatus: "Belum diproses", // Phase 4: Payroll
    todayAttendance: todayAttendanceCount, // kept for backward compat
    leaveBalance: 0, // Phase 3: resolved per-employee in leave page
    upcomingLeave: null, // Phase 3: resolved per-employee in dashboard page
  }
}
