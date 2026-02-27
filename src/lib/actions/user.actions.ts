"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createUserSchema, updateUserSchema } from "@/lib/validations/user";
import {
  createUser,
  updateUser,
  toggleUserActive,
} from "@/lib/services/user.service";
import type { ServiceResult } from "@/types";

async function requireSuperAdmin(): Promise<
  ServiceResult<{ userId: string }>
> {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Sesi tidak valid" };
  }

  if (session.user.role !== "SUPER_ADMIN") {
    return { success: false, error: "Akses ditolak" };
  }

  return { success: true, data: { userId: session.user.id } };
}

export async function createUserAction(
  formData: unknown
): Promise<ServiceResult<null>> {
  const authResult = await requireSuperAdmin();
  if (!authResult.success) {
    return { success: false, error: authResult.error };
  }

  const parsed = createUserSchema.safeParse(formData);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Data tidak valid";
    return { success: false, error: firstError };
  }

  const result = await createUser(parsed.data, authResult.data!.userId);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/users");
  return { success: true };
}

export async function updateUserAction(
  id: string,
  formData: unknown
): Promise<ServiceResult<null>> {
  const authResult = await requireSuperAdmin();
  if (!authResult.success) {
    return { success: false, error: authResult.error };
  }

  const parsed = updateUserSchema.safeParse(formData);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Data tidak valid";
    return { success: false, error: firstError };
  }

  const result = await updateUser(id, parsed.data, authResult.data!.userId);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/users");
  return { success: true };
}

export async function toggleUserActiveAction(
  id: string
): Promise<ServiceResult<null>> {
  const authResult = await requireSuperAdmin();
  if (!authResult.success) {
    return { success: false, error: authResult.error };
  }

  const result = await toggleUserActive(id, authResult.data!.userId);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/users");
  return { success: true };
}
