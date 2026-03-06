import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLeaveBalances, getLeaveRequests, ensureLeaveBalances } from "@/lib/services/leave.service";
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
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Cuti</h1>
        <p className="text-muted-foreground">
          Anda tidak memiliki profil karyawan. Hubungi HR Admin untuk pengaturan profil.
        </p>
      </div>
    );
  }

  // Ensure balance rows exist for current year before reading
  await ensureLeaveBalances(employee.id);

  const currentYear = new Date().getFullYear();

  // Get leave types for form dropdown and balance cards
  const leaveTypes = await prisma.leaveType.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, annualQuota: true },
  });

  const [balances, requests] = await Promise.all([
    getLeaveBalances(employee.id, currentYear),
    getLeaveRequests({ employeeId: employee.id, year: currentYear }),
  ]);

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cuti</h1>
        <p className="text-muted-foreground">Kelola pengajuan cuti dan lihat saldo cuti Anda</p>
      </div>

      <LeaveBalanceCard balances={serializedBalances} leaveTypes={leaveTypes} />

      <div className="grid gap-6 md:grid-cols-2">
        <LeaveRequestForm leaveTypes={leaveTypes} balances={serializedBalances} />
      </div>

      <LeaveHistoryTable requests={serializedRequests} />
    </div>
  );
}
