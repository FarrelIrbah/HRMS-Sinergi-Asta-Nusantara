import { redirect } from "next/navigation";
import {
  Clock,
  CalendarCheck,
  AlertTriangle,
  Timer,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getTodayRecord,
  getWeeklySummary,
  getEmployeeAttendance,
} from "@/lib/services/attendance.service";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AttendanceToday } from "./_components/attendance-today";
import { AttendanceHistory } from "./_components/attendance-history";

export default async function AttendancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      namaLengkap: true,
      isActive: true,
      officeLocation: {
        select: { name: true, workStartTime: true, workEndTime: true },
      },
    },
  });

  if (!employee) {
    return (
      <div className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6">
        <header className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
            aria-hidden="true"
          >
            <Clock className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Absensi
          </h1>
        </header>
        <Card className="border-slate-200">
          <CardContent className="py-12 text-center">
            <p className="text-sm text-slate-500">
              Anda tidak memiliki profil karyawan. Gunakan halaman Admin Absensi
              untuk melihat data absensi.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [todayRecord, weeklySummary, recentAttendance] = await Promise.all([
    getTodayRecord(employee.id),
    getWeeklySummary(employee.id),
    getEmployeeAttendance(employee.id, 7),
  ]);

  // Compute stats for KPI tiles
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthRecords = recentAttendance.filter(
    (r) => new Date(r.date) >= currentMonthStart
  );

  const isClockedOut = !!todayRecord?.clockOut;
  const isClockedIn = !!todayRecord?.clockIn && !todayRecord?.clockOut;

  const todayStatus = isClockedOut
    ? "Selesai"
    : isClockedIn
      ? "Sedang Kerja"
      : "Belum Absen";

  const weekPresentDays = weeklySummary.filter((d) => d.hasRecord).length;
  const weekLateDays = weeklySummary.filter((d) => d.isLate).length;

  const avgMinutes =
    monthRecords.length > 0
      ? Math.round(
          monthRecords.reduce((s, r) => s + r.totalMinutes, 0) /
            monthRecords.length
        )
      : 0;
  const avgHours = Math.floor(avgMinutes / 60);
  const avgMins = avgMinutes % 60;

  const monthOT = monthRecords.reduce((s, r) => s + r.overtimeMinutes, 0);
  const otHours = Math.floor(monthOT / 60);
  const otMins = monthOT % 60;

  return (
    <div
      className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
      aria-label="Halaman absensi"
    >
      {/* ─── Header ────────────────────────────────── */}
      <header>
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
            aria-hidden="true"
          >
            <Clock className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Absensi
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {employee.officeLocation
            ? `${employee.officeLocation.name} \u00B7 Jam kerja ${employee.officeLocation.workStartTime ?? "08:00"}\u2013${employee.officeLocation.workEndTime ?? "17:00"} WIB`
            : "Lokasi kantor belum dikonfigurasi"}
        </p>
      </header>

      {/* ─── KPI Summary ──────────────────────────── */}
      <section
        aria-label="Ringkasan kehadiran"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        <SummaryTile
          icon={Clock}
          label="Hari Ini"
          value={todayStatus}
          tone={isClockedOut ? "emerald" : isClockedIn ? "sky" : "amber"}
        />
        <SummaryTile
          icon={CalendarCheck}
          label="Hadir Minggu Ini"
          value={`${weekPresentDays}/5`}
          tone="emerald"
        />
        <SummaryTile
          icon={AlertTriangle}
          label="Terlambat"
          value={`${weekLateDays}x`}
          tone={weekLateDays > 0 ? "amber" : "slate"}
        />
        <SummaryTile
          icon={Timer}
          label="Rata-rata/Hari"
          value={avgMinutes > 0 ? `${avgHours}j ${avgMins}m` : "\u2014"}
          tone="sky"
        />
        <SummaryTile
          icon={TrendingUp}
          label="Lembur Bulan Ini"
          value={monthOT > 0 ? `${otHours}j ${otMins}m` : "\u2014"}
          tone="violet"
        />
      </section>

      {/* ─── Today + Weekly ───────────────────────── */}
      <AttendanceToday
        todayRecord={todayRecord}
        weeklySummary={weeklySummary}
        employeeId={employee.id}
      />

      {/* ─── History Table ────────────────��───────── */}
      <AttendanceHistory records={recentAttendance} />
    </div>
  );
}

// ─────────────────── Sub-component ───────────────────

type Tone = "emerald" | "sky" | "violet" | "amber" | "slate";

const TONE_MAP: Record<Tone, { bg: string; text: string; ring: string }> = {
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-100",
  },
  sky: { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-100" },
  violet: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    ring: "ring-violet-100",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-100",
  },
  slate: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    ring: "ring-slate-200",
  },
};

function SummaryTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: Tone;
}) {
  const t = TONE_MAP[tone];
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ring-1",
            t.bg,
            t.text,
            t.ring
          )}
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="text-lg font-bold tabular-nums leading-tight text-slate-900">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
