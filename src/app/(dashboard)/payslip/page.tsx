import { redirect } from "next/navigation";
import {
  ReceiptText,
  FileDown,
  FileCheck2,
  CalendarRange,
  Users2,
  Clock,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { SummaryTile } from "@/components/shared/summary-tile";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS_ID = [
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
  return `${MONTHS_ID[month - 1]} ${year}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PayslipPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN / HR VIEW — all employees' finalized payslips
  // ═══════════════════════════════════════════════════════════════════
  if (role === "HR_ADMIN" || role === "SUPER_ADMIN") {
    const allEntries = await prisma.payrollEntry.findMany({
      where: { payrollRun: { status: "FINALIZED" } },
      include: {
        payrollRun: { select: { month: true, year: true } },
      },
      orderBy: [
        { payrollRun: { year: "desc" } },
        { payrollRun: { month: "desc" } },
        { employeeName: "asc" },
      ],
    });

    // KPIs
    const totalSlips = allEntries.length;
    const distinctPeriods = new Set(
      allEntries.map((e) => `${e.payrollRun.year}-${e.payrollRun.month}`)
    ).size;
    const distinctEmployees = new Set(allEntries.map((e) => e.employeeId)).size;
    const latestPeriod = allEntries[0]
      ? formatPeriod(
          allEntries[0].payrollRun.month,
          allEntries[0].payrollRun.year
        )
      : "—";

    return (
      <div
        className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
        aria-label="Halaman slip gaji karyawan"
      >
        {/* Header */}
        <header>
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
              aria-hidden="true"
            >
              <ReceiptText className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Slip Gaji Karyawan
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Unduh slip gaji semua karyawan dari periode yang telah
            difinalisasi
          </p>
        </header>

        {/* KPI Summary */}
        <section
          aria-label="Ringkasan slip gaji"
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <SummaryTile
            icon={FileCheck2}
            label="Total Slip"
            value={totalSlips}
            tone="emerald"
          />
          <SummaryTile
            icon={CalendarRange}
            label="Periode"
            value={distinctPeriods}
            tone="sky"
          />
          <SummaryTile
            icon={Users2}
            label="Karyawan"
            value={distinctEmployees}
            tone="violet"
          />
          <SummaryTile
            icon={Clock}
            label="Periode Terbaru"
            value={latestPeriod}
            tone="slate"
          />
        </section>

        {/* Table */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600"
                aria-hidden="true"
              >
                <ReceiptText className="h-3.5 w-3.5" />
              </div>
              Riwayat Slip Gaji
            </CardTitle>
            <p className="text-sm text-slate-500">
              Hanya periode yang sudah difinalisasi yang tersedia untuk diunduh
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {allEntries.length === 0 ? (
              <EmptyState
                title="Belum ada slip gaji tersedia"
                description="Jalankan dan finalisasi penggajian terlebih dahulu."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[840px]">
                  <TableHeader>
                    <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
                      <TableHead className="w-[180px] pl-6 text-xs font-semibold text-slate-600">
                        Periode
                      </TableHead>
                      <TableHead className="w-[150px] text-xs font-semibold text-slate-600">
                        NIK
                      </TableHead>
                      <TableHead className="min-w-[220px] text-xs font-semibold text-slate-600">
                        Nama Karyawan
                      </TableHead>
                      <TableHead className="w-[140px] text-xs font-semibold text-slate-600">
                        Status
                      </TableHead>
                      <TableHead className="w-[150px] pr-6 text-right text-xs font-semibold text-slate-600">
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allEntries.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-slate-50/50">
                        <TableCell className="pl-6 font-medium text-slate-900">
                          {formatPeriod(
                            entry.payrollRun.month,
                            entry.payrollRun.year
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-700">
                          {entry.employeeNik}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {entry.employeeName}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-emerald-300 text-xs text-emerald-700"
                          >
                            Difinalisasi
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <a
                            href={`/api/payroll/payslip/${entry.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Unduh PDF slip gaji ${entry.employeeName} periode ${formatPeriod(entry.payrollRun.month, entry.payrollRun.year)}`}
                            className={cn(
                              buttonVariants({
                                variant: "outline",
                                size: "sm",
                              }),
                              "gap-1.5 border-slate-200 text-xs"
                            )}
                          >
                            <FileDown
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            Unduh PDF
                          </a>
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

  // ═══════════════════════════════════════════════════════════════════
  // EMPLOYEE / MANAGER VIEW — personal payslip history
  // ═══════════════════════════════════════════════════════════════════
  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id },
  });

  if (!employee) {
    return (
      <div
        className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
        aria-label="Halaman slip gaji"
      >
        <header>
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
              aria-hidden="true"
            >
              <ReceiptText className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Slip Gaji Saya
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Riwayat slip gaji Anda
          </p>
        </header>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="text-sm text-slate-500">
              Profil karyawan tidak ditemukan. Hubungi HR Admin untuk
              pengaturan profil.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const payrollEntries = await prisma.payrollEntry.findMany({
    where: {
      employeeId: employee.id,
      payrollRun: { status: "FINALIZED" },
    },
    include: {
      payrollRun: {
        select: { month: true, year: true, status: true },
      },
    },
    orderBy: [
      { payrollRun: { year: "desc" } },
      { payrollRun: { month: "desc" } },
    ],
  });

  // KPIs for employee
  const totalSlips = payrollEntries.length;
  const latestPeriod = payrollEntries[0]
    ? formatPeriod(
        payrollEntries[0].payrollRun.month,
        payrollEntries[0].payrollRun.year
      )
    : "—";
  const earliestPeriod = payrollEntries[payrollEntries.length - 1]
    ? formatPeriod(
        payrollEntries[payrollEntries.length - 1].payrollRun.month,
        payrollEntries[payrollEntries.length - 1].payrollRun.year
      )
    : "—";

  return (
    <div
      className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
      aria-label="Halaman slip gaji saya"
    >
      {/* Header */}
      <header>
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
            aria-hidden="true"
          >
            <ReceiptText className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Slip Gaji Saya
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Daftar slip gaji yang tersedia untuk diunduh
        </p>
      </header>

      {/* KPI Summary */}
      <section
        aria-label="Ringkasan slip gaji saya"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <SummaryTile
          icon={FileCheck2}
          label="Total Slip Tersedia"
          value={totalSlips}
          tone="emerald"
        />
        <SummaryTile
          icon={Clock}
          label="Periode Terbaru"
          value={latestPeriod}
          tone="sky"
        />
        <SummaryTile
          icon={CalendarRange}
          label="Periode Terlama"
          value={earliestPeriod}
          tone="violet"
        />
      </section>

      {/* Payslip List */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600"
              aria-hidden="true"
            >
              <ReceiptText className="h-3.5 w-3.5" />
            </div>
            Riwayat Slip Gaji
          </CardTitle>
          <p className="text-sm text-slate-500">
            Hanya slip gaji dari periode yang telah difinalisasi yang dapat
            diunduh
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {payrollEntries.length === 0 ? (
            <EmptyState
              title="Belum ada slip gaji tersedia"
              description="Slip gaji akan muncul setelah HR menfinalisasi penggajian bulan Anda."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[560px]">
                <TableHeader>
                  <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
                    <TableHead className="min-w-[240px] pl-6 text-xs font-semibold text-slate-600">
                      Periode
                    </TableHead>
                    <TableHead className="w-[160px] text-xs font-semibold text-slate-600">
                      Status
                    </TableHead>
                    <TableHead className="w-[160px] pr-6 text-right text-xs font-semibold text-slate-600">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollEntries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-slate-50/50">
                      <TableCell className="pl-6 font-medium text-slate-900">
                        {formatPeriod(
                          entry.payrollRun.month,
                          entry.payrollRun.year
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-emerald-300 text-xs text-emerald-700"
                        >
                          Difinalisasi
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <a
                          href={`/api/payroll/payslip/${entry.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Unduh PDF slip gaji periode ${formatPeriod(entry.payrollRun.month, entry.payrollRun.year)}`}
                          className={cn(
                            buttonVariants({
                              variant: "outline",
                              size: "sm",
                            }),
                            "gap-1.5 border-slate-200 text-xs"
                          )}
                        >
                          <FileDown
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          Unduh PDF
                        </a>
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

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="py-12 text-center">
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"
        aria-hidden="true"
      >
        <ReceiptText className="h-6 w-6" />
      </div>
      <p className="mt-3 text-sm font-medium text-slate-700">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

