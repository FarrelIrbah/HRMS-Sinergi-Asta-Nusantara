import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClockInButton } from "./clock-in-button";
import type { AttendanceRecord } from "@/generated/prisma/client";

const TZ = "Asia/Jakarta";

interface WeekDay {
  date: Date;
  dateStr: string;
  totalMinutes: number;
  isLate: boolean;
  hasRecord: boolean;
}

interface AttendanceTodayProps {
  todayRecord: AttendanceRecord | null;
  weeklySummary: WeekDay[];
  employeeId: string;
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}j`;
  return `${h}j ${m}m`;
}

export function AttendanceToday({
  todayRecord,
  weeklySummary,
  employeeId,
}: AttendanceTodayProps) {
  const isClockedIn = !!todayRecord?.clockIn && !todayRecord?.clockOut;
  const isClockedOut = !!todayRecord?.clockOut;

  const clockInDisplay = todayRecord?.clockIn
    ? format(toZonedTime(todayRecord.clockIn, TZ), "HH:mm")
    : null;
  const clockOutDisplay = todayRecord?.clockOut
    ? format(toZonedTime(todayRecord.clockOut, TZ), "HH:mm")
    : null;

  const isLate = todayRecord?.isLate ?? false;
  const isEarlyOut = todayRecord?.isEarlyOut ?? false;
  const overtimeMinutes = todayRecord?.overtimeMinutes ?? 0;
  const totalMinutes = todayRecord?.totalMinutes ?? 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Masuk</p>
              <p className="font-semibold text-lg">{clockInDisplay ?? "—"}</p>
              {isLate && (
                <Badge variant="destructive" className="text-xs mt-1">
                  Terlambat
                </Badge>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">Pulang</p>
              <p className="font-semibold text-lg">{clockOutDisplay ?? "—"}</p>
              {isEarlyOut && (
                <Badge variant="secondary" className="text-xs mt-1">
                  Pulang Awal
                </Badge>
              )}
              {overtimeMinutes > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs mt-1 border-amber-400 text-amber-600"
                >
                  Lembur {formatMinutes(overtimeMinutes)}
                </Badge>
              )}
            </div>
          </div>

          {!isClockedOut && <ClockInButton isClockedIn={isClockedIn} />}

          {isClockedOut && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                Absen hari ini sudah lengkap ({formatMinutes(totalMinutes)})
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ringkasan Minggu Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-1">
            {weeklySummary.map((day) => {
              const dayLabel = format(day.date, "EEE", { locale: localeId });
              const dayNum = format(day.date, "d");
              return (
                <div
                  key={day.dateStr}
                  className={`flex flex-col items-center p-2 rounded text-xs ${
                    day.hasRecord
                      ? day.isLate
                        ? "bg-amber-50 border border-amber-200"
                        : "bg-green-50 border border-green-200"
                      : "bg-muted/30 border border-transparent"
                  }`}
                >
                  <span className="text-muted-foreground capitalize">
                    {dayLabel}
                  </span>
                  <span className="font-semibold">{dayNum}</span>
                  <span
                    className={
                      day.hasRecord
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    {day.totalMinutes > 0
                      ? formatMinutes(day.totalMinutes)
                      : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
