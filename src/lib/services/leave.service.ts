import { eachDayOfInterval, isWeekend } from "date-fns";
import type { LeaveStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/types/enums";

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

// ─── Resolve Initial Stage ────────────────────────────────────────────
// Returns PENDING_HR if the requester's department has no other manager
// (e.g. requester IS the manager, or no manager assigned). Otherwise PENDING_MANAGER.

async function resolveInitialStage(
  requesterEmployeeId: string
): Promise<"PENDING_MANAGER" | "PENDING_HR"> {
  const requester = await prisma.employee.findUnique({
    where: { id: requesterEmployeeId },
    select: {
      departmentId: true,
      user: { select: { id: true, role: true } },
    },
  });
  if (!requester) return "PENDING_HR";

  // Skip stage 1 if requester themselves is the manager — no peer manager to approve.
  if (requester.user?.role === "MANAGER") return "PENDING_HR";

  // Skip stage 1 if department has no active manager.
  const managerCount = await prisma.user.count({
    where: {
      role: "MANAGER",
      isActive: true,
      employee: { departmentId: requester.departmentId, isActive: true },
    },
  });
  return managerCount > 0 ? "PENDING_MANAGER" : "PENDING_HR";
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

  const initialStatus = await resolveInitialStage(input.employeeId);

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
      status: initialStatus,
    },
  });
}

// ─── Approve Leave Request (2-stage, atomic) ──────────────────────────
// MANAGER approves PENDING_MANAGER → advances to PENDING_HR.
// HR_ADMIN / SUPER_ADMIN approves PENDING_HR → final APPROVED + decrements balance.
// Self-approval is blocked (manager cannot approve their own request).

export async function approveLeaveRequest(
  leaveRequestId: string,
  approverUserId: string,
  approverRole: Role,
  notes?: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const request = await tx.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: { employee: { select: { departmentId: true, userId: true } } },
    });

    if (!request) throw new Error("Permintaan cuti tidak ditemukan");

    // Self-approval guard
    if (request.employee.userId === approverUserId) {
      throw new Error("Anda tidak dapat menyetujui pengajuan Anda sendiri");
    }

    if (request.status === "PENDING_MANAGER") {
      if (approverRole !== "MANAGER") {
        throw new Error("Tahap ini hanya dapat disetujui oleh Manager divisi");
      }
      // Manager must be in same department
      const approver = await tx.employee.findUnique({
        where: { userId: approverUserId },
        select: { departmentId: true },
      });
      if (
        !approver ||
        approver.departmentId !== request.employee.departmentId
      ) {
        throw new Error("Anda hanya dapat menyetujui cuti dari divisi Anda");
      }

      await tx.leaveRequest.update({
        where: { id: leaveRequestId },
        data: {
          status: "PENDING_HR",
          managerApprovedById: approverUserId,
          managerNotes: notes ?? null,
          managerApprovedAt: new Date(),
        },
      });
      return;
    }

    if (request.status === "PENDING_HR") {
      if (approverRole !== "HR_ADMIN" && approverRole !== "SUPER_ADMIN") {
        throw new Error("Tahap ini hanya dapat disetujui oleh Admin HR");
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
          hrApprovedById: approverUserId,
          hrNotes: notes ?? null,
          hrApprovedAt: new Date(),
        },
      });
      return;
    }

    throw new Error("Permintaan sudah diproses sebelumnya");
  });
}

// ─── Reject Leave Request (any stage) ─────────────────────────────────

export async function rejectLeaveRequest(
  leaveRequestId: string,
  approverUserId: string,
  approverRole: Role,
  notes: string
): Promise<void> {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: leaveRequestId },
    include: { employee: { select: { departmentId: true, userId: true } } },
  });

  if (!request) throw new Error("Permintaan cuti tidak ditemukan");
  if (request.employee.userId === approverUserId) {
    throw new Error("Anda tidak dapat menolak pengajuan Anda sendiri");
  }

  const stamp = new Date();

  if (request.status === "PENDING_MANAGER") {
    if (approverRole !== "MANAGER") {
      throw new Error("Tahap ini hanya dapat ditolak oleh Manager divisi");
    }
    const approver = await prisma.employee.findUnique({
      where: { userId: approverUserId },
      select: { departmentId: true },
    });
    if (!approver || approver.departmentId !== request.employee.departmentId) {
      throw new Error("Anda hanya dapat menolak cuti dari divisi Anda");
    }
    await prisma.leaveRequest.update({
      where: { id: leaveRequestId },
      data: {
        status: "REJECTED",
        managerApprovedById: approverUserId,
        managerNotes: notes,
        managerApprovedAt: stamp,
      },
    });
    return;
  }

  if (request.status === "PENDING_HR") {
    if (approverRole !== "HR_ADMIN" && approverRole !== "SUPER_ADMIN") {
      throw new Error("Tahap ini hanya dapat ditolak oleh Admin HR");
    }
    await prisma.leaveRequest.update({
      where: { id: leaveRequestId },
      data: {
        status: "REJECTED",
        hrApprovedById: approverUserId,
        hrNotes: notes,
        hrApprovedAt: stamp,
      },
    });
    return;
  }

  throw new Error("Permintaan sudah diproses sebelumnya");
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
  if (
    request.status !== "PENDING_MANAGER" &&
    request.status !== "PENDING_HR"
  ) {
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
      managerApprovedBy: { select: { name: true } },
      hrApprovedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Pending Count (for dashboard widget) ────────────────────────────
// stage: undefined = both pending stages; "manager" = PENDING_MANAGER only;
// "hr" = PENDING_HR only.

export async function getPendingLeaveCount(
  options: {
    departmentId?: string;
    stage?: "manager" | "hr";
  } = {}
): Promise<number> {
  const pendingBoth: LeaveStatus[] = ["PENDING_MANAGER", "PENDING_HR"];
  const statusFilter =
    options.stage === "manager"
      ? { status: "PENDING_MANAGER" as LeaveStatus }
      : options.stage === "hr"
        ? { status: "PENDING_HR" as LeaveStatus }
        : { status: { in: pendingBoth } };

  return prisma.leaveRequest.count({
    where: {
      ...statusFilter,
      ...(options.departmentId
        ? { employee: { departmentId: options.departmentId } }
        : {}),
    },
  });
}
