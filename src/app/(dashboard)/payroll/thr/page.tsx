import { redirect } from "next/navigation";
import {
  Gift,
  Users2,
  CheckCircle2,
  Banknote,
  CalendarCheck2,
  Info,
  PlusCircle,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Decimal from "decimal.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { THRTable, type SerializedTHRResult } from "./_components/thr-table";
import { AddTHRForm } from "./_components/add-thr-form";
import { calculateEmployeeTHR } from "@/lib/services/thr.service";
import type { Religion } from "@/types/enums";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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

export default async function THRPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (!["HR_ADMIN", "SUPER_ADMIN"].includes(role)) {
    redirect("/dashboard");
  }

  // Fetch all active employees with salary, fixed allowances, joinDate, and agama
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    select: {
      id: true,
      nik: true,
      namaLengkap: true,
      baseSalary: true,
      joinDate: true,
      agama: true,
      allowances: {
        where: { isFixed: true },
        select: { amount: true },
      },
    },
    orderBy: { namaLengkap: "asc" },
  });

  // Reference date: today (first of current month for consistency with payroll runs)
  const referenceDate = new Date();

  // Calculate THR for each employee
  const thrResults: SerializedTHRResult[] = employees.map((emp) => {
    const baseSalary = new Decimal(emp.baseSalary.toString());
    const fixedAllowancesTotal = emp.allowances.reduce(
      (sum, a) => sum.plus(new Decimal(a.amount.toString())),
      new Decimal(0)
    );

    // Employees without agama are treated as not eligible
    if (!emp.agama) {
      return {
        employeeId: emp.id,
        employeeNik: emp.nik,
        employeeName: emp.namaLengkap,
        religion: "—",
        holidayName: "—",
        serviceMonths: 0,
        thrAmount: 0,
        isEligible: false,
        calculationNote: "Agama tidak tercatat — tidak dapat menghitung THR",
      };
    }

    const result = calculateEmployeeTHR({
      joinDate: emp.joinDate,
      referenceDate,
      baseSalary,
      fixedAllowancesTotal,
      religion: emp.agama as Religion,
    });

    return {
      employeeId: emp.id,
      employeeNik: emp.nik,
      employeeName: emp.namaLengkap,
      religion: emp.agama,
      holidayName: result.holidayName,
      serviceMonths: result.serviceMonths,
      thrAmount: Number(result.thrAmount.toNumber()),
      isEligible: result.isEligible,
      calculationNote: result.calculationNote,
    };
  });

  // Summary totals
  const eligibleResults = thrResults.filter((r) => r.isEligible);
  const totalTHR = eligibleResults.reduce((sum, r) => sum + r.thrAmount, 0);
  const eligibleCount = eligibleResults.length;
  const formattedRefDate = referenceDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
      aria-label="Halaman hitung THR"
    >
      {/* ─── Header ────────────────────────────────── */}
      <header>
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
            aria-hidden="true"
          >
            <Gift className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Hitung THR
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Tunjangan Hari Raya berdasarkan Permenaker No. 6/2016 — referensi{" "}
          {formattedRefDate}
        </p>
      </header>

      {/* ─── KPI Summary ──────────────────────────── */}
      <section
        aria-label="Ringkasan THR"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <SummaryTile
          icon={Users2}
          label="Karyawan Aktif"
          value={thrResults.length}
          tone="emerald"
        />
        <SummaryTile
          icon={CheckCircle2}
          label="Berhak THR"
          value={eligibleCount}
          tone={eligibleCount > 0 ? "sky" : "slate"}
        />
        <SummaryTile
          icon={Banknote}
          label="Total THR Layak"
          value={formatRupiahCompact(totalTHR)}
          title={formatRupiah(totalTHR)}
          tone={totalTHR > 0 ? "violet" : "slate"}
        />
        <SummaryTile
          icon={CalendarCheck2}
          label="Tanggal Referensi"
          value={formattedRefDate}
          tone="slate"
        />
      </section>

      {/* ─── Info Card ─────────────────────────────── */}
      <Card className="border-sky-200 bg-sky-50/50 shadow-sm">
        <CardContent className="flex gap-3 p-4">
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 ring-1 ring-sky-200"
            aria-hidden="true"
          >
            <Info className="h-4 w-4" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-sky-900">
              Dasar Perhitungan THR
            </p>
            <ul className="space-y-1 text-sm text-sky-800">
              <li className="flex gap-2">
                <span aria-hidden="true" className="text-sky-400">•</span>
                <span>
                  <strong className="font-semibold">Basis:</strong> Gaji pokok +
                  tunjangan tetap (isFixed=true)
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden="true" className="text-sky-400">•</span>
                <span>
                  <strong className="font-semibold">Masa kerja ≥ 12 bulan:</strong>{" "}
                  1× gaji sebulan
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden="true" className="text-sky-400">•</span>
                <span>
                  <strong className="font-semibold">Masa kerja 1–11 bulan:</strong>{" "}
                  (masa kerja / 12) × gaji sebulan (proporsional)
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden="true" className="text-sky-400">•</span>
                <span>
                  <strong className="font-semibold">Masa kerja &lt; 1 bulan:</strong>{" "}
                  Tidak berhak THR
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* ─── Add THR to Payroll Run ──────────────── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600"
              aria-hidden="true"
            >
              <PlusCircle className="h-3.5 w-3.5" />
            </div>
            Tambahkan THR ke Penggajian
          </CardTitle>
          <p className="text-sm text-slate-500">
            Pilih periode penggajian DRAFT yang akan ditambahkan komponen THR.
            Pastikan penggajian bulan tersebut sudah dihitung terlebih dahulu.
          </p>
        </CardHeader>
        <CardContent>
          <AddTHRForm />
        </CardContent>
      </Card>

      {/* ─── THR Eligibility Table ───────────────── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-50 text-violet-600"
              aria-hidden="true"
            >
              <ListChecks className="h-3.5 w-3.5" />
            </div>
            Kelayakan THR Karyawan
          </CardTitle>
          <p className="text-sm text-slate-500">
            Perhitungan THR untuk semua karyawan aktif
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <THRTable thrResults={thrResults} />
        </CardContent>
      </Card>

      {/* ─── Total THR Layak Summary ──────────────── */}
      {thrResults.length > 0 && (
        <Card
          className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm"
          aria-label="Ringkasan total THR"
        >
          <CardContent className="p-0">
            <div className="grid grid-cols-1 divide-slate-200 sm:grid-cols-3 sm:divide-x">
              {/* Total THR */}
              <div className="flex items-center gap-3 p-5">
                <div
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
                  aria-hidden="true"
                >
                  <Banknote className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                    Total THR Layak
                  </p>
                  <p className="truncate text-2xl font-bold tabular-nums leading-tight text-emerald-900">
                    {formatRupiah(totalTHR)}
                  </p>
                </div>
              </div>

              {/* Berhak */}
              <div className="flex items-center gap-3 border-t border-slate-200 p-5 sm:border-t-0">
                <div
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  aria-hidden="true"
                >
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Berhak THR
                  </p>
                  <p className="text-2xl font-bold tabular-nums leading-tight text-slate-900">
                    {eligibleCount}{" "}
                    <span className="text-sm font-medium text-slate-500">
                      karyawan
                    </span>
                  </p>
                </div>
              </div>

              {/* Tidak Berhak */}
              <div className="flex items-center gap-3 border-t border-slate-200 p-5 sm:border-t-0">
                <div
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 ring-1 ring-slate-200"
                  aria-hidden="true"
                >
                  <Users2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Tidak Berhak
                  </p>
                  <p className="text-2xl font-bold tabular-nums leading-tight text-slate-900">
                    {thrResults.length - eligibleCount}{" "}
                    <span className="text-sm font-medium text-slate-500">
                      karyawan
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="border-t border-slate-200 bg-white/60 px-5 py-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">
                  Rasio kelayakan
                </span>
                <span className="text-xs font-semibold tabular-nums text-emerald-700">
                  {Math.round((eligibleCount / thrResults.length) * 100)}%
                </span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
                role="progressbar"
                aria-valuenow={eligibleCount}
                aria-valuemin={0}
                aria-valuemax={thrResults.length}
                aria-label={`${eligibleCount} dari ${thrResults.length} karyawan berhak THR`}
              >
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: `${(eligibleCount / thrResults.length) * 100}%`,
                  }}
                />
              </div>
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
  title,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  tone: Tone;
  title?: string;
}) {
  const t = TONE_MAP[tone];
  return (
    <Card className="border-slate-200 shadow-sm" title={title}>
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
          <p className="truncate text-lg font-bold tabular-nums leading-tight text-slate-900">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
