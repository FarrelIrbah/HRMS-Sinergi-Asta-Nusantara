import { redirect } from "next/navigation";
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLeaveRequests } from "@/lib/services/leave.service";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LeaveApprovalTable } from "./_components/leave-approval-table";

interface PageProps {
  searchParams: Promise<{ status?: string; year?: string }>;
}

export default async function LeaveManagePage({
  searchParams,
}: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (!["HR_ADMIN", "SUPER_ADMIN", "MANAGER"].includes(role)) {
    redirect("/leave");
  }

  const sp = await searchParams;
  const statusFilter = sp.status ?? "PENDING";
  const yearFilter = Number(sp.year ?? new Date().getFullYear());

  let departmentId: string | undefined;
  if (role === "MANAGER") {
    const managerEmployee = await prisma.employee.findUnique({
      where: { userId: session.user.id },
      select: { departmentId: true },
    });
    departmentId = managerEmployee?.departmentId ?? undefined;
  }

  // Fetch all requests (for stats), then apply status filter for table
  const allRequests = await getLeaveRequests({
    departmentId,
    status: "_all",
    year: yearFilter,
  });

  const filteredRequests =
    statusFilter === "_all"
      ? allRequests
      : allRequests.filter((r) => r.status === statusFilter);

  // Compute stats
  const pendingCount = allRequests.filter(
    (r) => r.status === "PENDING"
  ).length;
  const approvedCount = allRequests.filter(
    (r) => r.status === "APPROVED"
  ).length;
  const rejectedCount = allRequests.filter(
    (r) => r.status === "REJECTED"
  ).length;
  const cancelledCount = allRequests.filter(
    (r) => r.status === "CANCELLED"
  ).length;

  // Serialize dates for client components
  const serialized = filteredRequests.map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    workingDays: r.workingDays,
    reason: r.reason,
    status: r.status as string,
    approverNotes: r.approverNotes,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    createdAt: r.createdAt.toISOString(),
    approvedAt: r.approvedAt?.toISOString() ?? null,
    leaveType: r.leaveType,
    employee: {
      id: r.employee.id,
      nik: r.employee.nik,
      namaLengkap: r.employee.namaLengkap,
      department: r.employee.department,
    },
    approvedBy: r.approvedBy,
  }));

  return (
    <div
      className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
      aria-label="Halaman kelola cuti"
    >
      {/* ─── Header ────────────────────────────────── */}
      <header>
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
            aria-hidden="true"
          >
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Kelola Cuti
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {pendingCount > 0
            ? `${pendingCount} pengajuan menunggu persetujuan`
            : "Tidak ada pengajuan yang menunggu"}
        </p>
      </header>

      {/* ─── KPI Summary ──────────────────────────── */}
      <section
        aria-label="Ringkasan status pengajuan cuti"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <SummaryTile
          icon={Clock}
          label="Menunggu"
          value={pendingCount}
          tone={pendingCount > 0 ? "amber" : "slate"}
        />
        <SummaryTile
          icon={CheckCircle2}
          label="Disetujui"
          value={approvedCount}
          tone="emerald"
        />
        <SummaryTile
          icon={XCircle}
          label="Ditolak"
          value={rejectedCount}
          tone={rejectedCount > 0 ? "amber" : "slate"}
        />
        <SummaryTile
          icon={Ban}
          label="Dibatalkan"
          value={cancelledCount}
          tone="slate"
        />
      </section>

      {/* ─── Approval Table ────────────────────────── */}
      <LeaveApprovalTable
        requests={serialized}
        currentStatus={statusFilter}
        currentYear={yearFilter}
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
  value: number;
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
          <p className="text-2xl font-bold tabular-nums leading-tight text-slate-900">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
