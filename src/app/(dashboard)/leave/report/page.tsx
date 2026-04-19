import { redirect } from "next/navigation";
import {
  FileBarChart,
  Users2,
  CalendarCheck2,
  Clock,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLeaveRequests } from "@/lib/services/leave.service";
import { Badge } from "@/components/ui/badge";
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

interface PageProps {
  searchParams: Promise<{ year?: string; departmentId?: string }>;
}

export default async function LeaveReportPage({
  searchParams,
}: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!["HR_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/leave");
  }

  const sp = await searchParams;
  const year = Number(sp.year ?? new Date().getFullYear());
  const departmentId =
    sp.departmentId && sp.departmentId !== "_all"
      ? sp.departmentId
      : undefined;

  const [requests] = await Promise.all([
    getLeaveRequests({ year, departmentId, status: "_all" }),
  ]);

  // Group by employee for summary
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

  for (const req of requests) {
    const existing = employeeMap.get(req.employeeId);
    if (existing) {
      if (req.status === "APPROVED") existing.approved += req.workingDays;
      if (req.status === "PENDING") existing.pending++;
      if (req.status === "REJECTED") existing.rejected++;
    } else {
      employeeMap.set(req.employeeId, {
        namaLengkap: req.employee.namaLengkap,
        nik: req.employee.nik,
        department: req.employee.department.name,
        approved: req.status === "APPROVED" ? req.workingDays : 0,
        pending: req.status === "PENDING" ? 1 : 0,
        rejected: req.status === "REJECTED" ? 1 : 0,
      });
    }
  }

  const summary = Array.from(employeeMap.values()).sort((a, b) =>
    a.namaLengkap.localeCompare(b.namaLengkap)
  );

  // Compute stats
  const totalEmployees = summary.length;
  const totalApprovedDays = summary.reduce((s, e) => s + e.approved, 0);
  const totalPending = summary.reduce((s, e) => s + e.pending, 0);
  const totalRejected = summary.reduce((s, e) => s + e.rejected, 0);

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
          {departmentId ? "\u2014 departemen terpilih" : "\u2014 semua departemen"}
        </p>
      </header>

      {/* ─── KPI Summary ──────────────────────────── */}
      <section
        aria-label="Ringkasan laporan cuti"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <SummaryTile
          icon={Users2}
          label="Karyawan"
          value={totalEmployees}
          tone="emerald"
        />
        <SummaryTile
          icon={CalendarCheck2}
          label="Total Disetujui"
          value={`${totalApprovedDays} hari`}
          tone="sky"
        />
        <SummaryTile
          icon={Clock}
          label="Menunggu"
          value={totalPending}
          tone={totalPending > 0 ? "amber" : "slate"}
        />
        <SummaryTile
          icon={XCircle}
          label="Ditolak"
          value={totalRejected}
          tone={totalRejected > 0 ? "amber" : "slate"}
        />
      </section>

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
              <Table>
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
                    <TableHead className="text-right text-xs font-semibold text-slate-600">
                      Disetujui (hari)
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold text-slate-600">
                      Menunggu
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold text-slate-600">
                      Ditolak
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.map((emp) => (
                    <TableRow key={emp.nik}>
                      <TableCell className="font-mono text-xs text-slate-700">
                        {emp.nik}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {emp.namaLengkap}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {emp.department}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-slate-700">
                        {emp.approved}
                      </TableCell>
                      <TableCell className="text-right">
                        {emp.pending > 0 ? (
                          <Badge
                            variant="outline"
                            className="border-amber-300 text-xs text-amber-700"
                          >
                            {emp.pending}
                          </Badge>
                        ) : (
                          <span className="text-sm text-slate-400">
                            \u2014
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-slate-700">
                        {emp.rejected || "\u2014"}
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
