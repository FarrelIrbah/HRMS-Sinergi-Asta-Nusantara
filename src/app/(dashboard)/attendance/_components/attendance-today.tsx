import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import {
  Clock,
  CheckCircle2,
  CalendarDays,
  LogIn,
  LogOut,
  Timer,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
  workStartTime: string | null;
  workEndTime: string | null;
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}j`;
  return `${h}j ${m}m`;
}

function parseHHMM(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function AttendanceToday({
  todayRecord,
  weeklySummary,
  workStartTime,
  workEndTime,
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

  const startLabel = workStartTime ?? "08:00";
  const endLabel = workEndTime ?? "17:00";
  const expectedMinutes = Math.max(
    parseHHMM(endLabel) - parseHHMM(startLabel),
    60
  );

  // Compute progress: if clocked out, use totalMinutes; if clocked in, estimate elapsed
  let elapsedMinutes = totalMinutes;
  if (isClockedIn && todayRecord?.clockIn) {
    const now = new Date();
    const clockInMs = new Date(todayRecord.clockIn).getTime();
    elapsedMinutes = Math.max(
      Math.floor((now.getTime() - clockInMs) / 60000),
      0
    );
  }
  const progressPct = Math.min(
    Math.round((elapsedMinutes / expectedMinutes) * 100),
    100
  );

  const today = toZonedTime(new Date(), TZ);
  const todayLabel = format(today, "EEEE, d MMM yyyy", { locale: localeId });

  // ─── Weekly aggregates ────────────────────────────────────
  const weekTotalMinutes = weeklySummary.reduce(
    (s, d) => s + d.totalMinutes,
    0
  );
  const weekPresentDays = weeklySummary.filter((d) => d.hasRecord).length;
  const weekAvgMinutes =
    weekPresentDays > 0 ? Math.round(weekTotalMinutes / weekPresentDays) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* ─── Today's Clock ──────────────────────────────────── */}
      <Card className="flex flex-col border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600"
                aria-hidden="true"
              >
                <Clock className="h-3.5 w-3.5" />
              </div>
              Hari Ini
            </CardTitle>
            <span className="text-xs font-medium capitalize text-slate-500">
              {todayLabel}
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
          {/* Clock In / Out grid with vertical divider */}
          <div className="grid grid-cols-2 divide-x divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-slate-50/40">
            <TimeSlot
              icon={LogIn}
              label="Masuk"
              time={clockInDisplay}
              tone="emerald"
              badge={
                isLate ? (
                  <Badge
                    variant="outline"
                    className="mt-1.5 border-amber-200 bg-amber-50 text-[10px] font-medium text-amber-800"
                  >
                    Terlambat {todayRecord?.lateMinutes ?? 0}m
                  </Badge>
                ) : isClockedIn || isClockedOut ? (
                  <Badge
                    variant="outline"
                    className="mt-1.5 border-emerald-200 bg-emerald-50 text-[10px] font-medium text-emerald-700"
                  >
                    Tepat Waktu
                  </Badge>
                ) : (
                  <span className="mt-1.5 text-[11px] text-slate-400">
                    Target {startLabel}
                  </span>
                )
              }
            />
            <TimeSlot
              icon={LogOut}
              label="Pulang"
              time={clockOutDisplay}
              tone="sky"
              badge={
                isEarlyOut ? (
                  <Badge
                    variant="outline"
                    className="mt-1.5 border-rose-200 bg-rose-50 text-[10px] font-medium text-rose-700"
                  >
                    Pulang Awal
                  </Badge>
                ) : overtimeMinutes > 0 ? (
                  <Badge
                    variant="outline"
                    className="mt-1.5 border-violet-200 bg-violet-50 text-[10px] font-medium text-violet-700"
                  >
                    Lembur {formatMinutes(overtimeMinutes)}
                  </Badge>
                ) : isClockedOut ? (
                  <Badge
                    variant="outline"
                    className="mt-1.5 border-emerald-200 bg-emerald-50 text-[10px] font-medium text-emerald-700"
                  >
                    Tepat Waktu
                  </Badge>
                ) : (
                  <span className="mt-1.5 text-[11px] text-slate-400">
                    Target {endLabel}
                  </span>
                )
              }
            />
          </div>

          {/* Progress section */}
          <div className="space-y-2">
            <div className="flex items-end justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <Timer className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                Durasi Kerja
              </div>
              <div className="text-xs tabular-nums text-slate-500">
                <span className="font-semibold text-slate-900">
                  {elapsedMinutes > 0 ? formatMinutes(elapsedMinutes) : "\u2014"}
                </span>
                <span className="text-slate-400">
                  {" "}/ {formatMinutes(expectedMinutes)}
                </span>
              </div>
            </div>
            <Progress
              value={progressPct}
              className="h-1.5 bg-slate-100 [&>div]:bg-emerald-500"
              aria-label={`Durasi kerja ${progressPct}%`}
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Mulai {startLabel}</span>
              <span>Selesai {endLabel}</span>
            </div>
          </div>

          {/* Action zone */}
          <div className="mt-auto">
            {!isClockedOut && <ClockInButton isClockedIn={isClockedIn} />}
            {isClockedOut && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>
                  Absen hari ini sudah lengkap ({formatMinutes(totalMinutes)})
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── Weekly Summary ──────────────────────────────────── */}
      <Card className="flex flex-col border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-50 text-sky-600"
                aria-hidden="true"
              >
                <CalendarDays className="h-3.5 w-3.5" />
              </div>
              Ringkasan Minggu Ini
            </CardTitle>
            <span className="text-xs font-medium text-slate-500 tabular-nums">
              {weekPresentDays}/5 hari hadir
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3">
          <div className="grid flex-1 grid-cols-5 gap-1.5">
            {weeklySummary.map((day) => {
              const dayLabel = format(day.date, "EEE", { locale: localeId });
              const dayNum = format(day.date, "d");
              const isToday = format(day.date, "yyyy-MM-dd") ===
                format(today, "yyyy-MM-dd");

              const toneClass = day.hasRecord
                ? day.isLate
                  ? "border-amber-200 bg-amber-50"
                  : "border-emerald-200 bg-emerald-50"
                : "border-slate-200 bg-slate-50/50";

              return (
                <div
                  key={day.dateStr}
                  className={`flex flex-col items-center justify-between rounded-lg border px-2 py-3 text-xs transition-colors ${toneClass} ${isToday ? "ring-2 ring-emerald-400 ring-offset-1" : ""}`}
                  aria-label={`${dayLabel} ${dayNum}, ${day.hasRecord ? formatMinutes(day.totalMinutes) : "tidak hadir"}`}
                >
                  <span className="font-medium capitalize text-slate-500">
                    {dayLabel}
                  </span>
                  <span className="my-1 text-xl font-bold leading-none text-slate-900">
                    {dayNum}
                  </span>
                  <span
                    className={`tabular-nums font-semibold ${
                      day.hasRecord
                        ? day.isLate
                          ? "text-amber-800"
                          : "text-emerald-700"
                        : "text-slate-400"
                    }`}
                  >
                    {day.totalMinutes > 0
                      ? formatMinutes(day.totalMinutes)
                      : "\u2014"}
                  </span>
                  <span
                    className={`mt-1 h-1 w-full rounded-full ${
                      day.hasRecord
                        ? day.isLate
                          ? "bg-amber-300"
                          : "bg-emerald-400"
                        : "bg-slate-200"
                    }`}
                    aria-hidden="true"
                  />
                </div>
              );
            })}
          </div>

          <Separator className="bg-slate-200" />

          {/* Footer stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <WeekStat
              label="Total Jam"
              value={
                weekTotalMinutes > 0 ? formatMinutes(weekTotalMinutes) : "\u2014"
              }
              icon={Timer}
            />
            <WeekStat
              label="Rata-rata"
              value={
                weekAvgMinutes > 0 ? formatMinutes(weekAvgMinutes) : "\u2014"
              }
              icon={TrendingUp}
            />
            <WeekStat
              label="Hari Hadir"
              value={`${weekPresentDays}/5`}
              icon={CheckCircle2}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────── Sub-components ───────────────────

function TimeSlot({
  icon: Icon,
  label,
  time,
  tone,
  badge,
}: {
  icon: typeof Clock;
  label: string;
  time: string | null;
  tone: "emerald" | "sky";
  badge?: React.ReactNode;
}) {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-600"
      : "bg-sky-50 text-sky-600";
  return (
    <div className="flex min-w-0 flex-col items-start p-3">
      <div className="flex items-center gap-1.5">
        <div
          className={`flex h-5 w-5 items-center justify-center rounded-sm ${toneClass}`}
          aria-hidden="true"
        >
          <Icon className="h-3 w-3" />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums leading-none text-slate-900">
        {time ?? "\u2014"}
      </p>
      {badge}
    </div>
  );
}

function WeekStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Clock;
}) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50/60 px-2 py-2">
      <div className="flex items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
        <Icon className="h-3 w-3 text-slate-400" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-1 text-sm font-bold tabular-nums leading-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}
