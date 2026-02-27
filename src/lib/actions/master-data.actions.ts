"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  departmentSchema,
  positionSchema,
  officeLocationSchema,
  leaveTypeSchema,
} from "@/lib/validations/master-data";
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
  getOfficeLocations,
  createOfficeLocation,
  updateOfficeLocation,
  deleteOfficeLocation,
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
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

// ===== OFFICE LOCATION ACTIONS =====

export async function getOfficeLocationsAction(): Promise<ActionResult> {
  try {
    await getAuthenticatedSuperAdmin();
    const result = await getOfficeLocations();
    const data = result.data.map((loc) => ({
      ...loc,
      createdAt: loc.createdAt.toISOString(),
      updatedAt: loc.updatedAt.toISOString(),
      deletedAt: loc.deletedAt?.toISOString() ?? null,
    }));
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal memuat lokasi kantor",
    };
  }
}

export async function createOfficeLocationAction(
  formData: unknown
): Promise<ActionResult> {
  try {
    const actorId = await getAuthenticatedSuperAdmin();
    const parsed = officeLocationSchema.parse(formData);
    await createOfficeLocation(parsed, actorId);
    revalidatePath("/master-data");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal membuat lokasi kantor",
    };
  }
}

export async function updateOfficeLocationAction(
  id: string,
  formData: unknown
): Promise<ActionResult> {
  try {
    const actorId = await getAuthenticatedSuperAdmin();
    const parsed = officeLocationSchema.parse(formData);
    await updateOfficeLocation(id, parsed, actorId);
    revalidatePath("/master-data");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal mengubah lokasi kantor",
    };
  }
}

export async function deleteOfficeLocationAction(
  id: string
): Promise<ActionResult> {
  try {
    const actorId = await getAuthenticatedSuperAdmin();
    await deleteOfficeLocation(id, actorId);
    revalidatePath("/master-data");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal menghapus lokasi kantor",
    };
  }
}

// ===== LEAVE TYPE ACTIONS =====

export async function getLeaveTypesAction(): Promise<ActionResult> {
  try {
    await getAuthenticatedSuperAdmin();
    const result = await getLeaveTypes();
    const data = result.data.map((lt) => ({
      ...lt,
      createdAt: lt.createdAt.toISOString(),
      updatedAt: lt.updatedAt.toISOString(),
      deletedAt: lt.deletedAt?.toISOString() ?? null,
    }));
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal memuat jenis cuti",
    };
  }
}

export async function createLeaveTypeAction(
  formData: unknown
): Promise<ActionResult> {
  try {
    const actorId = await getAuthenticatedSuperAdmin();
    const parsed = leaveTypeSchema.parse(formData);
    await createLeaveType(parsed, actorId);
    revalidatePath("/master-data");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal membuat jenis cuti",
    };
  }
}

export async function updateLeaveTypeAction(
  id: string,
  formData: unknown
): Promise<ActionResult> {
  try {
    const actorId = await getAuthenticatedSuperAdmin();
    const parsed = leaveTypeSchema.parse(formData);
    await updateLeaveType(id, parsed, actorId);
    revalidatePath("/master-data");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal mengubah jenis cuti",
    };
  }
}

export async function deleteLeaveTypeAction(
  id: string
): Promise<ActionResult> {
  try {
    const actorId = await getAuthenticatedSuperAdmin();
    await deleteLeaveType(id, actorId);
    revalidatePath("/master-data");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal menghapus jenis cuti",
    };
  }
}
