"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { departmentSchema, positionSchema } from "@/lib/validations/master-data";
import {
  getDepartments,
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getPositions,
  getAllPositions,
  createPosition,
  updatePosition,
  deletePosition,
} from "@/lib/services/master-data.service";

interface ActionResult {
  success: boolean;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
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

export async function getDepartmentsAction(): Promise<ActionResult> {
  try {
    await getAuthenticatedSuperAdmin();
    const result = await getDepartments();
    // Serialize dates for client components
    const data = result.data.map((d) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      deletedAt: d.deletedAt?.toISOString() ?? null,
    }));
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memuat departemen",
    };
  }
}

export async function getAllDepartmentsAction(): Promise<ActionResult> {
  try {
    await getAuthenticatedSuperAdmin();
    const data = await getAllDepartments();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memuat departemen",
    };
  }
}

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

export async function getPositionsAction(): Promise<ActionResult> {
  try {
    await getAuthenticatedSuperAdmin();
    const result = await getPositions();
    const data = result.data.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      deletedAt: p.deletedAt?.toISOString() ?? null,
    }));
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memuat jabatan",
    };
  }
}

export async function getAllPositionsAction(
  departmentId?: string
): Promise<ActionResult> {
  try {
    await getAuthenticatedSuperAdmin();
    const data = await getAllPositions(departmentId);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memuat jabatan",
    };
  }
}

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
