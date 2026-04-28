import { redirect } from "next/navigation";
import { FileBarChart } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLeaveRequests } from "@/lib/services/leave.service";
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
import {
  LeaveReportKpiCards,
  type LeaveReportKpis,
} from "./_components/leave-report-kpi-cards";
import { LeaveReportFilters } from "./_components/leave-report-filters";
import {
  LeaveReportTrendChart,
  type MonthlyTrendPoint,
} from "./_components/leave-report-trend-chart";

interface PageProps {
  searchParams: Promise<{ year?: string; departmentId?: string }>;
}

interface LeaveRequestLite {
  employeeId: string;
  status: string;
  workingDays: number;
  startDate: Date;
  employee: {
    namaLengkap: string;
    nik: string;
    department: { name: string };
  };
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function computeKpis(requests: LeaveRequestLite[]): LeaveReportKpis {
  const employees = new Set(requests.map((r) => r.employeeId));
  let approvedDays = 0;
  let pending = 0;
  let rejected = 0;
  for (const r of requests) {
    if (r.status === "APPROVED") approvedDays += r.workingDays;
    else if (r.status === "PENDING_MANAGER" || r.status === "PENDING_HR")
      pending++;
    else if (r.status === "REJECTED") rejected++;
  }
  return { employees: employees.size, approvedDays, pending, rejected };
}

function computeMonthlyTrend(
  requests: LeaveRequestLite[]
): MonthlyTrendPoint[] {
  const buckets: MonthlyTrendPoint[] = MONTH_LABELS.map((label) => ({
    label,
    approved: 0,
    pending: 0,
    rejected: 0,
  }));
  for (const r of requests) {
    const month = new Date(r.startDate).getMonth();
    if (month < 0 || month > 11) continue;
    if (r.status === "APPROVED") buckets[month].approved += r.workingDays;
    else if (r.status === "PENDING_MANAGER" || r.status === "PENDING_HR")
      buckets[month].pending += r.workingDays;
    else if (r.status === "REJECTED") buckets[month].rejected += r.workingDays;
  }
  return buckets;
}

export default async function LeaveReportPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!["HR_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/leave");
  }

  const sp = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = Number(sp.year ?? currentYear);
  const departmentId =
    sp.departmentId && sp.departmentId !== "_all"
      ? sp.departmentId
      : undefined;

  const [currentRequests, priorRequests, departments] = await Promise.all([
    getLeaveRequests({ year, departmentId, status: "_all" }),
    getLeaveRequests({ year: year - 1, departmentId, status: "_all" }),
    prisma.department.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  // Group by employee for table
  const employeeMap = new Map<
    string,
    {
      namaLengkap: string;
      nik: string;
      department: string;
      approved: number;
      pending: number;
      rejected: number;
    }
  >();

  for (const req of currentRequests) {
    const isPending =
      req.status === "PENDING_MANAGER" || req.status === "PENDING_HR";
    const existing = employeeMap.get(req.employeeId);
    if (existing) {
      if (req.status === "APPROVED") existing.approved += req.workingDays;
      if (isPending) existing.pending++;
      if (req.status === "REJECTED") existing.rejected++;
    } else {
      employeeMap.set(req.employeeId, {
        namaLengkap: req.employee.namaLengkap,
        nik: req.employee.nik,
        department: req.employee.department.name,
        approved: req.status === "APPROVED" ? req.workingDays : 0,
        pending: isPending ? 1 : 0,
        rejected: req.status === "REJECTED" ? 1 : 0,
      });
    }
  }

  const summary = Array.from(employeeMap.values()).sort((a, b) =>
    a.namaLengkap.localeCompare(b.namaLengkap)
  );

  const currentKpis = computeKpis(currentRequests);
  const priorKpis = computeKpis(priorRequests);
  const monthlyTrend = computeMonthlyTrend(currentRequests);

  // Max approved days across employees (for inline bar visualization)
  const maxApproved = summary.reduce((m, e) => Math.max(m, e.approved), 0);

  return (
    <div
      className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
      aria-label="Halaman laporan cuti"
    >
      {/* ─── Header ────────────────────────────────── */}
      <header>
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
            aria-hidden="true"
          >
            <FileBarChart className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Laporan Penggunaan Cuti
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Tahun {year}{" "}
          {departmentId ? "— departemen terpilih" : "— semua departemen"}
        </p>
      </header>

      {/* ─── Filter Bar ────────────────────────────── */}
      <LeaveReportFilters
        departments={departments}
        defaultYear={currentYear}
        resultCount={summary.length}
      />

      {/* ─── KPI Summary ──────────────────────────── */}
      <LeaveReportKpiCards
        current={currentKpis}
        previous={priorKpis}
        year={year}
      />

      {/* ─── Monthly Trend Chart ───────────────────── */}
      <LeaveReportTrendChart data={monthlyTrend} year={year} />

      {/* ─── Summary Table ─────────────────────────── */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {summary.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-500">
                Tidak ada data cuti untuk periode ini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="[&_td:first-child]:pl-6 [&_td:last-child]:pr-6 [&_th:first-child]:pl-6 [&_th:last-child]:pr-6">
                <TableHeader>
                  <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
                    <TableHead className="text-xs font-semibold text-slate-600">
                      NIK
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">
                      Nama
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">
                      Departemen
                    </TableHead>
                    <TableHead className="pr-6 text-right text-xs font-semibold text-slate-600">
                      Disetujui (hari)
                    </TableHead>
                    <TableHead className="text-center text-xs font-semibold text-slate-600">
                      Menunggu
                    </TableHead>
                    <TableHead className="text-center text-xs font-semibold text-slate-600">
                      Ditolak
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.map((emp, idx) => (
                    <TableRow
                      key={emp.nik}
                      className={cn(
                        "transition-colors hover:bg-emerald-50/30",
                        idx % 2 === 1 && "bg-slate-50/40"
                      )}
                    >
                      <TableCell className="font-mono text-xs text-slate-700">
                        {emp.nik}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {emp.namaLengkap}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {emp.department}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <ApprovedBar
                          value={emp.approved}
                          max={maxApproved}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <CountChip value={emp.pending} tone="amber" />
                      </TableCell>
                      <TableCell className="text-center">
                        <CountChip value={emp.rejected} tone="rose" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────── Sub-components ───────────────────

function ApprovedBar({ value, max }: { value: number; max: number }) {
  if (value === 0) {
    return <span className="text-sm text-slate-400">—</span>;
  }
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="ml-auto flex w-full max-w-[120px] items-center gap-2">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-emerald-400"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-sm font-medium tabular-nums text-slate-700">
        {value}
      </span>
    </div>
  );
}

function CountChip({
  value,
  tone,
}: {
  value: number;
  tone: "amber" | "rose";
}) {
  if (value === 0) {
    return <span className="text-sm text-slate-400">—</span>;
  }
  const dotClass = tone === "amber" ? "bg-amber-400" : "bg-rose-400";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
      <span
        aria-hidden="true"
        className={cn("h-1.5 w-1.5 rounded-full", dotClass)}
      />
      {value}
    </span>
  );
}
