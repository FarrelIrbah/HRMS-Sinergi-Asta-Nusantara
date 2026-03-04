import Link from "next/link"
import { Calendar, UserCheck, ArrowRight } from "lucide-react"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Karyawan Departemen</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Lihat data karyawan di departemen Anda.
          </p>
          <Link
            href="/employees"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            Lihat Karyawan Departemen
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-muted/40 p-6">
        <p className="text-sm text-muted-foreground">
          Data kehadiran tim akan tersedia setelah modul absensi aktif.
        </p>
      </div>
    </div>
  )
}
