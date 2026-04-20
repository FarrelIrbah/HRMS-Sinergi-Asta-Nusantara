"use client"

import Link from "next/link"
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import {
  ArrowRight,
  Banknote,
  Briefcase,
  Building2,
  CakeSlice,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  Clock,
  FileWarning,
  UserPlus,
  UserRound,
  Users2,
  type LucideIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { HrAdminDashboardData } from "@/lib/services/dashboard.service"
import { cn } from "@/lib/utils"

const rupiahCompact = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  notation: "compact",
  maximumFractionDigits: 1,
})

const rupiahFull = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
})

const dateLongID = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
})

const dateShortID = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

const dateMonthDayID = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
})

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function relativeFromNow(iso: string): string {
  const diffMs = Math.max(0, Date.now() - new Date(iso).getTime())
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return "baru saja"
  if (mins < 60) return `${mins} menit lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} hari lalu`
  const weeks = Math.floor(days / 7)
  return `${weeks} minggu lalu`
}

function daysUntilLabel(d: number): string {
  if (d === 0) return "Hari ini"
  if (d === 1) return "Besok"
  return `${d} hari lagi`
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 11) return "Selamat pagi"
  if (h < 15) return "Selamat siang"
  if (h < 18) return "Selamat sore"
  return "Selamat malam"
}

const STAGE_LABELS: Record<string, string> = {
  MELAMAR: "Melamar",
  SELEKSI_BERKAS: "Seleksi Berkas",
  INTERVIEW: "Interview",
  PENAWARAN: "Penawaran",
  DITERIMA: "Diterima",
  DITOLAK: "Ditolak",
}

const DONUT_PALETTE = [
  "#10b981",
  "#34d399",
  "#6ee7b7",
  "#0f766e",
  "#14b8a6",
  "#0891b2",
  "#64748b",
  "#94a3b8",
]

interface HRAdminDashboardProps {
  data: HrAdminDashboardData
  name: string
}

export function HRAdminDashboard({ data, name }: HRAdminDashboardProps) {
  const today = new Date(data.today.date + "T00:00:00Z")
  const greeting = getGreeting()
  const attendancePct =
    data.totals.employees > 0
      ? Math.round(
          ((data.today.present + data.today.onLeave) / data.totals.employees) *
            100,
        )
      : 0

  const payrollStatusLabel = data.payroll.status
    ? data.payroll.status.status === "FINALIZED"
      ? "Difinalisasi"
      : "Draft"
    : "Belum Diproses"

  return (
    <div
      className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
      aria-label="Dashboard HR Admin"
    >
      <section
        aria-labelledby="greeting-heading"
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-sm font-medium text-emerald-700">{greeting}</p>
          <h1
            id="greeting-heading"
            className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"
          >
            Halo, {name} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {dateLongID.format(today)} · Kendali operasional SDM harian.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/leave/manage"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-2 bg-white",
            )}
          >
            <CalendarCheck2 className="h-4 w-4" aria-hidden="true" />
            Kelola Cuti
            {data.pendingApprovals.total > 0 ? (
              <Badge className="ml-1 h-5 min-w-5 bg-amber-100 px-1.5 text-[11px] text-amber-800 hover:bg-amber-100">
                {data.pendingApprovals.total}
              </Badge>
            ) : null}
          </Link>
          <Link
            href="/payroll"
            className={cn(
              buttonVariants({ size: "sm" }),
              "gap-2 bg-emerald-600 text-white hover:bg-emerald-700",
            )}
          >
            <Banknote className="h-4 w-4" aria-hidden="true" />
            Penggajian
          </Link>
        </div>
      </section>

      <section
        aria-label="Statistik utama"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatTile
          icon={Users2}
          label="Total Karyawan"
          value={data.totals.employees}
          caption={`${attendancePct}% hadir atau cuti hari ini`}
          tint="bg-emerald-50 text-emerald-700"
          href="/employees"
        />
        <StatTile
          icon={UserRound}
          label="Hadir Hari Ini"
          value={data.today.present}
          caption={
            data.today.lateCount > 0
              ? `${data.today.lateCount} terlambat · ${data.today.checkedOut} sudah pulang`
              : `${data.today.checkedOut} sudah pulang`
          }
          tint="bg-sky-50 text-sky-700"
          href="/attendance-admin"
        />
        <StatTile
          icon={CalendarDays}
          label="Sedang Cuti"
          value={data.today.onLeave}
          caption={`${data.pendingApprovals.total} menunggu approval`}
          tint="bg-amber-50 text-amber-700"
          href="/leave/manage"
        />
        <StatTile
          icon={Briefcase}
          label="Rekrutmen Aktif"
          value={data.totals.activeVacancies}
          caption={`${data.totals.candidatesInPipeline} kandidat dalam pipeline`}
          tint="bg-violet-50 text-violet-700"
          href="/recruitment"
        />
      </section>

      <section
        aria-label="Tren kehadiran & penggajian"
        className="grid grid-cols-1 gap-4 lg:grid-cols-12"
      >
        <AttendanceTrendCard trend={data.attendanceTrend} />
        <PayrollStatusCard
          statusLabel={payrollStatusLabel}
          monthLabel={data.payroll.monthLabel}
          netTotal={data.payroll.netTotal}
          entriesCount={data.payroll.entriesCount}
          totalEmployees={data.totals.employees}
        />
      </section>

      <section
        aria-label="Distribusi & rekrutmen"
        className="grid grid-cols-1 gap-4 lg:grid-cols-12"
      >
        <DepartmentDonutCard
          departments={data.departmentBreakdown}
          total={data.totals.employees}
        />
        <RecruitmentCard
          stages={data.recruitment.stageBreakdown}
          openVacancies={data.recruitment.openVacancies}
          upcomingInterviews={data.recruitment.upcomingInterviews}
        />
      </section>

      <section
        aria-label="Aktivitas & approval"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <PendingApprovalsCard data={data.pendingApprovals} />
        <RecentHiresCard hires={data.recentHires} />
        <BirthdaysCard birthdays={data.upcomingBirthdays} />
      </section>

      {data.contractExpiring.length > 0 ? (
        <section aria-label="Kontrak akan berakhir">
          <ContractExpiringCard items={data.contractExpiring} />
        </section>
      ) : null}
    </div>
  )
}

// ─── Stat tile ──────────────────────────────────────────

interface StatTileProps {
  icon: LucideIcon
  label: string
  value: number | string
  caption: string
  tint: string
  href?: string
}

function StatTile({ icon: Icon, label, value, caption, tint, href }: StatTileProps) {
  const body = (
    <Card className="group h-full border-slate-200/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex items-start gap-4 p-5">
        <div
          className={cn(
            "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl",
            tint,
          )}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1 truncate text-xs text-slate-500">{caption}</p>
        </div>
        {href ? (
          <ArrowRight
            className="h-4 w-4 flex-shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
            aria-hidden="true"
          />
        ) : null}
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        aria-label={`${label}: ${value}`}
      >
        {body}
      </Link>
    )
  }
  return body
}

// ─── Attendance trend ───────────────────────────────────

const attendanceConfig = {
  present: { label: "Hadir", color: "#10b981" },
  late: { label: "Terlambat", color: "#f59e0b" },
} satisfies ChartConfig

function AttendanceTrendCard({
  trend,
}: {
  trend: HrAdminDashboardData["attendanceTrend"]
}) {
  const totalPresent = trend.reduce((s, d) => s + d.present, 0)
  const totalLate = trend.reduce((s, d) => s + d.late, 0)

  return (
    <Card className="border-slate-200/80 shadow-sm lg:col-span-7">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">
            Tren Kehadiran 7 Hari
          </CardTitle>
          <CardDescription className="text-xs">
            {totalPresent} total kehadiran · {totalLate} terlambat
          </CardDescription>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <LegendDot color="#10b981" label="Hadir" />
          <LegendDot color="#f59e0b" label="Terlambat" />
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={attendanceConfig} className="h-[240px] w-full">
          <AreaChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="hr-att-present" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="hr-att-late" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#64748b" }}
              tickMargin={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#64748b" }}
              width={32}
              allowDecimals={false}
            />
            <ChartTooltip
              cursor={{ stroke: "#cbd5e1", strokeDasharray: "4 4" }}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              type="monotone"
              dataKey="present"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#hr-att-present)"
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="late"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#hr-att-late)"
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  )
}

// ─── Payroll card ────────────────────────────────────────

function PayrollStatusCard({
  statusLabel,
  monthLabel,
  netTotal,
  entriesCount,
  totalEmployees,
}: {
  statusLabel: string
  monthLabel: string
  netTotal: number
  entriesCount: number
  totalEmployees: number
}) {
  const coverage =
    totalEmployees > 0 ? Math.round((entriesCount / totalEmployees) * 100) : 0

  const tone =
    statusLabel === "Difinalisasi"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : statusLabel === "Draft"
      ? "bg-amber-50 text-amber-700 ring-amber-100"
      : "bg-slate-100 text-slate-600 ring-slate-200"

  return (
    <Card className="border-slate-200/80 shadow-sm lg:col-span-5">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">
            Penggajian {monthLabel}
          </CardTitle>
          <CardDescription className="text-xs">Ringkasan periode berjalan</CardDescription>
        </div>
        <Link
          href="/payroll"
          className="text-xs font-medium text-emerald-700 hover:underline"
        >
          Buka
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600">Status</span>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
              tone,
            )}
          >
            {statusLabel}
          </span>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Total Net
          </p>
          <p
            className="mt-1 text-2xl font-bold tabular-nums text-slate-900"
            title={rupiahFull.format(netTotal)}
          >
            {rupiahCompact.format(netTotal)}
          </p>
        </div>
        <Separator />
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Cakupan</span>
            <span className="font-semibold tabular-nums text-slate-900">
              {entriesCount} / {totalEmployees} ({coverage}%)
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={totalEmployees}
            aria-valuenow={entriesCount}
            aria-label={`Cakupan payroll ${coverage}%`}
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${coverage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Department donut ────────────────────────────────────

function DepartmentDonutCard({
  departments,
  total,
}: {
  departments: HrAdminDashboardData["departmentBreakdown"]
  total: number
}) {
  const donutData = departments.map((d, i) => ({
    ...d,
    fill: DONUT_PALETTE[i % DONUT_PALETTE.length],
  }))

  const donutConfig: ChartConfig = Object.fromEntries(
    donutData.map((d) => [d.departmentId, { label: d.name, color: d.fill }]),
  )

  return (
    <Card className="border-slate-200/80 shadow-sm lg:col-span-7">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold text-slate-900">
          Karyawan per Departemen
        </CardTitle>
        <CardDescription className="text-xs">
          Distribusi {total} karyawan aktif
        </CardDescription>
      </CardHeader>
      <CardContent>
        {donutData.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Belum ada data"
            hint="Tambahkan karyawan untuk melihat distribusi."
          />
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <ChartContainer
              config={donutConfig}
              className="aspect-square h-[200px] flex-shrink-0"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="name" />}
                />
                <Pie
                  data={donutData}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={80}
                  strokeWidth={2}
                  paddingAngle={2}
                >
                  {donutData.map((d) => (
                    <Cell key={d.departmentId} fill={d.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ScrollArea className="h-[200px] w-full">
              <ul className="space-y-2 pr-3" aria-label="Rincian karyawan per departemen">
                {donutData.map((d) => {
                  const pct = total > 0 ? Math.round((d.count / total) * 100) : 0
                  return (
                    <li
                      key={d.departmentId}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: d.fill }}
                        />
                        <span className="truncate text-slate-700">{d.name}</span>
                      </span>
                      <span className="flex flex-shrink-0 items-baseline gap-1">
                        <span className="font-semibold tabular-nums text-slate-900">
                          {d.count}
                        </span>
                        <span className="text-[10px] tabular-nums text-slate-400">
                          ({pct}%)
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Recruitment ─────────────────────────────────────────

function RecruitmentCard({
  stages,
  openVacancies,
  upcomingInterviews,
}: {
  stages: HrAdminDashboardData["recruitment"]["stageBreakdown"]
  openVacancies: number
  upcomingInterviews: number
}) {
  const totalPipeline = stages.reduce((s, b) => s + b.count, 0)
  return (
    <Card className="border-slate-200/80 shadow-sm lg:col-span-5">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">
            Rekrutmen
          </CardTitle>
          <CardDescription className="text-xs">
            Pipeline & interview terjadwal
          </CardDescription>
        </div>
        <Link
          href="/recruitment"
          className="text-xs font-medium text-emerald-700 hover:underline"
        >
          Lihat semua
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <MetricBlock
            icon={Briefcase}
            label="Lowongan Aktif"
            value={openVacancies}
            tint="bg-emerald-50 text-emerald-700"
          />
          <MetricBlock
            icon={CalendarClock}
            label="Interview Terjadwal"
            value={upcomingInterviews}
            tint="bg-sky-50 text-sky-700"
          />
        </div>
        <Separator />
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600">Distribusi Kandidat</p>
          {totalPipeline === 0 ? (
            <p className="text-xs text-slate-400">Belum ada kandidat.</p>
          ) : (
            <ul className="space-y-2" aria-label="Distribusi tahapan kandidat">
              {stages.map((s) => {
                const pct = totalPipeline > 0 ? (s.count / totalPipeline) * 100 : 0
                return (
                  <li key={s.stage} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700">
                        {STAGE_LABELS[s.stage] ?? s.stage}
                      </span>
                      <span className="font-semibold tabular-nums text-slate-900">
                        {s.count}
                      </span>
                    </div>
                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={totalPipeline}
                      aria-valuenow={s.count}
                      aria-label={`${STAGE_LABELS[s.stage] ?? s.stage}: ${s.count} kandidat`}
                    >
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function MetricBlock({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: LucideIcon
  label: string
  value: number
  tint: string
}) {
  return (
    <div className="rounded-lg border border-slate-200/70 bg-slate-50/50 p-3">
      <div className="flex items-center gap-2">
        <span
          className={cn("flex h-8 w-8 items-center justify-center rounded-lg", tint)}
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xl font-bold tabular-nums leading-none text-slate-900">
            {value}
          </p>
          <p className="mt-1 truncate text-[11px] text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Pending approvals ───────────────────────────────────

function PendingApprovalsCard({
  data,
}: {
  data: HrAdminDashboardData["pendingApprovals"]
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            Menunggu Persetujuan
            {data.total > 0 ? (
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                {data.total}
              </Badge>
            ) : null}
          </CardTitle>
          <CardDescription className="text-xs">Pengajuan cuti terbaru</CardDescription>
        </div>
        <Link
          href="/leave/manage"
          className="text-xs font-medium text-emerald-700 hover:underline"
        >
          Kelola
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {data.list.length === 0 ? (
          <EmptyState
            icon={CalendarCheck2}
            title="Semua sudah beres"
            hint="Tidak ada pengajuan tertunda."
          />
        ) : (
          <ul className="space-y-3" aria-label="Daftar pengajuan cuti pending">
            {data.list.map((lr) => (
              <li
                key={lr.id}
                className="flex items-start gap-3 rounded-lg p-1.5 transition-colors hover:bg-slate-50"
              >
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className="bg-emerald-100 text-[11px] font-medium text-emerald-700">
                    {initials(lr.employeeName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {lr.employeeName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {lr.department} · {lr.leaveTypeName} · {lr.workingDays} hari
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    <Clock className="mr-1 inline h-3 w-3" aria-hidden="true" />
                    {relativeFromNow(lr.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Recent hires ────────────────────────────────────────

function RecentHiresCard({
  hires,
}: {
  hires: HrAdminDashboardData["recentHires"]
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">
            Karyawan Baru
          </CardTitle>
          <CardDescription className="text-xs">
            5 karyawan yang terakhir bergabung
          </CardDescription>
        </div>
        <Link
          href="/employees"
          className="text-xs font-medium text-emerald-700 hover:underline"
        >
          Semua
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {hires.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="Belum ada data"
            hint="Tambahkan karyawan untuk melihatnya di sini."
          />
        ) : (
          <ul className="space-y-3" aria-label="Daftar karyawan baru">
            {hires.map((h) => (
              <li key={h.id} className="flex items-center gap-3">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className="bg-sky-100 text-[11px] font-medium text-sky-700">
                    {initials(h.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{h.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {h.position} · {h.department}
                  </p>
                </div>
                <span className="flex-shrink-0 text-[11px] tabular-nums text-slate-400">
                  {dateShortID.format(new Date(h.joinDate))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Birthdays ───────────────────────────────────────────

function BirthdaysCard({
  birthdays,
}: {
  birthdays: HrAdminDashboardData["upcomingBirthdays"]
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <CakeSlice className="h-4 w-4 text-pink-500" aria-hidden="true" />
            Ulang Tahun
          </CardTitle>
          <CardDescription className="text-xs">30 hari ke depan</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {birthdays.length === 0 ? (
          <EmptyState
            icon={CakeSlice}
            title="Tidak ada ulang tahun"
            hint="30 hari ke depan kosong."
          />
        ) : (
          <ul className="space-y-3" aria-label="Daftar ulang tahun mendatang">
            {birthdays.map((b) => (
              <li key={b.id} className="flex items-center gap-3">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className="bg-pink-100 text-[11px] font-medium text-pink-700">
                    {initials(b.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{b.name}</p>
                  <p className="truncate text-xs text-slate-500">{b.position}</p>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end">
                  <span className="text-[11px] font-medium text-slate-700">
                    {daysUntilLabel(b.daysUntil)}
                  </span>
                  <span className="text-[10px] tabular-nums text-slate-400">
                    {dateMonthDayID.format(new Date(b.birthDate))}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Contract expiring ───────────────────────────────────

function ContractExpiringCard({
  items,
}: {
  items: HrAdminDashboardData["contractExpiring"]
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <FileWarning className="h-4 w-4 text-amber-600" aria-hidden="true" />
            Kontrak Akan Berakhir
          </CardTitle>
          <CardDescription className="text-xs">
            Karyawan PKWT dengan jatuh tempo dalam 90 hari
          </CardDescription>
        </div>
        <Link
          href="/employees"
          className="text-xs font-medium text-emerald-700 hover:underline"
        >
          Lihat karyawan
        </Link>
      </CardHeader>
      <CardContent>
        <ul
          className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3"
          aria-label="Daftar kontrak akan berakhir"
        >
          {items.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200/70 bg-white p-3"
            >
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarFallback className="bg-amber-100 text-[11px] font-medium text-amber-700">
                  {initials(e.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{e.name}</p>
                <p className="truncate text-xs text-slate-500">
                  {e.position} · {e.department}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Bergabung {dateShortID.format(new Date(e.joinDate))}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

// ─── Empty state ─────────────────────────────────────────

function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: LucideIcon
  title: string
  hint: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-5 w-5 text-slate-400" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="max-w-[200px] text-xs text-slate-500">{hint}</p>
    </div>
  )
}

