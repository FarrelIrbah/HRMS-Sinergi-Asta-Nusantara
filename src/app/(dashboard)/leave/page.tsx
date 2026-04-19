import { redirect } from "next/navigation";
import {
  CalendarOff,
  CalendarCheck2,
  CalendarClock,
  CalendarX2,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getLeaveBalances,
  getLeaveRequests,
  ensureLeaveBalances,
} from "@/lib/services/leave.service";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LeaveBalanceCard } from "./_components/leave-balance-card";
import { LeaveRequestForm } from "./_components/leave-request-form";
import { LeaveHistoryTable } from "./_components/leave-history-table";

export default async function LeavePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id },
    select: { id: true, namaLengkap: true, isActive: true },
  });

  if (!employee) {
    return (
      <div className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6">
        <header className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
            aria-hidden="true"
          >
            <CalendarOff className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Cuti
          </h1>
        </header>
        <Card className="border-slate-200">
          <CardContent className="py-12 text-center">
            <p className="text-sm text-slate-500">
              Anda tidak memiliki profil karyawan. Hubungi HR Admin untuk
              pengaturan profil.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  await ensureLeaveBalances(employee.id);

  const currentYear = new Date().getFullYear();

  const leaveTypes = await prisma.leaveType.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, annualQuota: true },
  });

  const [balances, requests] = await Promise.all([
    getLeaveBalances(employee.id, currentYear),
    getLeaveRequests({ employeeId: employee.id, year: currentYear }),
  ]);

  // Compute summary stats
  const totalAllocated = balances.reduce(
    (s, b) => s + b.allocatedDays,
    0
  );
  const totalUsed = balances.reduce((s, b) => s + b.usedDays, 0);
  const totalRemaining = totalAllocated - totalUsed;
  const pendingCount = requests.filter(
    (r) => r.status === "PENDING"
  ).length;

  // Serialize dates for client components
  const serializedRequests = requests.map((r) => ({
    id: r.id,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    workingDays: r.workingDays,
    status: r.status,
    reason: r.reason,
    createdAt: r.createdAt.toISOString(),
    approvedAt: r.approvedAt?.toISOString() ?? null,
    approverNotes: r.approverNotes,
    leaveType: r.leaveType,
    approvedBy: r.approvedBy,
  }));

  const serializedBalances = balances.map((b) => ({
    leaveTypeId: b.leaveTypeId,
    allocatedDays: b.allocatedDays,
    usedDays: b.usedDays,
    leaveType: b.leaveType,
  }));

  return (
    <div
      className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
      aria-label="Halaman cuti"
    >
      {/* ─── Header ────────────────────────────────── */}
      <header>
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
            aria-hidden="true"
          >
            <CalendarOff className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Cuti
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Kelola pengajuan cuti dan lihat saldo cuti Anda
        </p>
      </header>

      {/* ─── KPI Summary ──────────────────────────── */}
      <section
        aria-label="Ringkasan cuti"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <SummaryTile
          icon={CalendarCheck2}
          label="Sisa Cuti"
          value={`${totalRemaining} hari`}
          tone="emerald"
        />
        <SummaryTile
          icon={CalendarX2}
          label="Terpakai"
          value={`${totalUsed} hari`}
          tone="sky"
        />
        <SummaryTile
          icon={CalendarClock}
          label="Menunggu Approval"
          value={pendingCount}
          tone={pendingCount > 0 ? "amber" : "slate"}
        />
        <SummaryTile
          icon={CalendarOff}
          label="Total Alokasi"
          value={`${totalAllocated} hari`}
          tone="violet"
        />
      </section>

      {/* ─── Balance Cards ─────────────────────────── */}
      <LeaveBalanceCard balances={serializedBalances} leaveTypes={leaveTypes} />

      {/* ─── Request Form ──────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <LeaveRequestForm
          leaveTypes={leaveTypes}
          balances={serializedBalances}
        />
      </div>

      {/* ─── History Table ─────────────────────────── */}
      <LeaveHistoryTable requests={serializedRequests} />
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
