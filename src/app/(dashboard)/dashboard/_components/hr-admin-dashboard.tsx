import Link from "next/link"
import { Briefcase, Clock, DollarSign, Users, ArrowRight } from "lucide-react"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardData } from "@/lib/services/dashboard.service"

interface HRAdminDashboardProps {
  data: DashboardData
}

export function HRAdminDashboard({ data }: HRAdminDashboardProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Karyawan"
          value={data.totalEmployees}
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Manajemen Karyawan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Kelola data karyawan, dokumen, dan informasi kepegawaian.
          </p>
          <Link
            href="/employees"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            Lihat Semua Karyawan
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
