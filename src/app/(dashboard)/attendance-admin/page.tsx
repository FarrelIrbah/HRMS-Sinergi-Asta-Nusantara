import { redirect } from "next/navigation";
import {
  ShieldCheck,
  Users2,
  UserCheck,
  AlertTriangle,
  Timer,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMonthlyAttendanceRecap } from "@/lib/services/attendance.service";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AttendanceFilters } from "./_components/attendance-filters";
import { AttendanceSummaryTable } from "./_components/attendance-summary-table";
import { ManualRecordDialog } from "./_components/manual-record-dialog";
import { ExportButtons } from "./_components/export-buttons";

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function AttendanceAdminPage({
  searchParams,
}: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (!["HR_ADMIN", "SUPER_ADMIN", "MANAGER"].includes(role)) {
    redirect("/attendance");
  }

  const params = await searchParams;
  const month = Number(params.month ?? new Date().getMonth() + 1);
  const year = Number(params.year ?? new Date().getFullYear());

  let departmentId: string | undefined;
  if (role === "MANAGER") {
    const managerEmployee = await prisma.employee.findUnique({
      where: { userId: session.user.id },
      select: { departmentId: true },
    });
    departmentId = managerEmployee?.departmentId ?? undefined;
  }

  const records = await getMonthlyAttendanceRecap({
    month,
    year,
    departmentId,
  });

  // Group records by employee
  const employeeMap = new Map<
    string,
    { employee: (typeof records)[0]["employee"]; records: typeof records }
  >();
  for (const record of records) {
    const existing = employeeMap.get(record.employee.id);
    if (existing) {
      existing.records.push(record);
    } else {
      employeeMap.set(record.employee.id, {
        employee: record.employee,
        records: [record],
      });
    }
  }
  const groupedData = Array.from(employeeMap.values());

  const isHRAdmin = ["HR_ADMIN", "SUPER_ADMIN"].includes(role);
  const allEmployees = isHRAdmin
    ? await prisma.employee.findMany({
        where: { isActive: true },
        select: { id: true, namaLengkap: true, nik: true },
        orderBy: { namaLengkap: "asc" },
      })
    : [];

  // Compute KPI stats
  const totalEmployees = groupedData.length;
  const totalPresent = groupedData.filter((g) =>
    g.records.some((r) => r.clockIn)
  ).length;
  const totalLateEmployees = groupedData.filter((g) =>
    g.records.some((r) => r.isLate)
  ).length;
  const totalLateCount = records.filter((r) => r.isLate).length;
  const totalOTMinutes = records.reduce((s, r) => s + r.overtimeMinutes, 0);
  const otHours = Math.floor(totalOTMinutes / 60);
  const otMins = totalOTMinutes % 60;
  const totalWorkMinutes = records.reduce((s, r) => s + r.totalMinutes, 0);
  const avgMinPerEmployee =
    totalEmployees > 0 ? Math.round(totalWorkMinutes / totalEmployees) : 0;
  const avgH = Math.floor(avgMinPerEmployee / 60);
  const avgM = avgMinPerEmployee % 60;

  return (
    <div
      className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
      aria-label="Halaman admin absensi"
    >
      {/* ─── Header ────────────────────────────────── */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
              aria-hidden="true"
            >
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Admin Absensi
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Rekap bulanan{" "}
            {role === "MANAGER"
              ? "departemen Anda"
              : "seluruh karyawan perusahaan"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AttendanceFilters />
          {isHRAdmin && <ExportButtons month={month} year={year} />}
          {isHRAdmin && <ManualRecordDialog employees={allEmployees} />}
        </div>
      </header>

      {/* ─── KPI Summary ──────────────────────────── */}
      <section
        aria-label="Ringkasan statistik absensi"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        <SummaryTile
          icon={Users2}
          label="Total Karyawan"
          value={totalEmployees}
          tone="emerald"
        />
        <SummaryTile
          icon={UserCheck}
          label="Pernah Hadir"
          value={totalPresent}
          tone="sky"
        />
        <SummaryTile
          icon={AlertTriangle}
          label="Pernah Terlambat"
          value={`${totalLateEmployees} (${totalLateCount}x)`}
          tone={totalLateCount > 0 ? "amber" : "slate"}
        />
        <SummaryTile
          icon={Timer}
          label="Rata-rata Jam"
          value={avgMinPerEmployee > 0 ? `${avgH}j ${avgM}m` : "\u2014"}
          tone="violet"
        />
        <SummaryTile
          icon={TrendingUp}
          label="Total Lembur"
          value={totalOTMinutes > 0 ? `${otHours}j ${otMins}m` : "\u2014"}
          tone="slate"
        />
      </section>

      {/* ─── Table ────────────────────────────────── */}
      <AttendanceSummaryTable
        data={groupedData}
        isHRAdmin={isHRAdmin}
        employees={allEmployees}
      />
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
