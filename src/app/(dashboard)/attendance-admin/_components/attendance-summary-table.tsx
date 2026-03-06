import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ManualRecordDialog } from "./manual-record-dialog";

interface AttendanceRecord {
  id: string;
  clockIn: Date | null;
  clockOut: Date | null;
  totalMinutes: number;
  overtimeMinutes: number;
  isLate: boolean;
  isManualOverride: boolean;
}

interface EmployeeAttendance {
  employee: {
    id: string;
    nik: string;
    namaLengkap: string;
    department: { name: string };
    position: { name: string };
  };
  records: AttendanceRecord[];
}

interface AttendanceSummaryTableProps {
  data: EmployeeAttendance[];
  isHRAdmin: boolean;
  employees: { id: string; namaLengkap: string; nik: string }[];
}

function minutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}j` : `${h}j ${m}m`;
}

export function AttendanceSummaryTable({
  data,
  isHRAdmin,
  employees,
}: AttendanceSummaryTableProps) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-center py-8">
        Tidak ada data absensi untuk periode ini.
      </p>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>NIK</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>Departemen</TableHead>
            <TableHead className="text-right">Hadir</TableHead>
            <TableHead className="text-right">Terlambat</TableHead>
            <TableHead className="text-right">Total Jam</TableHead>
            <TableHead className="text-right">Lembur</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(({ employee, records }) => {
            const totalMinutes = records.reduce((s, r) => s + r.totalMinutes, 0);
            const totalOT = records.reduce((s, r) => s + r.overtimeMinutes, 0);
            const lateCount = records.filter((r) => r.isLate).length;
            const presentDays = records.filter((r) => r.clockIn).length;

            return (
              <TableRow key={employee.id}>
                <TableCell className="font-mono text-xs">{employee.nik}</TableCell>
                <TableCell className="font-medium">{employee.namaLengkap}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{employee.department.name}</TableCell>
                <TableCell className="text-right">{presentDays}</TableCell>
                <TableCell className="text-right">
                  {lateCount > 0 ? (
                    <Badge variant="destructive" className="text-xs">{lateCount}x</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {totalMinutes > 0 ? minutesToHours(totalMinutes) : "—"}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {totalOT > 0 ? minutesToHours(totalOT) : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/attendance-admin/${employee.id}`}>Detail</Link>
                    </Button>
                    {isHRAdmin && (
                      <ManualRecordDialog employees={employees} defaultEmployeeId={employee.id} />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
