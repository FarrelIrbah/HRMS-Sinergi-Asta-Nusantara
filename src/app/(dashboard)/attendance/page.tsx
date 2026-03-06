import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getTodayRecord,
  getWeeklySummary,
  getEmployeeAttendance,
} from "@/lib/services/attendance.service";
import { AttendanceToday } from "./_components/attendance-today";
import { AttendanceHistory } from "./_components/attendance-history";

export default async function AttendancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      namaLengkap: true,
      isActive: true,
      officeLocation: {
        select: { name: true, workStartTime: true, workEndTime: true },
      },
    },
  });

  if (!employee) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Absensi</h1>
        <p className="text-muted-foreground">
          Anda tidak memiliki profil karyawan. Gunakan halaman Admin Absensi
          untuk melihat data absensi.
        </p>
      </div>
    );
  }

  const [todayRecord, weeklySummary, recentAttendance] = await Promise.all([
    getTodayRecord(employee.id),
    getWeeklySummary(employee.id),
    getEmployeeAttendance(employee.id, 7),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Absensi</h1>
        <p className="text-muted-foreground">
          {employee.officeLocation
            ? `Lokasi: ${employee.officeLocation.name} · Jam kerja: ${employee.officeLocation.workStartTime ?? "08:00"} – ${employee.officeLocation.workEndTime ?? "17:00"}`
            : "Lokasi kantor belum dikonfigurasi"}
        </p>
      </div>

      <AttendanceToday
        todayRecord={todayRecord}
        weeklySummary={weeklySummary}
        employeeId={employee.id}
      />

      <AttendanceHistory records={recentAttendance} />
    </div>
  );
}
