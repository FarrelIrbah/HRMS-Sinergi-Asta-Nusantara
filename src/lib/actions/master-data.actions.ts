"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { departmentSchema, positionSchema } from "@/lib/validations/master-data";
import {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createPosition,
  updatePosition,
  deletePosition,
} from "@/lib/services/master-data.service";

interface ActionResult {
  success: boolean;
  error?: string;
}

async function getAuthenticatedSuperAdmin(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Tidak terautentikasi");
  }
  if (session.user.role !== "SUPER_ADMIN") {
    throw new Error("Akses ditolak: hanya Super Admin");
  }
  return session.user.id;
}

// ===== DEPARTMENT ACTIONS =====

export async function createDepartmentAction(
  formData: unknown
): Promise<ActionResult> {
  try {
    const actorId = await getAuthenticatedSuperAdmin();
    const parsed = departmentSchema.parse(formData);
    await createDepartment(parsed, actorId);
    revalidatePath("/master-data");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat departemen",
    };
  }
}

export async function updateDepartmentAction(
  id: string,
  formData: unknown
): Promise<ActionResult> {
  try {
    const actorId = await getAuthenticatedSuperAdmin();
    const parsed = departmentSchema.parse(formData);
    await updateDepartment(id, parsed, actorId);
    revalidatePath("/master-data");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengubah departemen",
    };
  }
}

export async function deleteDepartmentAction(
  id: string
): Promise<ActionResult> {
  try {
    const actorId = await getAuthenticatedSuperAdmin();
    await deleteDepartment(id, actorId);
    revalidatePath("/master-data");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal menghapus departemen",
    };
  }
}

// ===== POSITION ACTIONS =====

export async function createPositionAction(
  formData: unknown
): Promise<ActionResult> {
  try {
    const actorId = await getAuthenticatedSuperAdmin();
    const parsed = positionSchema.parse(formData);
    await createPosition(parsed, actorId);
    revalidatePath("/master-data");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat jabatan",
    };
  }
}

export async function updatePositionAction(
  id: string,
  formData: unknown
): Promise<ActionResult> {
  try {
    const actorId = await getAuthenticatedSuperAdmin();
    const parsed = positionSchema.parse(formData);
    await updatePosition(id, parsed, actorId);
    revalidatePath("/master-data");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengubah jabatan",
    };
  }
}

export async function deletePositionAction(
  id: string
): Promise<ActionResult> {
  try {
    const actorId = await getAuthenticatedSuperAdmin();
    await deletePosition(id, actorId);
    revalidatePath("/master-data");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus jabatan",
    };
  }
}

// ===== OFFICE LOCATION ACTIONS (to be added by Plan 07) =====

// ===== LEAVE TYPE ACTIONS (to be added by Plan 07) =====
