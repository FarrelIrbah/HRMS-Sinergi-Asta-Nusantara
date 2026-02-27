import { prisma } from "@/lib/prisma"

export interface DashboardData {
  totalUsers: number
  totalDepartments: number
  totalPositions: number
  pendingLeaveRequests: number
  openVacancies: number
  payrollStatus: string
  todayAttendance: number
  leaveBalance: number
}

/**
 * Returns dashboard data for the given role.
 * Phase 1: Returns real counts for organizational data (users, departments, positions).
 * Attendance, leave, payroll, and vacancy data are placeholders (Phase 3-5).
 */
export async function getDashboardData(): Promise<DashboardData> {
  const [totalUsers, totalDepartments, totalPositions] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.department.count({ where: { deletedAt: null } }),
    prisma.position.count({ where: { deletedAt: null } }),
  ])

  return {
    totalUsers,
    totalDepartments,
    totalPositions,
    pendingLeaveRequests: 0, // Phase 3: Leave management
    openVacancies: 0, // Phase 5: Recruitment
    payrollStatus: "Belum diproses", // Phase 4: Payroll
    todayAttendance: 0, // Phase 3: Attendance
    leaveBalance: 0, // Phase 3: Leave balance
  }
}
