import { Briefcase, Clock, DollarSign, Users } from "lucide-react"
import { StatCard } from "@/components/shared/stat-card"
import type { DashboardData } from "@/lib/services/dashboard.service"

interface HRAdminDashboardProps {
  data: DashboardData
}

export function HRAdminDashboard({ data }: HRAdminDashboardProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Karyawan"
        value={data.totalUsers}
        description="Karyawan aktif"
        icon={Users}
      />
      <StatCard
        title="Pengajuan Cuti Menunggu"
        value={data.pendingLeaveRequests}
        description="Menunggu persetujuan"
        icon={Clock}
      />
      <StatCard
        title="Lowongan Terbuka"
        value={data.openVacancies}
        description="Posisi yang tersedia"
        icon={Briefcase}
      />
      <StatCard
        title="Status Penggajian"
        value={data.payrollStatus}
        description="Periode berjalan"
        icon={DollarSign}
      />
    </div>
  )
}
