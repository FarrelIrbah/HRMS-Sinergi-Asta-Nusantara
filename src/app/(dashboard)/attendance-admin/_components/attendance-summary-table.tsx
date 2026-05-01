import Link from "next/link";
import { Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="py-12 text-center">
          <p className="text-sm text-slate-500">
            Tidak ada data absensi untuk periode ini.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-6">
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
                <TableHead className="text-xs font-semibold text-slate-600">
                  NIK
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">
                  Nama
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">
                  Departemen
                </TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-600">
                  Hadir
                </TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-600">
                  Terlambat
                </TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-600">
                  Total Jam
                </TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-600">
                  Lembur
                </TableHead>
                <TableHead className="text-center text-xs font-semibold text-slate-600">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(({ employee, records }) => {
                const totalMinutes = records.reduce(
                  (s, r) => s + r.totalMinutes,
                  0
                );
                const totalOT = records.reduce(
                  (s, r) => s + r.overtimeMinutes,
                  0
                );
                const lateCount = records.filter((r) => r.isLate).length;
                const presentDays = records.filter((r) => r.clockIn).length;

                return (
                  <TableRow key={employee.id}>
                    <TableCell className="font-mono text-xs text-slate-700">
                      {employee.nik}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {employee.namaLengkap}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {employee.department.name}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-slate-700">
                      {presentDays}
                    </TableCell>
                    <TableCell className="text-right">
                      {lateCount > 0 ? (
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-50 text-xs font-medium text-amber-800"
                        >
                          {lateCount}x
                        </Badge>
                      ) : (
                        <span className="text-sm text-slate-400">{"\u2014"}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-slate-700">
                      {totalMinutes > 0 ? minutesToHours(totalMinutes) : "\u2014"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-slate-700">
                      {totalOT > 0 ? minutesToHours(totalOT) : "\u2014"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="gap-1 text-xs"
                        >
                          <Link href={`/attendance-admin/${employee.id}`}>
                            <Eye
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            Detail
                          </Link>
                        </Button>
                        {isHRAdmin && (
                          <ManualRecordDialog
                            employees={employees}
                            defaultEmployeeId={employee.id}
                            compact
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
