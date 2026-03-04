"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  createEmployeeSchema,
  updatePersonalInfoSchema,
  updateEmploymentSchema,
  updateTaxBpjsSchema,
  deactivateEmployeeSchema,
} from "@/lib/validations/employee";
import {
  createEmployee,
  updatePersonalInfo,
  updateEmploymentDetails,
  updateTaxBpjs,
  deactivateEmployee,
} from "@/lib/services/employee.service";
import type { ServiceResult } from "@/types";

// ===== AUTH HELPER =====

async function requireHRAdmin(): Promise<ServiceResult<{ userId: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Sesi tidak valid" };
  }
  if (session.user.role !== "HR_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return { success: false, error: "Akses ditolak" };
  }
  return { success: true, data: { userId: session.user.id } };
}

// ===== EMPLOYEE ACTIONS =====

export async function createEmployeeAction(
  formData: unknown
): Promise<ServiceResult<null>> {
  const authResult = await requireHRAdmin();
  if (!authResult.success) {
    return { success: false, error: authResult.error };
  }

  const parsed = createEmployeeSchema.safeParse(formData);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Data tidak valid";
    return { success: false, error: firstError };
  }

  const result = await createEmployee(parsed.data, authResult.data!.userId);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/employees");
  return { success: true };
}

export async function updatePersonalInfoAction(
  employeeId: string,
  formData: unknown
): Promise<ServiceResult<null>> {
  const authResult = await requireHRAdmin();
  if (!authResult.success) {
    return { success: false, error: authResult.error };
  }

  const parsed = updatePersonalInfoSchema.safeParse(formData);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Data tidak valid";
    return { success: false, error: firstError };
  }

  const result = await updatePersonalInfo(
    employeeId,
    parsed.data,
    authResult.data!.userId
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/employees");
  return { success: true };
}

export async function updateEmploymentAction(
  employeeId: string,
  formData: unknown
): Promise<ServiceResult<null>> {
  const authResult = await requireHRAdmin();
  if (!authResult.success) {
    return { success: false, error: authResult.error };
  }

  const parsed = updateEmploymentSchema.safeParse(formData);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Data tidak valid";
    return { success: false, error: firstError };
  }

  const result = await updateEmploymentDetails(
    employeeId,
    parsed.data,
    authResult.data!.userId
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/employees");
  return { success: true };
}

export async function updateTaxBpjsAction(
  employeeId: string,
  formData: unknown
): Promise<ServiceResult<null>> {
  const authResult = await requireHRAdmin();
  if (!authResult.success) {
    return { success: false, error: authResult.error };
  }

  const parsed = updateTaxBpjsSchema.safeParse(formData);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Data tidak valid";
    return { success: false, error: firstError };
  }

  const result = await updateTaxBpjs(
    employeeId,
    parsed.data,
    authResult.data!.userId
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/employees");
  return { success: true };
}

export async function deactivateEmployeeAction(
  employeeId: string,
  formData: unknown
): Promise<ServiceResult<null>> {
  const authResult = await requireHRAdmin();
  if (!authResult.success) {
    return { success: false, error: authResult.error };
  }

  const parsed = deactivateEmployeeSchema.safeParse(formData);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Data tidak valid";
    return { success: false, error: firstError };
  }

  const result = await deactivateEmployee(
    employeeId,
    parsed.data,
    authResult.data!.userId
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/employees");
  return { success: true };
}
