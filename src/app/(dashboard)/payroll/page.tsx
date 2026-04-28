import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Wallet,
  CalendarRange,
  FileCheck2,
  FileClock,
  Clock,
  ArrowRight,
  Calculator,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getPayrollRuns } from "@/lib/services/payroll.service";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SummaryTile } from "@/components/shared/summary-tile";
import { RunPayrollForm } from "./_components/run-payroll-form";



// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_LABELS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function formatPeriod(month: number, year: number): string {
  return `${MONTH_LABELS[month - 1]} ${year}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PayrollPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (!["HR_ADMIN", "SUPER_ADMIN"].includes(role)) {
    redirect("/dashboard");
  }

  const payrollRuns = await getPayrollRuns();

  // KPI aggregates
  const totalRuns = payrollRuns.length;
  const finalizedCount = payrollRuns.filter(
    (r) => r.status === "FINALIZED"
  ).length;
  const draftCount = payrollRuns.filter((r) => r.status === "DRAFT").length;
  const latestRun = payrollRuns[0];
  const latestLabel = latestRun
    ? formatPeriod(latestRun.month, latestRun.year)
    : "—";

  return (
    <div
      className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
      aria-label="Halaman penggajian"
    >
      {/* ─── Header ────────────────────────────────── */}
      <header>
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
            aria-hidden="true"
          >
            <Wallet className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Penggajian
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Kelola perhitungan dan finalisasi penggajian bulanan karyawan
        </p>
      </header>

      {/* ─── KPI Summary ──────────────────────────── */}
      <section
        aria-label="Ringkasan penggajian"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <SummaryTile
          icon={CalendarRange}
          label="Total Periode"
          value={totalRuns}
          tone="emerald"
        />
        <SummaryTile
          icon={FileCheck2}
          label="Difinalisasi"
          value={finalizedCount}
          tone="sky"
        />
        <SummaryTile
          icon={FileClock}
          label="Draft"
          value={draftCount}
          tone={draftCount > 0 ? "amber" : "slate"}
        />
        <SummaryTile
          icon={Clock}
          label="Periode Terbaru"
          value={latestLabel}
          tone="violet"
        />
      </section>

      {/* ─── Run Payroll Form ─────────────────────── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600"
              aria-hidden="true"
            >
              <Calculator className="h-3.5 w-3.5" />
            </div>
            Hitung Penggajian Bulan Baru
          </CardTitle>
          <p className="text-sm text-slate-500">
            Pilih bulan dan tahun lalu klik Hitung Gaji. Proses ini dapat
            diulang selama status masih DRAFT.
          </p>
        </CardHeader>
        <CardContent>
          <RunPayrollForm />
        </CardContent>
      </Card>

      {/* ─── Payroll Runs List ────────────────────── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-50 text-sky-600"
              aria-hidden="true"
            >
              <CalendarRange className="h-3.5 w-3.5" />
            </div>
            Riwayat Penggajian
          </CardTitle>
          <p className="text-sm text-slate-500">
            Daftar semua periode penggajian yang pernah dihitung
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {payrollRuns.length === 0 ? (
            <div className="py-12 text-center">
              <div
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"
                aria-hidden="true"
              >
                <CalendarRange className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-700">
                Belum ada data penggajian
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Gunakan form di atas untuk menghitung penggajian pertama.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
                    <TableHead className="min-w-[220px] pl-6 text-xs font-semibold text-slate-600">
                      Periode
                    </TableHead>
                    <TableHead className="w-[160px] text-xs font-semibold text-slate-600">
                      Status
                    </TableHead>
                    <TableHead className="w-[180px] text-right text-xs font-semibold text-slate-600">
                      Jumlah Karyawan
                    </TableHead>
                    <TableHead className="w-[72px] pr-6" aria-label="Aksi" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollRuns.map((run) => (
                    <TableRow key={run.id} className="hover:bg-slate-50/50">
                      <TableCell className="pl-6 font-medium text-slate-900">
                        <Link
                          href={`/payroll/${run.id}`}
                          className="hover:text-emerald-700"
                        >
                          {formatPeriod(run.month, run.year)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {run.status === "FINALIZED" ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-300 text-xs text-emerald-700"
                          >
                            Difinalisasi
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-300 text-xs text-amber-700"
                          >
                            Draft
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-slate-700">
                        {run._count.entries} karyawan
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Link
                          href={`/payroll/${run.id}`}
                          aria-label={`Buka detail ${formatPeriod(run.month, run.year)}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
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

