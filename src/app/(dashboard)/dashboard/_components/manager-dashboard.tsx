import Link from "next/link"
import { Calendar, UserCheck, ArrowRight, ClipboardList } from "lucide-react"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardData } from "@/lib/services/dashboard.service"

interface ManagerDashboardProps {
  data: DashboardData
}

export function ManagerDashboard({ data }: ManagerDashboardProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Absen Hari Ini"
          value={data.todayAttendanceCount}
          description="Absensi tercatat hari ini"
          icon={UserCheck}
        />
        <StatCard
          title="Cuti Menunggu"
          value={data.pendingLeaveCount}
          description="Menunggu persetujuan"
          icon={Calendar}
        />
        <StatCard
          title="Rekap Absensi"
          value="Lihat Detail"
          description="Data absensi tim"
          icon={ClipboardList}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Kelola Cuti Tim</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              Tinjau dan setujui pengajuan cuti anggota tim.
            </p>
            <Link
              href="/leave/manage"
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              Lihat Pengajuan Cuti
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

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
      </div>
    </div>
  )
}
