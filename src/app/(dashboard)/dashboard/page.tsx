import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import {
  getDashboardData,
  getSuperAdminDashboardData,
} from "@/lib/services/dashboard.service"
import { prisma } from "@/lib/prisma"
import { SuperAdminDashboard } from "./_components/super-admin-dashboard"
import { HRAdminDashboard } from "./_components/hr-admin-dashboard"
import { ManagerDashboard } from "./_components/manager-dashboard"
import { EmployeeDashboard } from "./_components/employee-dashboard"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const role = session.user.role
  const name = session.user.name ?? "Pengguna"

  if (role === "SUPER_ADMIN") {
    const superAdminData = await getSuperAdminDashboardData()
    return <SuperAdminDashboard data={superAdminData} name={name} />
  }

  const data = await getDashboardData()

  let upcomingLeave: {
    leaveTypeName: string
    startDate: string
    endDate: string
    workingDays: number
  } | null = null

  if (role === "EMPLOYEE" && session.user.id) {
    const employee = await prisma.employee.findFirst({
      where: { userId: session.user.id, isActive: true },
      select: { id: true },
    })

    if (employee) {
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      const sevenDaysLater = new Date(today)
      sevenDaysLater.setUTCDate(sevenDaysLater.getUTCDate() + 7)

      const upcoming = await prisma.leaveRequest.findFirst({
        where: {
          employeeId: employee.id,
          status: "APPROVED",
          startDate: {
            gte: today,
            lte: sevenDaysLater,
          },
        },
        include: {
          leaveType: { select: { name: true } },
        },
        orderBy: { startDate: "asc" },
      })

      if (upcoming) {
        upcomingLeave = {
          leaveTypeName: upcoming.leaveType.name,
          startDate: upcoming.startDate.toISOString().split("T")[0],
          endDate: upcoming.endDate.toISOString().split("T")[0],
          workingDays: upcoming.workingDays,
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang, {name}</p>
      </div>

      {role === "HR_ADMIN" && <HRAdminDashboard data={data} />}
      {role === "MANAGER" && <ManagerDashboard data={data} />}
      {role === "EMPLOYEE" && <EmployeeDashboard data={data} upcomingLeave={upcomingLeave} />}
    </div>
  )
}
