"use server";

import { revalidatePath } from "next/cache";
import { prisma, createAuditLog } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  submitLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
} from "@/lib/services/leave.service";
import {
  submitLeaveSchema,
  approveLeaveSchema,
  rejectLeaveSchema,
} from "@/lib/validations/leave";
import type { Role } from "@/types/enums";

type ActionResult = { success: boolean; error?: string };

// ─── Submit Leave Request ─────────────────────────────────────────────

export async function submitLeaveAction(
  formData: unknown
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Sesi tidak valid" };

  const parsed = submitLeaveSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data tidak valid",
    };
  }

  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id },
    select: { id: true, isActive: true },
  });

  if (!employee?.isActive) {
    return { success: false, error: "Akun karyawan tidak aktif" };
  }

  try {
    await submitLeaveRequest({
      employeeId: employee.id,
      leaveTypeId: parsed.data.leaveTypeId,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      reason: parsed.data.reason,
    });

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      module: "Permintaan Cuti",
      targetId: employee.id,
      newValue: {
        leaveTypeId: parsed.data.leaveTypeId,
        startDate: parsed.data.startDate.toISOString(),
        endDate: parsed.data.endDate.toISOString(),
      },
    });

    revalidatePath("/leave");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Gagal mengajukan cuti",
    };
  }
}

// ─── Approve Leave Request ────────────────────────────────────────────

export async function approveLeaveAction(
  input: unknown
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Sesi tidak valid" };
  if (!["HR_ADMIN", "SUPER_ADMIN", "MANAGER"].includes(session.user.role)) {
    return { success: false, error: "Akses ditolak" };
  }

  const parsed = approveLeaveSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data tidak valid",
    };
  }

  try {
    await approveLeaveRequest(
      parsed.data.leaveRequestId,
      session.user.id,
      session.user.role as Role,
      parsed.data.notes
    );

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      module: "Permintaan Cuti",
      targetId: parsed.data.leaveRequestId,
      newValue: { approvedBy: session.user.role, notes: parsed.data.notes },
    });

    revalidatePath("/leave/manage");
    revalidatePath("/leave");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Gagal menyetujui cuti",
    };
  }
}

// ─── Reject Leave Request ─────────────────────────────────────────────

export async function rejectLeaveAction(
  input: unknown
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Sesi tidak valid" };
  if (!["HR_ADMIN", "SUPER_ADMIN", "MANAGER"].includes(session.user.role)) {
    return { success: false, error: "Akses ditolak" };
  }

  const parsed = rejectLeaveSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data tidak valid",
    };
  }

  try {
    await rejectLeaveRequest(
      parsed.data.leaveRequestId,
      session.user.id,
      session.user.role as Role,
      parsed.data.notes
    );

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      module: "Permintaan Cuti",
      targetId: parsed.data.leaveRequestId,
      newValue: { status: "REJECTED", rejectedBy: session.user.role, notes: parsed.data.notes },
    });

    revalidatePath("/leave/manage");
    revalidatePath("/leave");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Gagal menolak cuti",
    };
  }
}

// ─── Cancel Leave Request (employee) ─────────────────────────────────

export async function cancelLeaveAction(
  leaveRequestId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Sesi tidak valid" };

  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!employee) return { success: false, error: "Profil karyawan tidak ditemukan" };

  try {
    await cancelLeaveRequest(leaveRequestId, employee.id);
    revalidatePath("/leave");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Gagal membatalkan cuti",
    };
  }
}
