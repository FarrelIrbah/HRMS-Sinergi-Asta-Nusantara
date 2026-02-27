import { Award, Briefcase, Building2, Clock, DollarSign, Users } from "lucide-react"
import { StatCard } from "@/components/shared/stat-card"
import type { DashboardData } from "@/lib/services/dashboard.service"

interface SuperAdminDashboardProps {
  data: DashboardData
}

export function SuperAdminDashboard({ data }: SuperAdminDashboardProps) {
  return (
    <div className="space-y-4">
      {/* Shared HR metrics */}
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

      {/* Super Admin organizational metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Departemen"
          value={data.totalDepartments}
          description="Departemen aktif"
          icon={Building2}
        />
        <StatCard
          title="Total Jabatan"
          value={data.totalPositions}
          description="Jabatan aktif"
          icon={Award}
        />
      </div>
    </div>
  )
}
