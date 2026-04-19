import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { History } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TZ = "Asia/Jakarta";

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}j`;
  return `${h}j ${m}m`;
}

interface AttendanceRecordWithLocation {
  id: string;
  date: Date;
  clockIn: Date | null;
  clockOut: Date | null;
  isLate: boolean;
  lateMinutes: number;
  isEarlyOut: boolean;
  earlyOutMinutes: number;
  overtimeMinutes: number;
  totalMinutes: number;
  isManualOverride: boolean;
  officeLocation: { name: string };
}

interface AttendanceHistoryProps {
  records: AttendanceRecordWithLocation[];
}

function StatusBadges({ record }: { record: AttendanceRecordWithLocation }) {
  const badges = [];
  if (
    !record.isLate &&
    !record.isEarlyOut &&
    record.overtimeMinutes === 0 &&
    record.clockOut
  ) {
    badges.push(
      <Badge
        key="ontime"
        variant="outline"
        className="border-emerald-300 text-xs text-emerald-700"
      >
        Tepat Waktu
      </Badge>
    );
  }
  if (record.isLate) {
    badges.push(
      <Badge key="late" variant="destructive" className="text-xs">
        Terlambat {record.lateMinutes}m
      </Badge>
    );
  }
  if (record.isEarlyOut) {
    badges.push(
      <Badge key="early" variant="secondary" className="text-xs">
        Pulang Awal
      </Badge>
    );
  }
  if (record.overtimeMinutes > 0) {
    badges.push(
      <Badge
        key="ot"
        variant="outline"
        className="border-amber-300 text-xs text-amber-600"
      >
        Lembur {formatMinutes(record.overtimeMinutes)}
      </Badge>
    );
  }
  if (record.isManualOverride) {
    badges.push(
      <Badge key="manual" variant="outline" className="text-xs">
        Override
      </Badge>
    );
  }
  return <div className="flex flex-wrap gap-1">{badges}</div>;
}

export function AttendanceHistory({ records }: AttendanceHistoryProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-50 text-violet-600"
            aria-hidden="true"
          >
            <History className="h-3.5 w-3.5" />
          </div>
          Riwayat 7 Hari Terakhir
        </CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-slate-500">
              Belum ada riwayat absensi.
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
                  <TableHead className="text-xs font-semibold text-slate-600">
                    Tanggal
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">
                    Masuk
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">
                    Pulang
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">
                    Total
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium text-slate-900">
                      {format(toZonedTime(record.date, TZ), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="tabular-nums text-slate-700">
                      {record.clockIn
                        ? format(toZonedTime(record.clockIn, TZ), "HH:mm")
                        : "\u2014"}
                    </TableCell>
                    <TableCell className="tabular-nums text-slate-700">
                      {record.clockOut
                        ? format(toZonedTime(record.clockOut, TZ), "HH:mm")
                        : "\u2014"}
                    </TableCell>
                    <TableCell className="tabular-nums text-slate-700">
                      {record.totalMinutes > 0
                        ? formatMinutes(record.totalMinutes)
                        : "\u2014"}
                    </TableCell>
                    <TableCell>
                      <StatusBadges record={record} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
