import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMonthlyAttendanceRecap } from "@/lib/services/attendance.service";
import { AttendanceFilters } from "./_components/attendance-filters";
import { AttendanceSummaryTable } from "./_components/attendance-summary-table";
import { ManualRecordDialog } from "./_components/manual-record-dialog";

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function AttendanceAdminPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (!["HR_ADMIN", "SUPER_ADMIN", "MANAGER"].includes(role)) {
    redirect("/attendance");
  }

  const params = await searchParams;
  const month = Number(params.month ?? new Date().getMonth() + 1);
  const year = Number(params.year ?? new Date().getFullYear());

  let departmentId: string | undefined;
  if (role === "MANAGER") {
    const managerEmployee = await prisma.employee.findUnique({
      where: { userId: session.user.id },
      select: { departmentId: true },
    });
    departmentId = managerEmployee?.departmentId ?? undefined;
  }

  const records = await getMonthlyAttendanceRecap({ month, year, departmentId });

  // Group records by employee
  const employeeMap = new Map<string, { employee: (typeof records)[0]["employee"]; records: typeof records }>();
  for (const record of records) {
    const existing = employeeMap.get(record.employee.id);
    if (existing) {
      existing.records.push(record);
    } else {
      employeeMap.set(record.employee.id, { employee: record.employee, records: [record] });
    }
  }
  const groupedData = Array.from(employeeMap.values());

  const isHRAdmin = ["HR_ADMIN", "SUPER_ADMIN"].includes(role);
  const allEmployees = isHRAdmin
    ? await prisma.employee.findMany({
        where: { isActive: true },
        select: { id: true, namaLengkap: true, nik: true },
        orderBy: { namaLengkap: "asc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Admin Absensi</h1>
          <p className="text-muted-foreground">
            Rekap bulanan — {role === "MANAGER" ? "departemen Anda" : "semua karyawan"}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <AttendanceFilters />
          {isHRAdmin && <ManualRecordDialog employees={allEmployees} />}
        </div>
      </div>

      <AttendanceSummaryTable
        data={groupedData}
        isHRAdmin={isHRAdmin}
        employees={allEmployees}
      />
    </div>
  );
}
