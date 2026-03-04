"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma, createAuditLog } from "@/lib/prisma";
import { emergencyContactSchema } from "@/lib/validations/employee";
import { MODULES } from "@/lib/constants";
import { AuditAction } from "@/generated/prisma/client";
import type { ServiceResult } from "@/types";

// ===== AUTH HELPER =====

async function requireHRAdmin(): Promise<ServiceResult<{ userId: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Sesi tidak valid" };
  }
  if (
    session.user.role !== "HR_ADMIN" &&
    session.user.role !== "SUPER_ADMIN"
  ) {
    return { success: false, error: "Akses ditolak" };
  }
  return { success: true, data: { userId: session.user.id } };
}

// ===== EMERGENCY CONTACT ACTIONS =====

export async function createEmergencyContactAction(
  employeeId: string,
  data: unknown
): Promise<ServiceResult<null>> {
  const authResult = await requireHRAdmin();
  if (!authResult.success) {
    return { success: false, error: authResult.error };
  }

  const parsed = emergencyContactSchema.safeParse(data);
  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message ?? "Validasi gagal";
    return { success: false, error: firstError };
  }

  const count = await prisma.emergencyContact.count({
    where: { employeeId },
  });
  if (count >= 3) {
    return {
      success: false,
      error: "Maksimal 3 kontak darurat per karyawan",
    };
  }

  const contact = await prisma.emergencyContact.create({
    data: { employeeId, ...parsed.data },
  });

  await createAuditLog({
    userId: authResult.data!.userId,
    action: AuditAction.CREATE,
    module: MODULES.EMERGENCY_CONTACT,
    targetId: contact.id,
    newValue: { employeeId, ...parsed.data },
  });

  revalidatePath(`/employees/${employeeId}`);
  return { success: true, data: null };
}

export async function updateEmergencyContactAction(
  contactId: string,
  employeeId: string,
  data: unknown
): Promise<ServiceResult<null>> {
  const authResult = await requireHRAdmin();
  if (!authResult.success) {
    return { success: false, error: authResult.error };
  }

  const parsed = emergencyContactSchema.safeParse(data);
  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message ?? "Validasi gagal";
    return { success: false, error: firstError };
  }

  const existing = await prisma.emergencyContact.findUnique({
    where: { id: contactId },
  });

  if (!existing || existing.employeeId !== employeeId) {
    return { success: false, error: "Kontak darurat tidak ditemukan" };
  }

  await prisma.emergencyContact.update({
    where: { id: contactId },
    data: parsed.data,
  });

  await createAuditLog({
    userId: authResult.data!.userId,
    action: AuditAction.UPDATE,
    module: MODULES.EMERGENCY_CONTACT,
    targetId: contactId,
    oldValue: {
      name: existing.name,
      relationship: existing.relationship,
      phone: existing.phone,
      address: existing.address,
    },
    newValue: parsed.data,
  });

  revalidatePath(`/employees/${employeeId}`);
  return { success: true, data: null };
}

export async function deleteEmergencyContactAction(
  contactId: string,
  employeeId: string
): Promise<ServiceResult<null>> {
  const authResult = await requireHRAdmin();
  if (!authResult.success) {
    return { success: false, error: authResult.error };
  }

  const existing = await prisma.emergencyContact.findUnique({
    where: { id: contactId },
  });

  if (!existing || existing.employeeId !== employeeId) {
    return { success: false, error: "Kontak darurat tidak ditemukan" };
  }

  await prisma.emergencyContact.delete({
    where: { id: contactId },
  });

  await createAuditLog({
    userId: authResult.data!.userId,
    action: AuditAction.DELETE,
    module: MODULES.EMERGENCY_CONTACT,
    targetId: contactId,
    oldValue: {
      employeeId: existing.employeeId,
      name: existing.name,
      relationship: existing.relationship,
      phone: existing.phone,
      address: existing.address,
    },
  });

  revalidatePath(`/employees/${employeeId}`);
  return { success: true, data: null };
}
