import Link from "next/link"
import { Calendar, Clock, FileText, ArrowRight, CalendarCheck } from "lucide-react"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { DashboardData } from "@/lib/services/dashboard.service"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

interface UpcomingLeave {
  leaveTypeName: string
  startDate: string
  endDate: string
  workingDays: number
}

interface EmployeeDashboardProps {
  data: DashboardData
  upcomingLeave?: UpcomingLeave | null
}

export function EmployeeDashboard({ data, upcomingLeave }: EmployeeDashboardProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Absensi"
          value="Catat Absensi"
          description="Absen masuk / pulang"
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

      {upcomingLeave ? (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
              Cuti Mendatang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                {upcomingLeave.leaveTypeName}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {format(new Date(upcomingLeave.startDate), "d MMMM yyyy", { locale: localeId })}
                {upcomingLeave.startDate !== upcomingLeave.endDate && (
                  <> — {format(new Date(upcomingLeave.endDate), "d MMMM yyyy", { locale: localeId })}</>
                )}
              </span>
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                ({upcomingLeave.workingDays} hari kerja)
              </span>
            </div>
            <Link
              href="/leave"
              className="mt-3 inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              Lihat Riwayat Cuti
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cuti Mendatang</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tidak ada cuti yang disetujui dalam 7 hari ke depan.
            </p>
            <Link
              href="/leave"
              className="mt-3 inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              Ajukan Cuti
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      )}

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
