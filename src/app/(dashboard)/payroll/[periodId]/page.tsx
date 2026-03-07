import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPayrollRunDetail } from "@/lib/services/payroll.service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground">
        <Link href="/payroll" className="hover:text-foreground">
          Penggajian
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-foreground">{periodLabel}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{periodLabel}</h1>
          {run.status === "FINALIZED" ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              Difinalisasi
            </Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
              Draft
            </Badge>
          )}
        </div>

        {run.status === "DRAFT" && <FinalizeButton runId={run.id} />}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Gaji Bruto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatRupiah(totalGross)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Potongan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-red-600">
              {formatRupiah(totalDeductions)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Gaji Bersih
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-700">
              {formatRupiah(totalNet)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Entry Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Detail Gaji Karyawan ({run._count.entries} karyawan)
          </CardTitle>
        </CardHeader>
        <CardContent>
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
