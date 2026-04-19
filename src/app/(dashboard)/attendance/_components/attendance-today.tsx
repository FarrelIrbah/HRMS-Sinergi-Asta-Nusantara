import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { Clock, CheckCircle2, CalendarDays } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      {/* ─── Today's Clock ──────────────────────── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600"
              aria-hidden="true"
            >
              <Clock className="h-3.5 w-3.5" />
            </div>
            Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-6">
            <div>
              <p className="text-xs font-medium text-slate-500">Masuk</p>
              <p className="text-2xl font-bold tabular-nums text-slate-900">
                {clockInDisplay ?? "\u2014"}
              </p>
              {isLate && (
                <Badge
                  variant="destructive"
                  className="mt-1 text-xs"
                >
                  Terlambat {todayRecord?.lateMinutes ?? 0}m
                </Badge>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Pulang</p>
              <p className="text-2xl font-bold tabular-nums text-slate-900">
                {clockOutDisplay ?? "\u2014"}
              </p>
              {isEarlyOut && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  Pulang Awal
                </Badge>
              )}
              {overtimeMinutes > 0 && (
                <Badge
                  variant="outline"
                  className="mt-1 border-amber-300 text-xs text-amber-600"
                >
                  Lembur {formatMinutes(overtimeMinutes)}
                </Badge>
              )}
            </div>
          </div>

          {!isClockedOut && <ClockInButton isClockedIn={isClockedIn} />}

          {isClockedOut && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span>
                Absen hari ini sudah lengkap ({formatMinutes(totalMinutes)})
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Weekly Summary ─────────────────────── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-50 text-sky-600"
              aria-hidden="true"
            >
              <CalendarDays className="h-3.5 w-3.5" />
            </div>
            Ringkasan Minggu Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-1.5">
            {weeklySummary.map((day) => {
              const dayLabel = format(day.date, "EEE", { locale: localeId });
              const dayNum = format(day.date, "d");
              return (
                <div
                  key={day.dateStr}
                  className={`flex flex-col items-center rounded-lg px-2 py-2.5 text-xs transition-colors ${
                    day.hasRecord
                      ? day.isLate
                        ? "border border-amber-200 bg-amber-50"
                        : "border border-emerald-200 bg-emerald-50"
                      : "border border-transparent bg-slate-100/60"
                  }`}
                >
                  <span className="font-medium capitalize text-slate-500">
                    {dayLabel}
                  </span>
                  <span className="mt-0.5 text-base font-bold text-slate-900">
                    {dayNum}
                  </span>
                  <span
                    className={`mt-0.5 tabular-nums ${
                      day.hasRecord
                        ? day.isLate
                          ? "font-semibold text-amber-700"
                          : "font-semibold text-emerald-700"
                        : "text-slate-400"
                    }`}
                  >
                    {day.totalMinutes > 0 ? formatMinutes(day.totalMinutes) : "\u2014"}
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
