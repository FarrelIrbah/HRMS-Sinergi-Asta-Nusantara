import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLeaveRequests } from "@/lib/services/leave.service";
import { LeaveApprovalTable } from "./_components/leave-approval-table";

interface PageProps {
  searchParams: Promise<{ status?: string; year?: string }>;
}

export default async function LeaveManagePage({ searchParams }: PageProps) {
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

  const requests = await getLeaveRequests({
    departmentId,
    status: statusFilter,
    year: yearFilter,
  });

  // Serialize dates for client components
  const serialized = requests.map((r) => ({
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

  const pendingCount = serialized.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kelola Cuti</h1>
        <p className="text-muted-foreground">
          {pendingCount > 0
            ? `${pendingCount} pengajuan menunggu persetujuan`
            : "Tidak ada pengajuan yang menunggu"}
        </p>
      </div>

      <LeaveApprovalTable
        requests={serialized}
        currentStatus={statusFilter}
        currentYear={yearFilter}
      />
    </div>
  );
}
