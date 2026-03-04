import Link from "next/link"
import { Calendar, Clock, FileText, ArrowRight } from "lucide-react"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardData } from "@/lib/services/dashboard.service"

interface EmployeeDashboardProps {
  data: DashboardData
}

export function EmployeeDashboard({ data }: EmployeeDashboardProps) {
  return (
    <div className="space-y-4">
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Profil Saya</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Lihat data pribadi, dokumen, dan informasi kepegawaian Anda.
          </p>
          <Link
            href="/employees"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            Lihat Profil
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
