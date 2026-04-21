import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMonthlyAttendanceRecap } from "@/lib/services/attendance.service";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { id as localeId } from "date-fns/locale";
import {
  ArrowLeft,
  User2,
  CalendarCheck,
  AlertTriangle,
  Timer,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { AttendanceStatusBadges } from "@/components/attendance/attendance-status-badges";
import { AttendanceFilters } from "../_components/attendance-filters";

const TZ = "Asia/Jakarta";

interface PageProps {
  params: Promise<{ employeeId: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
}

function minutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}j` : `${h}j ${m}m`;
}

export default async function EmployeeAttendanceDetailPage({
  params,
  searchParams,
}: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (!["HR_ADMIN", "SUPER_ADMIN", "MANAGER"].includes(role)) {
    redirect("/attendance");
  }

  const { employeeId } = await params;
  const sp = await searchParams;
  const month = Number(sp.month ?? new Date().getMonth() + 1);
  const year = Number(sp.year ?? new Date().getFullYear());

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      department: { select: { name: true } },
      position: { select: { name: true } },
    },
  });

  if (!employee) notFound();

  if (role === "MANAGER") {
    const managerEmployee = await prisma.employee.findUnique({
      where: { userId: session.user.id },
      select: { departmentId: true },
    });
    if (managerEmployee?.departmentId !== employee.departmentId) {
      redirect("/attendance-admin");
    }
  }

  const records = await getMonthlyAttendanceRecap({
    month,
    year,
    employeeId,
  });

  // Compute stats
  const presentDays = records.filter((r) => r.clockIn).length;
  const lateDays = records.filter((r) => r.isLate).length;
  const totalMinutes = records.reduce((s, r) => s + r.totalMinutes, 0);
  const avgMin =
    presentDays > 0 ? Math.round(totalMinutes / presentDays) : 0;
  const avgH = Math.floor(avgMin / 60);
  const avgM = avgMin % 60;
  const totalOT = records.reduce((s, r) => s + r.overtimeMinutes, 0);
  const otH = Math.floor(totalOT / 60);
  const otM = totalOT % 60;

  return (
    <div
      className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
      aria-label={`Detail absensi ${employee.namaLengkap}`}
    >
      {/* ─── Back + Header ─────────────────────────── */}
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-1 text-slate-600 hover:text-slate-900"
        >
          <Link href="/attendance-admin">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Kembali
          </Link>
        </Button>

        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
                aria-hidden="true"
              >
                <User2 className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {employee.namaLengkap}
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {employee.nik} &middot; {employee.department.name} &middot;{" "}
              {employee.position.name}
            </p>
          </div>
          <AttendanceFilters />
        </header>
      </div>

      {/* ─── KPI Tiles ─────────────────────────────── */}
      <section
        aria-label="Ringkasan absensi karyawan"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <SummaryTile
          icon={CalendarCheck}
          label="Hari Hadir"
          value={presentDays}
          tone="emerald"
        />
        <SummaryTile
          icon={AlertTriangle}
          label="Terlambat"
          value={`${lateDays}x`}
          tone={lateDays > 0 ? "amber" : "slate"}
        />
        <SummaryTile
          icon={Timer}
          label="Rata-rata/Hari"
          value={avgMin > 0 ? `${avgH}j ${avgM}m` : "\u2014"}
          tone="sky"
        />
        <SummaryTile
          icon={TrendingUp}
          label="Total Lembur"
          value={totalOT > 0 ? `${otH}j ${otM}m` : "\u2014"}
          tone="violet"
        />
      </section>

      {/* ─── Detail Table ──────────────────────────── */}
      {records.length === 0 ? (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="text-sm text-slate-500">
              Tidak ada data absensi untuk periode ini.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <Table className="table-fixed">
                <colgroup>
                  <col className="w-[20%]" />
                  <col className="w-[11%]" />
                  <col className="w-[11%]" />
                  <col className="w-[13%]" />
                  <col className="w-[30%]" />
                  <col className="w-[15%]" />
                </colgroup>
                <TableHeader>
                  <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
                    <TableHead className="text-xs font-semibold text-slate-600">
                      Tanggal
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">
                      Masuk
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">
                      Pulang
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">
                      Total
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">
                      Status
                    </TableHead>
                    <TableHead className="text-center text-xs font-semibold text-slate-600">
                      Lembur
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium text-slate-900">
                        <div className="flex flex-col">
                          <span>
                            {format(toZonedTime(record.date, TZ), "dd MMM yyyy", {
                              locale: localeId,
                            })}
                          </span>
                          <span className="text-[11px] font-normal capitalize text-slate-500">
                            {format(toZonedTime(record.date, TZ), "EEEE", {
                              locale: localeId,
                            })}
                          </span>
                        </div>
                        {record.isManualOverride && (
                          <Badge
                            variant="outline"
                            className="mt-1 border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-700"
                          >
                            Manual
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums text-slate-700">
                        {record.clockIn
                          ? format(
                              toZonedTime(record.clockIn, TZ),
                              "HH:mm"
                            )
                          : "\u2014"}
                      </TableCell>
                      <TableCell className="tabular-nums text-slate-700">
                        {record.clockOut
                          ? format(
                              toZonedTime(record.clockOut, TZ),
                              "HH:mm"
                            )
                          : "\u2014"}
                      </TableCell>
                      <TableCell className="tabular-nums text-slate-700">
                        {record.totalMinutes > 0
                          ? minutesToHours(record.totalMinutes)
                          : "\u2014"}
                      </TableCell>
                      <TableCell>
                        <AttendanceStatusBadges
                          record={record}
                          showOvertime={false}
                          showManual={false}
                        />
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-sm text-slate-700">
                        {record.overtimeMinutes > 0 ? (
                          <span className="inline-flex items-center rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                            {minutesToHours(record.overtimeMinutes)}
                          </span>
                        ) : (
                          <span className="text-slate-400">{"\u2014"}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
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
  value: number | string;
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
