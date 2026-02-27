import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getDashboardData } from "@/lib/services/dashboard.service"
import { SuperAdminDashboard } from "./_components/super-admin-dashboard"
import { HRAdminDashboard } from "./_components/hr-admin-dashboard"
import { ManagerDashboard } from "./_components/manager-dashboard"
import { EmployeeDashboard } from "./_components/employee-dashboard"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const data = await getDashboardData()
  const role = session.user.role
  const name = session.user.name ?? "Pengguna"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang, {name}</p>
      </div>

      {role === "SUPER_ADMIN" && <SuperAdminDashboard data={data} />}
      {role === "HR_ADMIN" && <HRAdminDashboard data={data} />}
      {role === "MANAGER" && <ManagerDashboard data={data} />}
      {role === "EMPLOYEE" && <EmployeeDashboard data={data} />}
    </div>
  )
}
