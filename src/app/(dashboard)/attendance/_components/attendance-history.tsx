import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function StatusBadges({
  record,
}: {
  record: AttendanceRecordWithLocation;
}) {
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
        className="border-green-400 text-green-700 text-xs"
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
        className="border-amber-400 text-amber-600 text-xs"
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Riwayat 7 Hari Terakhir</CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            Belum ada riwayat absensi.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Masuk</TableHead>
                <TableHead>Pulang</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {format(toZonedTime(record.date, TZ), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    {record.clockIn
                      ? format(toZonedTime(record.clockIn, TZ), "HH:mm")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {record.clockOut
                      ? format(toZonedTime(record.clockOut, TZ), "HH:mm")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {record.totalMinutes > 0
                      ? formatMinutes(record.totalMinutes)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadges record={record} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
