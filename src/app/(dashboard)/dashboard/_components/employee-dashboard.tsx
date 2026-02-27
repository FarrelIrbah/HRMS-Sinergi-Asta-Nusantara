import { Calendar, Clock, FileText } from "lucide-react"
import { StatCard } from "@/components/shared/stat-card"
import type { DashboardData } from "@/lib/services/dashboard.service"

interface EmployeeDashboardProps {
  data: DashboardData
}

export function EmployeeDashboard({ data }: EmployeeDashboardProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="Status Kehadiran Hari Ini"
        value="Belum Absen"
        description="Modul absensi belum aktif"
        icon={Clock}
      />
      <StatCard
        title="Sisa Cuti Tahunan"
        value={data.leaveBalance}
        description="Hari tersisa tahun ini"
        icon={Calendar}
      />
      <StatCard
        title="Slip Gaji Terakhir"
        value="Belum tersedia"
        description="Modul penggajian belum aktif"
        icon={FileText}
      />
    </div>
  )
}
