import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Wallet,
  Users2,
  TrendingUp,
  TrendingDown,
  Banknote,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getPayrollRunDetail } from "@/lib/services/payroll.service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SummaryTile } from "@/components/shared/summary-tile";
import { PayrollEntryTable } from "./_components/payroll-entry-table";
import { FinalizeButton } from "./_components/finalize-button";
import type { SerializedPayrollEntry } from "./_components/payroll-entry-table";

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

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRupiahCompact(value: number): string {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  }
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1)} jt`;
  }
  return formatRupiah(value);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ periodId: string }>;
}

export default async function PayrollPeriodPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (!["HR_ADMIN", "SUPER_ADMIN"].includes(role)) {
    redirect("/dashboard");
  }

  const { periodId } = await params;
  const run = await getPayrollRunDetail(periodId);

  if (!run) {
    notFound();
  }

  // Serialize Prisma Decimal fields to plain numbers for client components
  const serializedEntries: SerializedPayrollEntry[] = run.entries.map((e) => ({
    id: e.id,
    employeeId: e.employeeId,
    employeeNik: e.employeeNik,
    employeeName: e.employeeName,
    baseSalary: Number(e.baseSalary),
    totalAllowances: Number(e.totalAllowances),
    overtimePay: Number(e.overtimePay),
    absenceDeduction: Number(e.absenceDeduction),
    thrAmount: Number(e.thrAmount),
    grossPay: Number(e.grossPay),
    bpjsKesEmp: Number(e.bpjsKesEmp),
    bpjsKesEmpr: Number(e.bpjsKesEmpr),
    bpjsJhtEmp: Number(e.bpjsJhtEmp),
    bpjsJhtEmpr: Number(e.bpjsJhtEmpr),
    bpjsJpEmp: Number(e.bpjsJpEmp),
    bpjsJpEmpr: Number(e.bpjsJpEmpr),
    bpjsJkk: Number(e.bpjsJkk),
    bpjsJkm: Number(e.bpjsJkm),
    pph21: Number(e.pph21),
    totalDeductions: Number(e.totalDeductions),
    netPay: Number(e.netPay),
  }));

  // Summary totals computed server-side
  const totalGross = serializedEntries.reduce((s, e) => s + e.grossPay, 0);
  const totalDeductions = serializedEntries.reduce(
    (s, e) => s + e.totalDeductions,
    0
  );
  const totalNet = serializedEntries.reduce((s, e) => s + e.netPay, 0);

  const periodLabel = formatPeriod(run.month, run.year);
  const isFinalized = run.status === "FINALIZED";

  return (
    <div
      className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
      aria-label={`Detail penggajian periode ${periodLabel}`}
    >
      {/* ─── Breadcrumb ──────────────────────────── */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-sm text-slate-500"
      >
        <Link
          href="/payroll"
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Penggajian
        </Link>
        <span aria-hidden="true" className="text-slate-300">/</span>
        <span className="font-medium text-slate-700">{periodLabel}</span>
      </nav>

      {/* ─── Header ────────────────────────────────── */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
              aria-hidden="true"
            >
              <Wallet className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {periodLabel}
            </h1>
            {isFinalized ? (
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
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {isFinalized
              ? "Periode ini sudah difinalisasi dan tidak dapat diubah."
              : "Periode ini masih DRAFT — dapat dihitung ulang sebelum finalisasi."}
          </p>
        </div>

        {!isFinalized && <FinalizeButton runId={run.id} />}
      </header>

      {/* ─── KPI Summary ──────────────────────────── */}
      <section
        aria-label="Ringkasan penggajian periode"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <SummaryTile
          icon={Users2}
          label="Jumlah Karyawan"
          value={run._count.entries}
          tone="emerald"
        />
        <SummaryTile
          icon={TrendingUp}
          label="Total Bruto"
          value={formatRupiahCompact(totalGross)}
          title={formatRupiah(totalGross)}
          tone="sky"
        />
        <SummaryTile
          icon={TrendingDown}
          label="Total Potongan"
          value={formatRupiahCompact(totalDeductions)}
          title={formatRupiah(totalDeductions)}
          tone={totalDeductions > 0 ? "amber" : "slate"}
        />
        <SummaryTile
          icon={Banknote}
          label="Total Bersih"
          value={formatRupiahCompact(totalNet)}
          title={formatRupiah(totalNet)}
          tone="violet"
        />
      </section>

      {/* ─── Entry Table ────────────────────────────── */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <PayrollEntryTable
            entries={serializedEntries}
            runId={run.id}
            runStatus={run.status}
            isHRAdmin={["HR_ADMIN", "SUPER_ADMIN"].includes(role)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

