"use client"

import Link from "next/link"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import {
  Briefcase,
  CakeSlice,
  CalendarCheck2,
  CalendarDays,
  Clock,
  UserMinus,
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
import { SummaryTile } from "@/components/shared/summary-tile"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ManagerDashboardData } from "@/lib/services/dashboard.service"
import { cn } from "@/lib/utils"

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

interface ManagerDashboardProps {
  data: ManagerDashboardData
  name: string
}

export function ManagerDashboard({ data, name }: ManagerDashboardProps) {
  const today = new Date(data.today.date + "T00:00:00Z")
  const greeting = getGreeting()
  const total = data.department.totalMembers
  const presentPct =
    total > 0
      ? Math.round(((data.today.present + data.today.onLeave) / total) * 100)
      : 0

  return (
    <div
      className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
      aria-label="Dashboard Manager"
    >
      <section
        aria-labelledby="mgr-greeting-heading"
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-sm font-medium text-emerald-700">{greeting}</p>
          <h1
            id="mgr-greeting-heading"
            className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"
          >
            Halo, {name} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {dateLongID.format(today)} · Tim{" "}
            <span className="font-medium text-slate-800">
              {data.department.name}
            </span>
            {" "}({total} anggota)
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
            Approval Cuti
            {data.pendingApprovals.total > 0 ? (
              <Badge className="ml-1 h-5 min-w-5 bg-amber-100 px-1.5 text-[11px] text-amber-800 hover:bg-amber-100">
                {data.pendingApprovals.total}
              </Badge>
            ) : null}
          </Link>
          <Link
            href="/employees"
            className={cn(
              buttonVariants({ size: "sm" }),
              "gap-2 bg-emerald-600 text-white hover:bg-emerald-700",
            )}
          >
            <Users2 className="h-4 w-4" aria-hidden="true" />
            Tim Saya
          </Link>
        </div>
      </section>

      <section
        aria-label="Statistik tim"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <SummaryTile
          icon={Users2}
          label="Anggota Tim"
          value={total}
          caption={`Kehadiran ${presentPct}% hari ini`}
          tone="emerald"
          href="/employees"
        />
        <SummaryTile
          icon={UserRound}
          label="Hadir Hari Ini"
          value={data.today.present}
          caption={
            data.today.lateCount > 0
              ? `${data.today.lateCount} terlambat`
              : "Tepat waktu semua"
          }
          tone="sky"
          href="/attendance-admin"
        />
        <SummaryTile
          icon={CalendarDays}
          label="Cuti Hari Ini"
          value={data.today.onLeave}
          caption={`${data.pendingApprovals.total} menunggu approval`}
          tone="amber"
          href="/leave/manage"
        />
        <SummaryTile
          icon={UserMinus}
          label="Tidak Hadir"
          value={data.today.absent}
          caption={
            total > 0
              ? `${Math.round((data.today.absent / total) * 100)}% dari tim`
              : "—"
          }
          tone="rose"
          href="/attendance-admin"
        />
      </section>

      <section
        aria-label="Tren & distribusi"
        className="grid grid-cols-1 gap-4 lg:grid-cols-12"
      >
        <AttendanceTrendCard trend={data.attendanceTrend} />
        <PositionBreakdownCard items={data.positionBreakdown} total={total} />
      </section>

      <section
        aria-label="Approval & tim cuti"
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <PendingApprovalsCard data={data.pendingApprovals} />
        <TeamOnLeaveCard items={data.teamOnLeave} />
      </section>

      <section
        aria-label="Status tim hari ini"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <TeamRosterCard roster={data.teamRoster} />
        </div>
        <BirthdaysCard birthdays={data.upcomingBirthdays} />
      </section>
    </div>
  )
}

// ─── Attendance trend ───────────────────────────────────

const attendanceConfig = {
  present: { label: "Hadir", color: "#10b981" },
  late: { label: "Terlambat", color: "#f59e0b" },
} satisfies ChartConfig

function AttendanceTrendCard({
  trend,
}: {
  trend: ManagerDashboardData["attendanceTrend"]
}) {
  const totalPresent = trend.reduce((s, d) => s + d.present, 0)
  const totalLate = trend.reduce((s, d) => s + d.late, 0)

  return (
    <Card className="border-slate-200/80 shadow-sm lg:col-span-7">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">
            Tren Kehadiran Tim 7 Hari
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
              <linearGradient id="mgr-att-present" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="mgr-att-late" x1="0" y1="0" x2="0" y2="1">
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
              fill="url(#mgr-att-present)"
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="late"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#mgr-att-late)"
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

// ─── Position breakdown ──────────────────────────────────

const positionConfig = {
  count: { label: "Karyawan", color: "#10b981" },
} satisfies ChartConfig

function PositionBreakdownCard({
  items,
  total,
}: {
  items: ManagerDashboardData["positionBreakdown"]
  total: number
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm lg:col-span-5">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold text-slate-900">
          Komposisi Jabatan
        </CardTitle>
        <CardDescription className="text-xs">
          Distribusi {total} anggota tim berdasarkan jabatan
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="Belum ada data"
            hint="Tim belum memiliki anggota terdaftar."
          />
        ) : (
          <ChartContainer config={positionConfig} className="h-[240px] w-full">
            <BarChart
              data={items}
              layout="vertical"
              margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#475569" }}
                width={120}
              />
              <ChartTooltip
                cursor={{ fill: "rgba(16, 185, 129, 0.08)" }}
                content={<ChartTooltipContent indicator="dashed" />}
              />
              <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} maxBarSize={22} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Pending approvals ───────────────────────────────────

function PendingApprovalsCard({
  data,
}: {
  data: ManagerDashboardData["pendingApprovals"]
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            Menunggu Approval
            {data.total > 0 ? (
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                {data.total}
              </Badge>
            ) : null}
          </CardTitle>
          <CardDescription className="text-xs">
            Pengajuan cuti dari tim Anda
          </CardDescription>
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
            hint="Tidak ada pengajuan cuti tertunda dari tim."
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
                    {lr.leaveTypeName} · {lr.workingDays} hari
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    <Clock className="mr-1 inline h-3 w-3" aria-hidden="true" />
                    {relativeFromNow(lr.createdAt)}
                  </p>
                </div>
                <Link
                  href="/leave/manage"
                  className="flex-shrink-0 text-xs font-medium text-emerald-700 hover:underline"
                  aria-label={`Tinjau pengajuan ${lr.employeeName}`}
                >
                  Tinjau
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Team on leave ────────────────────────────────────────

function TeamOnLeaveCard({
  items,
}: {
  items: ManagerDashboardData["teamOnLeave"]
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">
            Sedang Cuti
          </CardTitle>
          <CardDescription className="text-xs">
            Anggota tim yang sedang cuti saat ini
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {items.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Tidak ada yang cuti"
            hint="Seluruh tim tersedia hari ini."
          />
        ) : (
          <ul className="space-y-3" aria-label="Anggota tim yang sedang cuti">
            {items.map((l) => (
              <li key={l.id} className="flex items-center gap-3">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className="bg-amber-100 text-[11px] font-medium text-amber-700">
                    {initials(l.employeeName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {l.employeeName}
                  </p>
                  <p className="truncate text-xs text-slate-500">{l.leaveTypeName}</p>
                </div>
                <span className="flex-shrink-0 text-[11px] tabular-nums text-slate-400">
                  {dateShortID.format(new Date(l.startDate))}
                  {l.startDate !== l.endDate
                    ? ` — ${dateShortID.format(new Date(l.endDate))}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Team roster with live status ────────────────────────

function TeamRosterCard({
  roster,
}: {
  roster: ManagerDashboardData["teamRoster"]
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">
            Status Tim Hari Ini
          </CardTitle>
          <CardDescription className="text-xs">
            Kehadiran, keterlambatan & cuti per anggota
          </CardDescription>
        </div>
        <Link
          href="/employees"
          className="text-xs font-medium text-emerald-700 hover:underline"
        >
          Detail
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {roster.length === 0 ? (
          <EmptyState
            icon={Users2}
            title="Belum ada anggota tim"
            hint="Departemen ini belum memiliki karyawan aktif."
          />
        ) : (
          <ScrollArea className="h-[320px] pr-2">
            <ul className="space-y-2" aria-label="Daftar status anggota tim">
              {roster.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white p-2.5 hover:bg-slate-50"
                >
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarFallback className="bg-sky-100 text-[11px] font-medium text-sky-700">
                      {initials(m.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {m.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">{m.position}</p>
                  </div>
                  <StatusPill
                    isPresent={m.isPresent}
                    isLate={m.isLate}
                    isOnLeave={m.isOnLeave}
                  />
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

function StatusPill({
  isPresent,
  isLate,
  isOnLeave,
}: {
  isPresent: boolean
  isLate: boolean
  isOnLeave: boolean
}) {
  if (isOnLeave) {
    return (
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-100">
        Cuti
      </span>
    )
  }
  if (isLate) {
    return (
      <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700 ring-1 ring-orange-100">
        Terlambat
      </span>
    )
  }
  if (isPresent) {
    return (
      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-100">
        Hadir
      </span>
    )
  }
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
      Belum absen
    </span>
  )
}

// ─── Birthdays ───────────────────────────────────────────

function BirthdaysCard({
  birthdays,
}: {
  birthdays: ManagerDashboardData["upcomingBirthdays"]
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <CakeSlice className="h-4 w-4 text-pink-500" aria-hidden="true" />
            Ulang Tahun Tim
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
          <ul className="space-y-3" aria-label="Daftar ulang tahun tim mendatang">
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
