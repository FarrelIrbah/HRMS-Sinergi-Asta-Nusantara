import { eachDayOfInterval, isWeekend } from "date-fns";
import { prisma } from "@/lib/prisma";

// ─── Working Day Calculation (pure function) ──────────────────────────

export function countWorkingDays(startDate: Date, endDate: Date): number {
  return eachDayOfInterval({ start: startDate, end: endDate }).filter(
    (day) => !isWeekend(day)
  ).length;
}

// ─── Ensure Leave Balances Exist for Employee ─────────────────────────

export async function ensureLeaveBalances(
  employeeId: string,
  year: number = new Date().getFullYear()
): Promise<void> {
  const leaveTypes = await prisma.leaveType.findMany({
    where: { deletedAt: null },
    select: { id: true, annualQuota: true },
  });

  await Promise.all(
    leaveTypes.map((lt) =>
      prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId,
            leaveTypeId: lt.id,
            year,
          },
        },
        create: {
          employeeId,
          leaveTypeId: lt.id,
          year,
          allocatedDays: lt.annualQuota,
          usedDays: 0,
        },
        update: {},
      })
    )
  );
}

// ─── Get Leave Balances for Employee ──────────────────────────────────

export async function getLeaveBalances(
  employeeId: string,
  year: number = new Date().getFullYear()
) {
  return prisma.leaveBalance.findMany({
    where: { employeeId, year },
    include: {
      leaveType: {
        select: {
          id: true,
          name: true,
          annualQuota: true,
          isPaid: true,
          genderRestriction: true,
        },
      },
    },
    orderBy: { leaveType: { name: "asc" } },
  });
}

// ─── Submit Leave Request ─────────────────────────────────────────────

export async function submitLeaveRequest(input: {
  employeeId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  attachmentPath?: string;
  attachmentName?: string;
}) {
  const workingDays = countWorkingDays(input.startDate, input.endDate);
  if (workingDays === 0) {
    throw new Error("Rentang tanggal tidak mencakup hari kerja");
  }

  await ensureLeaveBalances(input.employeeId);

  const balance = await prisma.leaveBalance.findUnique({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId: input.employeeId,
        leaveTypeId: input.leaveTypeId,
        year: input.startDate.getFullYear(),
      },
    },
  });

  if (balance) {
    const remaining = balance.allocatedDays - balance.usedDays;
    if (workingDays > remaining) {
      throw new Error(
        `Saldo cuti tidak mencukupi. Sisa: ${remaining} hari, dibutuhkan: ${workingDays} hari`
      );
    }
  }

  return prisma.leaveRequest.create({
    data: {
      employeeId: input.employeeId,
      leaveTypeId: input.leaveTypeId,
      startDate: input.startDate,
      endDate: input.endDate,
      workingDays,
      reason: input.reason,
      attachmentPath: input.attachmentPath,
      attachmentName: input.attachmentName,
      status: "PENDING",
    },
  });
}

// ─── Approve Leave Request (atomic transaction) ───────────────────────

export async function approveLeaveRequest(
  leaveRequestId: string,
  approverId: string,
  notes?: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const request = await tx.leaveRequest.findUnique({
      where: { id: leaveRequestId },
    });

    if (!request) throw new Error("Permintaan cuti tidak ditemukan");
    if (request.status !== "PENDING") {
      throw new Error("Permintaan sudah diproses sebelumnya");
    }

    await tx.leaveBalance.update({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year: request.startDate.getFullYear(),
        },
      },
      data: { usedDays: { increment: request.workingDays } },
    });

    await tx.leaveRequest.update({
      where: { id: leaveRequestId },
      data: {
        status: "APPROVED",
        approvedById: approverId,
        approverNotes: notes ?? null,
        approvedAt: new Date(),
      },
    });
  });
}

// ─── Reject Leave Request ─────────────────────────────────────────────

export async function rejectLeaveRequest(
  leaveRequestId: string,
  approverId: string,
  notes: string
): Promise<void> {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: leaveRequestId },
  });

  if (!request) throw new Error("Permintaan cuti tidak ditemukan");
  if (request.status !== "PENDING") {
    throw new Error("Permintaan sudah diproses sebelumnya");
  }

  await prisma.leaveRequest.update({
    where: { id: leaveRequestId },
    data: {
      status: "REJECTED",
      approvedById: approverId,
      approverNotes: notes,
      approvedAt: new Date(),
    },
  });
}

// ─── Cancel Leave Request (employee self-cancel) ───────────────────────

export async function cancelLeaveRequest(
  leaveRequestId: string,
  employeeId: string
): Promise<void> {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: leaveRequestId },
  });

  if (!request) throw new Error("Permintaan cuti tidak ditemukan");
  if (request.employeeId !== employeeId) {
    throw new Error(
      "Anda tidak memiliki akses untuk membatalkan permintaan ini"
    );
  }
  if (request.status !== "PENDING") {
    throw new Error(
      "Hanya permintaan dengan status Menunggu yang dapat dibatalkan"
    );
  }

  await prisma.leaveRequest.update({
    where: { id: leaveRequestId },
    data: { status: "CANCELLED" },
  });
}

// ─── Get Leave Requests ────────────────────────────────────────────────

export async function getLeaveRequests(filter: {
  employeeId?: string;
  departmentId?: string;
  status?: string;
  year?: number;
}) {
  const where: Record<string, unknown> = {};

  if (filter.employeeId) {
    where.employeeId = filter.employeeId;
  } else if (filter.departmentId) {
    where.employee = { departmentId: filter.departmentId };
  }

  if (filter.status && filter.status !== "_all") {
    where.status = filter.status;
  }

  if (filter.year) {
    where.startDate = {
      gte: new Date(`${filter.year}-01-01T00:00:00.000Z`),
      lte: new Date(`${filter.year}-12-31T23:59:59.999Z`),
    };
  }

  return prisma.leaveRequest.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true,
          nik: true,
          namaLengkap: true,
          department: { select: { name: true } },
        },
      },
      leaveType: { select: { id: true, name: true } },
      approvedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Pending Count (for dashboard widget) ────────────────────────────

export async function getPendingLeaveCount(
  departmentId?: string
): Promise<number> {
  return prisma.leaveRequest.count({
    where: {
      status: "PENDING",
      ...(departmentId ? { employee: { departmentId } } : {}),
    },
  });
}
