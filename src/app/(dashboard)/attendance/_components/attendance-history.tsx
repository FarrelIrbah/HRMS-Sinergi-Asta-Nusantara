import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { History } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AttendanceStatusBadges } from "@/components/attendance/attendance-status-badges";

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

export function AttendanceHistory({ records }: AttendanceHistoryProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-50 text-violet-600"
              aria-hidden="true"
            >
              <History className="h-3.5 w-3.5" />
            </div>
            Riwayat 7 Hari Terakhir
          </CardTitle>
          <span className="text-xs font-medium text-slate-500 tabular-nums">
            {records.length} catatan
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {records.length === 0 ? (
          <div className="rounded-lg border border-slate-200 py-12 text-center">
            <p className="text-sm text-slate-500">
              Belum ada riwayat absensi.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <Table className="table-fixed">
              <colgroup>
                <col className="w-[20%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[13%]" />
                <col className="w-[30%]" />
                <col className="w-[15%]" />
              </colgroup>
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
                  <TableHead className="text-center text-xs font-semibold text-slate-600">
                    Lembur
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow
                    key={record.id}
                    className="hover:bg-slate-50/50"
                  >
                    <TableCell className="font-medium text-slate-900">
                      <div className="flex flex-col">
                        <span>
                          {format(toZonedTime(record.date, TZ), "dd MMM yyyy")}
                        </span>
                        <span className="text-[11px] font-normal capitalize text-slate-500">
                          {format(toZonedTime(record.date, TZ), "EEEE", {
                            locale: localeId,
                          })}
                        </span>
                      </div>
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
                    <TableCell className="tabular-nums font-medium text-slate-900">
                      {record.totalMinutes > 0
                        ? formatMinutes(record.totalMinutes)
                        : "\u2014"}
                    </TableCell>
                    <TableCell>
                      <AttendanceStatusBadges
                        record={record}
                        showOvertime={false}
                      />
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-slate-700">
                      {record.overtimeMinutes > 0 ? (
                        <span className="inline-flex items-center rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                          {formatMinutes(record.overtimeMinutes)}
                        </span>
                      ) : (
                        <span className="text-slate-400">{"\u2014"}</span>
                      )}
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
