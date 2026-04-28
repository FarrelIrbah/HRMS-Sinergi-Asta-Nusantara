import { redirect } from "next/navigation";
import {
  CalendarOff,
  CalendarCheck2,
  CalendarClock,
  CalendarX2,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getLeaveBalances,
  getLeaveRequests,
  ensureLeaveBalances,
} from "@/lib/services/leave.service";
import { Card, CardContent } from "@/components/ui/card";
import { SummaryTile } from "@/components/shared/summary-tile";
import { LeaveBalanceCard } from "./_components/leave-balance-card";
import { LeaveRequestSection } from "./_components/leave-request-section";
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
    select: {
      id: true,
      name: true,
      annualQuota: true,
      isPaid: true,
      genderRestriction: true,
    },
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
    (r) => r.status === "PENDING_MANAGER" || r.status === "PENDING_HR"
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
    leaveType: r.leaveType,
    managerApprovedAt: r.managerApprovedAt?.toISOString() ?? null,
    managerNotes: r.managerNotes,
    managerApprovedBy: r.managerApprovedBy,
    hrApprovedAt: r.hrApprovedAt?.toISOString() ?? null,
    hrNotes: r.hrNotes,
    hrApprovedBy: r.hrApprovedBy,
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
          value={totalRemaining}
          suffix="hari"
          tone="emerald"
        />
        <SummaryTile
          icon={CalendarX2}
          label="Terpakai"
          value={totalUsed}
          suffix="hari"
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
          value={totalAllocated}
          suffix="hari"
          tone="violet"
        />
      </section>

      {/* ─── Balance Cards ─────────────────────────── */}
      <LeaveBalanceCard balances={serializedBalances} leaveTypes={leaveTypes} />

      {/* ─── Request Form + Info Panel ─────────────── */}
      <LeaveRequestSection
        leaveTypes={leaveTypes}
        balances={serializedBalances}
      />

      {/* ─── History Table ─────────────────────────── */}
      <LeaveHistoryTable requests={serializedRequests} />
    </div>
  );
}

