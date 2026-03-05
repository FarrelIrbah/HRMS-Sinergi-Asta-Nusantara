import { toZonedTime } from "date-fns-tz";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isWeekend,
  format,
} from "date-fns";
import { prisma } from "@/lib/prisma";
import { OVERTIME_THRESHOLD_MINUTES } from "@/lib/constants";

const TZ = "Asia/Jakarta";

// ─── Flag Calculation (pure function, no DB) ──────────────────────────

export function calculateAttendanceFlags(
  clockInUtc: Date,
  clockOutUtc: Date | null,
  scheduleStart: string, // "08:00"
  scheduleEnd: string // "17:00"
) {
  const localClockIn = toZonedTime(clockInUtc, TZ);
  const [startH, startM] = scheduleStart.split(":").map(Number);
  const scheduledStart = new Date(localClockIn);
  scheduledStart.setHours(startH, startM, 0, 0);

  const isLate = localClockIn > scheduledStart;
  const lateMinutes = isLate
    ? Math.round(
        (localClockIn.getTime() - scheduledStart.getTime()) / 60000
      )
    : 0;

  let isEarlyOut = false;
  let earlyOutMinutes = 0;
  let overtimeMinutes = 0;
  let totalMinutes = 0;

  if (clockOutUtc) {
    const localClockOut = toZonedTime(clockOutUtc, TZ);
    const [endH, endM] = scheduleEnd.split(":").map(Number);
    const scheduledEnd = new Date(localClockOut);
    scheduledEnd.setHours(endH, endM, 0, 0);

    isEarlyOut = localClockOut < scheduledEnd;
    earlyOutMinutes = isEarlyOut
      ? Math.round(
          (scheduledEnd.getTime() - localClockOut.getTime()) / 60000
        )
      : 0;

    const diffAfterEnd =
      (localClockOut.getTime() - scheduledEnd.getTime()) / 60000;
    overtimeMinutes =
      diffAfterEnd >= OVERTIME_THRESHOLD_MINUTES
        ? Math.round(diffAfterEnd)
        : 0;
    totalMinutes = Math.round(
      (clockOutUtc.getTime() - clockInUtc.getTime()) / 60000
    );
  }

  return {
    isLate,
    lateMinutes,
    isEarlyOut,
    earlyOutMinutes,
    overtimeMinutes,
    totalMinutes,
  };
}

// ─── Today's Record ────────────────────────────────────────────────────

export async function getTodayRecord(employeeId: string) {
  const todayUtc = new Date();
  const todayJkt = toZonedTime(todayUtc, TZ);
  const dateString = format(todayJkt, "yyyy-MM-dd");

  return prisma.attendanceRecord.findUnique({
    where: {
      employeeId_date: {
        employeeId,
        date: new Date(dateString + "T00:00:00.000Z"),
      },
    },
  });
}

// ─── Recent Records (last N days) ─────────────────────────────────────

export async function getEmployeeAttendance(
  employeeId: string,
  limitDays: number = 7
) {
  return prisma.attendanceRecord.findMany({
    where: { employeeId },
    orderBy: { date: "desc" },
    take: limitDays,
    include: { officeLocation: { select: { name: true } } },
  });
}

// ─── Weekly Summary ────────────────────────────────────────────────────

export async function getWeeklySummary(employeeId: string) {
  const nowJkt = toZonedTime(new Date(), TZ);
  const weekStart = startOfWeek(nowJkt, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(nowJkt, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd }).filter(
    (d) => !isWeekend(d)
  );

  const records = await prisma.attendanceRecord.findMany({
    where: {
      employeeId,
      date: {
        gte: new Date(format(weekStart, "yyyy-MM-dd") + "T00:00:00.000Z"),
        lte: new Date(format(weekEnd, "yyyy-MM-dd") + "T23:59:59.999Z"),
      },
    },
  });

  return days.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const record = records.find(
      (r) => format(toZonedTime(r.date, TZ), "yyyy-MM-dd") === dateStr
    );
    return {
      date: day,
      dateStr,
      totalMinutes: record?.totalMinutes ?? 0,
      isLate: record?.isLate ?? false,
      hasRecord: !!record,
    };
  });
}

// ─── Monthly Recap (for HR Admin / Manager views) ─────────────────────

export async function getMonthlyAttendanceRecap({
  month,
  year,
  departmentId,
  employeeId,
}: {
  month: number;
  year: number;
  departmentId?: string;
  employeeId?: string;
}) {
  const startDate = new Date(
    `${year}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`
  );
  const endDate = new Date(year, month, 0, 23, 59, 59, 999); // last day of month

  const where: Record<string, unknown> = {
    date: { gte: startDate, lte: endDate },
  };

  if (employeeId) {
    where.employeeId = employeeId;
  } else if (departmentId) {
    where.employee = { departmentId };
  }

  return prisma.attendanceRecord.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true,
          nik: true,
          namaLengkap: true,
          department: { select: { name: true } },
          position: { select: { name: true } },
        },
      },
    },
    orderBy: [{ employee: { namaLengkap: "asc" } }, { date: "asc" }],
  });
}
