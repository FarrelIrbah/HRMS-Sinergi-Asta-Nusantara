import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import {
  getEmployeeDashboardData,
  getHrAdminDashboardData,
  getManagerDashboardData,
  getSuperAdminDashboardData,
} from "@/lib/services/dashboard.service"
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
  const userId = session.user.id

  if (role === "SUPER_ADMIN") {
    const superAdminData = await getSuperAdminDashboardData()
    return <SuperAdminDashboard data={superAdminData} name={name} />
  }

  if (role === "HR_ADMIN") {
    const data = await getHrAdminDashboardData()
    return <HRAdminDashboard data={data} name={name} />
  }

  if (role === "MANAGER") {
    const data = await getManagerDashboardData(userId)
    return <ManagerDashboard data={data} name={name} />
  }

  if (role === "EMPLOYEE") {
    const data = await getEmployeeDashboardData(userId)
    return <EmployeeDashboard data={data} name={name} />
  }

  return null
}
