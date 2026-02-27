import { Calendar, UserCheck } from "lucide-react"
import { StatCard } from "@/components/shared/stat-card"
import type { DashboardData } from "@/lib/services/dashboard.service"

interface ManagerDashboardProps {
  data: DashboardData
}

export function ManagerDashboard({ data }: ManagerDashboardProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          title="Kehadiran Tim Hari Ini"
          value={data.todayAttendance}
          description="Anggota tim yang hadir"
          icon={UserCheck}
        />
        <StatCard
          title="Pengajuan Cuti Menunggu"
          value={data.pendingLeaveRequests}
          description="Menunggu persetujuan Anda"
          icon={Calendar}
        />
      </div>

      <div className="rounded-lg border bg-muted/40 p-6">
        <p className="text-sm text-muted-foreground">
          Data kehadiran tim akan tersedia setelah modul absensi aktif.
        </p>
      </div>
    </div>
  )
}
