"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { prisma, createAuditLog } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { verifyLocation } from "@/lib/services/location.service";
import { calculateAttendanceFlags } from "@/lib/services/attendance.service";
import { manualAttendanceSchema } from "@/lib/validations/attendance";

const TZ = "Asia/Jakarta";

type ActionResult = { success: boolean; error?: string };

// ─── Clock In ─────────────────────────────────────────────────────────

export async function clockInAction(
  coords?: { latitude: number; longitude: number }
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Sesi tidak valid" };

  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const clientIp = forwardedFor
    ? forwardedFor.split(",")[0].trim()
    : (headersList.get("x-real-ip") ?? "unknown");

  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id },
    include: { officeLocation: true },
  });

  if (!employee) return { success: false, error: "Profil karyawan tidak ditemukan" };
  if (!employee.isActive) return { success: false, error: "Akun karyawan tidak aktif" };
  if (!employee.officeLocation) {
    return {
      success: false,
      error: "Lokasi kantor belum dikonfigurasi untuk karyawan ini",
    };
  }

  const locationResult = verifyLocation(clientIp, coords, employee.officeLocation);
  if (!locationResult.allowed) {
    return { success: false, error: locationResult.reason };
  }

  const nowUtc = new Date();
  const nowJkt = toZonedTime(nowUtc, TZ);
  const dateStr = format(nowJkt, "yyyy-MM-dd");
  const dateOnly = new Date(dateStr + "T00:00:00.000Z");

  const scheduleStart = employee.officeLocation.workStartTime ?? "08:00";
  const scheduleEnd = employee.officeLocation.workEndTime ?? "17:00";
  const flags = calculateAttendanceFlags(nowUtc, null, scheduleStart, scheduleEnd);

  try {
    await prisma.attendanceRecord.create({
      data: {
        employeeId: employee.id,
        officeLocationId: employee.officeLocation.id,
        date: dateOnly,
        clockIn: nowUtc,
        clockInIp: clientIp,
        clockInLat: coords?.latitude,
        clockInLon: coords?.longitude,
        isLate: flags.isLate,
        lateMinutes: flags.lateMinutes,
      },
    });

    revalidatePath("/attendance");
    return { success: true };
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      return {
        success: false,
        error: "Anda sudah melakukan absen masuk hari ini",
      };
    }
    return { success: false, error: "Gagal mencatat absen masuk" };
  }
}

// ─── Clock Out ────────────────────────────────────────────────────────

export async function clockOutAction(
  coords?: { latitude: number; longitude: number }
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Sesi tidak valid" };

  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const clientIp = forwardedFor
    ? forwardedFor.split(",")[0].trim()
    : (headersList.get("x-real-ip") ?? "unknown");

  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id },
    include: { officeLocation: true },
  });

  if (!employee) return { success: false, error: "Profil karyawan tidak ditemukan" };
  if (!employee.officeLocation) {
    return { success: false, error: "Lokasi kantor belum dikonfigurasi" };
  }

  const locationResult = verifyLocation(clientIp, coords, employee.officeLocation);
  if (!locationResult.allowed) {
    return { success: false, error: locationResult.reason };
  }

  const nowUtc = new Date();
  const nowJkt = toZonedTime(nowUtc, TZ);
  const dateStr = format(nowJkt, "yyyy-MM-dd");
  const dateOnly = new Date(dateStr + "T00:00:00.000Z");

  const record = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date: dateOnly } },
  });

  if (!record) {
    return { success: false, error: "Absen masuk belum tercatat hari ini" };
  }
  if (record.clockOut) {
    return {
      success: false,
      error: "Anda sudah melakukan absen pulang hari ini",
    };
  }

  const scheduleStart = employee.officeLocation.workStartTime ?? "08:00";
  const scheduleEnd = employee.officeLocation.workEndTime ?? "17:00";
  const flags = calculateAttendanceFlags(
    record.clockIn!,
    nowUtc,
    scheduleStart,
    scheduleEnd
  );

  await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: {
      clockOut: nowUtc,
      clockOutIp: clientIp,
      isEarlyOut: flags.isEarlyOut,
      earlyOutMinutes: flags.earlyOutMinutes,
      overtimeMinutes: flags.overtimeMinutes,
      totalMinutes: flags.totalMinutes,
    },
  });

  revalidatePath("/attendance");
  return { success: true };
}

// ─── Manual Override (HR Admin) ───────────────────────────────────────

export async function manualOverrideAction(
  input: unknown
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Sesi tidak valid" };
  if (!["HR_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return { success: false, error: "Akses ditolak" };
  }

  const parsed = manualAttendanceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data tidak valid",
    };
  }

  const { employeeId, date, clockIn, clockOut, overrideReason } = parsed.data;

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { officeLocation: true },
  });

  if (!employee) return { success: false, error: "Karyawan tidak ditemukan" };

  const dateOnly = new Date(format(date, "yyyy-MM-dd") + "T00:00:00.000Z");
  const [inH, inM] = clockIn.split(":").map(Number);
  const clockInUtc = new Date(dateOnly);
  clockInUtc.setUTCHours(inH - 7, inM, 0, 0); // Convert WIB (UTC+7) to UTC

  let clockOutUtc: Date | null = null;
  if (clockOut && clockOut !== "") {
    const [outH, outM] = clockOut.split(":").map(Number);
    clockOutUtc = new Date(dateOnly);
    clockOutUtc.setUTCHours(outH - 7, outM, 0, 0);
  }

  const scheduleStart = employee.officeLocation?.workStartTime ?? "08:00";
  const scheduleEnd = employee.officeLocation?.workEndTime ?? "17:00";
  const flags = calculateAttendanceFlags(
    clockInUtc,
    clockOutUtc,
    scheduleStart,
    scheduleEnd
  );

  const officeLocationId =
    employee.officeLocationId ??
    (await prisma.officeLocation.findFirst({ select: { id: true } }))?.id ??
    "";

  await prisma.attendanceRecord.upsert({
    where: { employeeId_date: { employeeId, date: dateOnly } },
    create: {
      employeeId,
      officeLocationId,
      date: dateOnly,
      clockIn: clockInUtc,
      clockOut: clockOutUtc ?? undefined,
      isManualOverride: true,
      overrideById: session.user.id,
      overrideReason,
      ...flags,
    },
    update: {
      clockIn: clockInUtc,
      clockOut: clockOutUtc,
      isManualOverride: true,
      overrideById: session.user.id,
      overrideReason,
      ...flags,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    module: "Absensi",
    targetId: employeeId,
    newValue: {
      date: format(date, "yyyy-MM-dd"),
      clockIn,
      clockOut: clockOut ?? null,
      overrideReason,
    },
  });

  revalidatePath("/attendance-admin");
  return { success: true };
}
