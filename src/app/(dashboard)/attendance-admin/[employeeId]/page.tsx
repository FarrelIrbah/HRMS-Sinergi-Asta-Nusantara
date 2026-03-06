import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMonthlyAttendanceRecap } from "@/lib/services/attendance.service";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { id as localeId } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AttendanceFilters } from "../_components/attendance-filters";

const TZ = "Asia/Jakarta";

interface PageProps {
  params: Promise<{ employeeId: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
}

function minutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}j` : `${h}j ${m}m`;
}

export default async function EmployeeAttendanceDetailPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (!["HR_ADMIN", "SUPER_ADMIN", "MANAGER"].includes(role)) {
    redirect("/attendance");
  }

  const { employeeId } = await params;
  const sp = await searchParams;
  const month = Number(sp.month ?? new Date().getMonth() + 1);
  const year = Number(sp.year ?? new Date().getFullYear());

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      department: { select: { name: true } },
      position: { select: { name: true } },
    },
  });

  if (!employee) notFound();

  if (role === "MANAGER") {
    const managerEmployee = await prisma.employee.findUnique({
      where: { userId: session.user.id },
      select: { departmentId: true },
    });
    if (managerEmployee?.departmentId !== employee.departmentId) {
      redirect("/attendance-admin");
    }
  }

  const records = await getMonthlyAttendanceRecap({ month, year, employeeId });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/attendance-admin">
            <ArrowLeft className="mr-1 h-4 w-4" /> Kembali
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{employee.namaLengkap}</h1>
          <p className="text-muted-foreground text-sm">
            {employee.nik} · {employee.department.name} · {employee.position.name}
          </p>
        </div>
        <AttendanceFilters />
      </div>

      {records.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          Tidak ada data absensi untuk periode ini.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Masuk</TableHead>
                <TableHead>Pulang</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Lembur</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {format(toZonedTime(record.date, TZ), "dd MMM yyyy", { locale: localeId })}
                    {record.isManualOverride && (
                      <Badge variant="outline" className="ml-2 text-xs border-amber-400 text-amber-600">
                        Manual
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {record.clockIn ? format(toZonedTime(record.clockIn, TZ), "HH:mm") : "—"}
                  </TableCell>
                  <TableCell>
                    {record.clockOut ? format(toZonedTime(record.clockOut, TZ), "HH:mm") : "—"}
                  </TableCell>
                  <TableCell>
                    {record.totalMinutes > 0 ? minutesToHours(record.totalMinutes) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {!record.isLate && !record.isEarlyOut && record.overtimeMinutes === 0 && record.clockOut && (
                        <Badge variant="outline" className="border-green-400 text-green-700 text-xs">Tepat Waktu</Badge>
                      )}
                      {record.isLate && (
                        <Badge variant="destructive" className="text-xs">Terlambat {record.lateMinutes}m</Badge>
                      )}
                      {record.isEarlyOut && (
                        <Badge variant="secondary" className="text-xs">Pulang Awal</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {record.overtimeMinutes > 0 ? minutesToHours(record.overtimeMinutes) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
