import { redirect } from "next/navigation";
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLeaveRequests } from "@/lib/services/leave.service";
import { SummaryTile } from "@/components/shared/summary-tile";
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
  // Default filter: managers see PENDING_MANAGER (their queue),
  // HR/Super-admin see PENDING_HR (their queue).
  const defaultStatus = role === "MANAGER" ? "PENDING_MANAGER" : "PENDING_HR";
  const statusFilter = sp.status ?? defaultStatus;
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

  // Compute stats — pending count reflects this approver's actionable queue
  const pendingCount = allRequests.filter(
    (r) => r.status === defaultStatus
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
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    createdAt: r.createdAt.toISOString(),
    leaveType: r.leaveType,
    employee: {
      id: r.employee.id,
      nik: r.employee.nik,
      namaLengkap: r.employee.namaLengkap,
      department: r.employee.department,
    },
    managerApprovedAt: r.managerApprovedAt?.toISOString() ?? null,
    managerNotes: r.managerNotes,
    managerApprovedBy: r.managerApprovedBy,
    hrApprovedAt: r.hrApprovedAt?.toISOString() ?? null,
    hrNotes: r.hrNotes,
    hrApprovedBy: r.hrApprovedBy,
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
          tone={rejectedCount > 0 ? "rose" : "slate"}
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
        currentRole={role}
      />
    </div>
  );
}

