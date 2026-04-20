"use client"

import Link from "next/link"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from "recharts"
import {
  ArrowRight,
  Banknote,
  CakeSlice,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  LogIn,
  LogOut,
  Palmtree,
  TrendingUp,
  UserCircle2,
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
import type { EmployeeDashboardData } from "@/lib/services/dashboard.service"
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

function formatClockTime(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function formatDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return "—"
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m} menit`
  if (m === 0) return `${h} jam`
  return `${h} jam ${m} menit`
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

interface EmployeeDashboardProps {
  data: EmployeeDashboardData
  name: string
}

export function EmployeeDashboard({ data, name }: EmployeeDashboardProps) {
  const today = new Date(data.todayAttendance.date + "T00:00:00Z")
  const greeting = getGreeting()

  // No linked employee — show a minimal state.
  if (!data.employee) {
    return (
      <div
        className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
        aria-label="Dashboard Karyawan"
      >
        <section className="flex flex-col gap-2">
          <p className="text-sm font-medium text-emerald-700">{greeting}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Halo, {name} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {dateLongID.format(today)}
          </p>
        </section>
        <Card className="border-amber-200 bg-amber-50/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-amber-900">
              Profil karyawan belum terhubung
            </CardTitle>
            <CardDescription className="text-amber-800/80">
              Hubungi Admin HR untuk menghubungkan akun Anda dengan data
              kepegawaian.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const totalLeaveRemaining = data.leaveBalances.reduce(
    (s, b) => s + b.remaining,
    0,
  )
  const totalLeaveAllocated = data.leaveBalances.reduce(
    (s, b) => s + b.allocated,
    0,
  )

  return (
    <div
      className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
      aria-label="Dashboard Karyawan"
    >
      <section
        aria-labelledby="emp-greeting-heading"
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-sm font-medium text-emerald-700">{greeting}</p>
          <h1
            id="emp-greeting-heading"
            className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"
          >
            Halo, {data.employee.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {dateLongID.format(today)} ·{" "}
            <span className="font-medium text-slate-800">
              {data.employee.position}
            </span>{" "}
            · {data.employee.department}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/leave"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-2 bg-white",
            )}
          >
            <Palmtree className="h-4 w-4" aria-hidden="true" />
            Ajukan Cuti
          </Link>
          <Link
            href="/attendance"
            className={cn(
              buttonVariants({ size: "sm" }),
              "gap-2 bg-emerald-600 text-white hover:bg-emerald-700",
            )}
          >
            <Clock className="h-4 w-4" aria-hidden="true" />
            Absensi
          </Link>
        </div>
      </section>

      {/* Top hero: Today's clock-in status */}
      <ClockStatusHero attendance={data.todayAttendance} />

      {/* Stat row */}
      <section
        aria-label="Ringkasan pribadi"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatTile
          icon={CalendarCheck}
          label="Hadir Bulan Ini"
          value={`${data.monthlyStats.presentDays}`}
          caption={`dari ${data.monthlyStats.workingDaysSoFar} hari tercatat`}
          tint="bg-emerald-50 text-emerald-700"
        />
        <StatTile
          icon={Clock}
          label="Keterlambatan"
          value={data.monthlyStats.lateDays}
          caption={
            data.monthlyStats.lateDays === 0
              ? "Tepat waktu terus!"
              : `${data.monthlyStats.monthLabel}`
          }
          tint="bg-amber-50 text-amber-700"
        />
        <StatTile
          icon={Palmtree}
          label="Sisa Cuti"
          value={totalLeaveRemaining}
          caption={`dari ${totalLeaveAllocated} hari jatah tahun ini`}
          tint="bg-sky-50 text-sky-700"
          href="/leave"
        />
        <StatTile
          icon={TrendingUp}
          label="Lembur"
          value={formatDuration(data.monthlyStats.overtimeMinutes)}
          caption={data.monthlyStats.monthLabel}
          tint="bg-violet-50 text-violet-700"
        />
      </section>

      {/* Weekly trend + Payslip */}
      <section
        aria-label="Kehadiran mingguan & payslip"
        className="grid grid-cols-1 gap-4 lg:grid-cols-12"
      >
        <WeeklyTrendCard trend={data.attendanceTrend} />
        <PayslipCard payslip={data.latestPayslip} />
      </section>

      {/* Leave balances & Upcoming leave */}
      <section
        aria-label="Cuti"
        className="grid grid-cols-1 gap-4 lg:grid-cols-12"
      >
        <LeaveBalancesCard
          balances={data.leaveBalances}
          pendingCount={data.pendingLeaveCount}
        />
        <UpcomingLeaveCard upcoming={data.upcomingLeave} />
      </section>

      {/* Team on leave + Birthdays + Profile */}
      <section
        aria-label="Tim & info pribadi"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <TeamOnLeaveCard items={data.teamOnLeave} />
        <CoworkerBirthdaysCard birthdays={data.coworkerBirthdays} />
        <ProfileCard
          name={data.employee.name}
          position={data.employee.position}
          department={data.employee.department}
          joinDate={data.employee.joinDate}
          tenureMonths={data.employee.tenureMonths}
        />
      </section>
    </div>
  )
}

// ─── Hero: today's clock-in ──────────────────────────────

function ClockStatusHero({
  attendance,
}: {
  attendance: EmployeeDashboardData["todayAttendance"]
}) {
  const { clockedIn, clockedOut, clockIn, clockOut, isLate, lateMinutes, totalMinutes, workStartTime, workEndTime } =
    attendance

  let headline = "Siap memulai hari?"
  let sub = "Catat absen masuk untuk mengawali jam kerja."
  let tone: "emerald" | "amber" | "sky" | "slate" = "slate"
  let icon: LucideIcon = LogIn

  if (clockedIn && !clockedOut) {
    headline = isLate
      ? `Hadir · Terlambat ${lateMinutes} menit`
      : "Hadir tepat waktu"
    sub = `Masuk ${formatClockTime(clockIn)}${workEndTime ? ` · Jadwal pulang ${workEndTime}` : ""}`
    tone = isLate ? "amber" : "emerald"
    icon = CheckCircle2
  } else if (clockedIn && clockedOut) {
    headline = "Hari ini selesai"
    sub = `${formatClockTime(clockIn)} — ${formatClockTime(clockOut)} · Total ${formatDuration(totalMinutes)}`
    tone = "sky"
    icon = LogOut
  }

  const toneMap = {
    emerald: {
      ring: "ring-emerald-100",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      badge: "bg-emerald-100 text-emerald-800",
    },
    amber: {
      ring: "ring-amber-100",
      bg: "bg-amber-50",
      text: "text-amber-700",
      badge: "bg-amber-100 text-amber-800",
    },
    sky: {
      ring: "ring-sky-100",
      bg: "bg-sky-50",
      text: "text-sky-700",
      badge: "bg-sky-100 text-sky-800",
    },
    slate: {
      ring: "ring-slate-200",
      bg: "bg-slate-100",
      text: "text-slate-600",
      badge: "bg-slate-200 text-slate-700",
    },
  }[tone]

  const Icon = icon

  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl ring-1",
              toneMap.bg,
              toneMap.text,
              toneMap.ring,
            )}
            aria-hidden="true"
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Absensi hari ini
            </p>
            <p className="text-lg font-semibold text-slate-900 sm:text-xl">
              {headline}
            </p>
            <p className="mt-0.5 text-sm text-slate-600">{sub}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden flex-col items-end text-right sm:flex">
            <span className="text-[11px] uppercase tracking-wide text-slate-500">
              Jam masuk
            </span>
            <span className="font-mono text-lg font-semibold tabular-nums text-slate-900">
              {formatClockTime(clockIn)}
            </span>
            {workStartTime ? (
              <span className="text-[11px] text-slate-400">
                jadwal {workStartTime}
              </span>
            ) : null}
          </div>
          <Link
            href="/attendance"
            className={cn(
              buttonVariants({ size: "sm" }),
              "gap-2 bg-emerald-600 text-white hover:bg-emerald-700",
            )}
          >
            {clockedIn && !clockedOut ? (
              <>
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Absen Pulang
              </>
            ) : clockedIn && clockedOut ? (
              <>
                <Clock className="h-4 w-4" aria-hidden="true" />
                Lihat Detail
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Absen Masuk
              </>
            )}
          </Link>
        </div>
      </CardContent>
    </Card>
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

// ─── Weekly trend ────────────────────────────────────────

const weeklyConfig = {
  hours: { label: "Jam kerja", color: "#10b981" },
} satisfies ChartConfig

function WeeklyTrendCard({
  trend,
}: {
  trend: EmployeeDashboardData["attendanceTrend"]
}) {
  const data = trend.map((d) => ({
    label: d.label,
    hours: Math.round((d.totalMinutes / 60) * 10) / 10,
    isLate: d.isLate,
    clockedIn: d.clockedIn,
  }))
  const totalHours = data.reduce((s, d) => s + d.hours, 0)
  const activeDays = data.filter((d) => d.clockedIn).length

  return (
    <Card className="border-slate-200/80 shadow-sm lg:col-span-8">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">
            Jam Kerja 7 Hari
          </CardTitle>
          <CardDescription className="text-xs">
            {activeDays} hari hadir · total {totalHours.toFixed(1)} jam
          </CardDescription>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <LegendDot color="#10b981" label="Tepat waktu" />
          <LegendDot color="#f59e0b" label="Terlambat" />
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={weeklyConfig} className="h-[240px] w-full">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
              cursor={{ fill: "rgba(16, 185, 129, 0.08)" }}
              content={
                <ChartTooltipContent
                  indicator="dashed"
                  formatter={(value) => `${Number(value)} jam`}
                />
              }
            />
            <Bar dataKey="hours" radius={[8, 8, 0, 0]} maxBarSize={40}>
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.isLate ? "#f59e0b" : d.clockedIn ? "#10b981" : "#cbd5e1"}
                />
              ))}
            </Bar>
          </BarChart>
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

// ─── Payslip ─────────────────────────────────────────────

function PayslipCard({
  payslip,
}: {
  payslip: EmployeeDashboardData["latestPayslip"]
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm lg:col-span-4">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">
            Slip Gaji Terbaru
          </CardTitle>
          <CardDescription className="text-xs">
            {payslip ? payslip.monthLabel : "Belum tersedia"}
          </CardDescription>
        </div>
        <Banknote className="h-5 w-5 text-emerald-600" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {!payslip ? (
          <EmptyState
            icon={Banknote}
            title="Belum ada slip gaji"
            hint="Slip gaji akan muncul setelah HR memproses payroll."
          />
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Net Pay
              </p>
              <p
                className="mt-1 text-3xl font-bold tabular-nums text-slate-900"
                title={rupiahFull.format(payslip.netPay)}
              >
                {rupiahCompact.format(payslip.netPay)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={cn(
                  "text-xs",
                  payslip.status === "FINALIZED"
                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                    : "bg-amber-100 text-amber-800 hover:bg-amber-100",
                )}
              >
                {payslip.status === "FINALIZED" ? "Difinalisasi" : "Draft"}
              </Badge>
            </div>
            <Link
              href="/payslip"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Lihat detail slip
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Leave balances ──────────────────────────────────────

function LeaveBalancesCard({
  balances,
  pendingCount,
}: {
  balances: EmployeeDashboardData["leaveBalances"]
  pendingCount: number
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm lg:col-span-7">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            Saldo Cuti
            {pendingCount > 0 ? (
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                {pendingCount} pending
              </Badge>
            ) : null}
          </CardTitle>
          <CardDescription className="text-xs">
            Jatah & pemakaian cuti tahun berjalan
          </CardDescription>
        </div>
        <Link
          href="/leave"
          className="text-xs font-medium text-emerald-700 hover:underline"
        >
          Kelola
        </Link>
      </CardHeader>
      <CardContent>
        {balances.length === 0 ? (
          <EmptyState
            icon={Palmtree}
            title="Belum ada saldo cuti"
            hint="HR akan mengalokasikan saldo cuti tahunan Anda."
          />
        ) : (
          <ul className="space-y-4" aria-label="Saldo cuti per jenis">
            {balances.map((b) => {
              const pct = b.allocated > 0 ? (b.used / b.allocated) * 100 : 0
              return (
                <li key={b.leaveTypeId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{b.leaveTypeName}</span>
                    <span className="tabular-nums text-slate-600">
                      <span className="font-semibold text-slate-900">{b.remaining}</span>
                      <span className="text-slate-400"> / {b.allocated} hari</span>
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={b.allocated}
                    aria-valuenow={b.used}
                    aria-label={`${b.leaveTypeName}: terpakai ${b.used} dari ${b.allocated} hari`}
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        pct > 80 ? "bg-rose-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Terpakai {b.used} hari
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Upcoming leave ──────────────────────────────────────

function UpcomingLeaveCard({
  upcoming,
}: {
  upcoming: EmployeeDashboardData["upcomingLeave"]
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm lg:col-span-5">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">
            Cuti Mendatang
          </CardTitle>
          <CardDescription className="text-xs">
            Disetujui untuk 7 hari ke depan
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {!upcoming ? (
          <div className="space-y-4">
            <EmptyState
              icon={CalendarCheck}
              title="Tidak ada cuti dijadwalkan"
              hint="Butuh istirahat? Ajukan cuti dari sini."
            />
            <Link
              href="/leave"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mx-auto flex w-fit items-center gap-2 bg-white",
              )}
            >
              <Palmtree className="h-4 w-4" aria-hidden="true" />
              Ajukan Cuti
            </Link>
          </div>
        ) : (
          <div className="space-y-4 rounded-lg bg-emerald-50/50 p-4 ring-1 ring-emerald-100">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                {upcoming.leaveTypeName}
              </Badge>
              <span className="text-xs font-medium text-emerald-700">
                {upcoming.workingDays} hari kerja
              </span>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Periode
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {dateShortID.format(new Date(upcoming.startDate))}
                {upcoming.startDate !== upcoming.endDate
                  ? ` — ${dateShortID.format(new Date(upcoming.endDate))}`
                  : ""}
              </p>
            </div>
            <Link
              href="/leave"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline"
            >
              Lihat riwayat cuti
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Team on leave ───────────────────────────────────────

function TeamOnLeaveCard({
  items,
}: {
  items: EmployeeDashboardData["teamOnLeave"]
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <Users2 className="h-4 w-4 text-sky-500" aria-hidden="true" />
          Rekan Sedang Cuti
        </CardTitle>
        <CardDescription className="text-xs">
          Anggota departemen Anda yang sedang cuti
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {items.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Tidak ada yang cuti"
            hint="Seluruh rekan tersedia hari ini."
          />
        ) : (
          <ul className="space-y-3" aria-label="Rekan yang sedang cuti">
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
                  s/d {dateShortID.format(new Date(l.endDate))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Coworker birthdays ──────────────────────────────────

function CoworkerBirthdaysCard({
  birthdays,
}: {
  birthdays: EmployeeDashboardData["coworkerBirthdays"]
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <CakeSlice className="h-4 w-4 text-pink-500" aria-hidden="true" />
          Ulang Tahun Rekan
        </CardTitle>
        <CardDescription className="text-xs">30 hari ke depan</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {birthdays.length === 0 ? (
          <EmptyState
            icon={CakeSlice}
            title="Tidak ada ulang tahun"
            hint="30 hari ke depan kosong."
          />
        ) : (
          <ul className="space-y-3" aria-label="Ulang tahun rekan">
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

// ─── Profile card ────────────────────────────────────────

function ProfileCard({
  name,
  position,
  department,
  joinDate,
  tenureMonths,
}: {
  name: string
  position: string
  department: string
  joinDate: string
  tenureMonths: number
}) {
  const years = Math.floor(tenureMonths / 12)
  const months = tenureMonths % 12
  const tenureLabel =
    years > 0
      ? `${years} tahun${months > 0 ? ` ${months} bln` : ""}`
      : `${months} bulan`

  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <UserCircle2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
          Profil Saya
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarFallback className="bg-emerald-100 text-sm font-semibold text-emerald-700">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
            <p className="truncate text-xs text-slate-500">
              {position} · {department}
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="text-slate-500">Bergabung</dt>
            <dd className="mt-0.5 font-medium text-slate-800">
              {dateShortID.format(new Date(joinDate))}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Masa Kerja</dt>
            <dd className="mt-0.5 font-medium text-slate-800">{tenureLabel}</dd>
          </div>
        </dl>
        <Link
          href="/employees"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline"
        >
          Lihat profil lengkap
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
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
