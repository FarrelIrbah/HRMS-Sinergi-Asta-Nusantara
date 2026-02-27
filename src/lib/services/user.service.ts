import bcrypt from "bcryptjs";
import { Role } from "@/generated/prisma/client";
import { prisma, createAuditLog } from "@/lib/prisma";
import { MODULES } from "@/lib/constants";
import type { ServiceResult, PaginatedResponse } from "@/types";

// Fields to exclude from user queries (never expose password hash)
const userSelectFields = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type UserListItem = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

interface GetUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export async function getUsers(
  params: GetUsersParams = {}
): Promise<PaginatedResponse<UserListItem>> {
  const { page = 1, pageSize = 25, search } = params;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelectFields,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

export async function getUserById(
  id: string
): Promise<UserListItem | null> {
  return prisma.user.findUnique({
    where: { id },
    select: userSelectFields,
  });
}

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export async function createUser(
  data: CreateUserData,
  actorId: string
): Promise<ServiceResult<UserListItem>> {
  // Check email uniqueness
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    return { success: false, error: "Email sudah terdaftar" };
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      hashedPassword,
      role: data.role,
    },
    select: userSelectFields,
  });

  await createAuditLog({
    userId: actorId,
    action: "CREATE",
    module: MODULES.USER,
    targetId: user.id,
    newValue: {
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    } as unknown as Record<string, unknown>,
  });

  return { success: true, data: user };
}

interface UpdateUserData {
  name: string;
  email: string;
  role: Role;
}

export async function updateUser(
  id: string,
  data: UpdateUserData,
  actorId: string
): Promise<ServiceResult<UserListItem>> {
  // Fetch old values for audit
  const oldUser = await prisma.user.findUnique({
    where: { id },
    select: userSelectFields,
  });

  if (!oldUser) {
    return { success: false, error: "Pengguna tidak ditemukan" };
  }

  // Check email uniqueness excluding self
  const existing = await prisma.user.findFirst({
    where: { email: data.email, id: { not: id } },
  });

  if (existing) {
    return { success: false, error: "Email sudah terdaftar" };
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
    },
    select: userSelectFields,
  });

  await createAuditLog({
    userId: actorId,
    action: "UPDATE",
    module: MODULES.USER,
    targetId: user.id,
    oldValue: {
      name: oldUser.name,
      email: oldUser.email,
      role: oldUser.role,
    } as unknown as Record<string, unknown>,
    newValue: {
      name: user.name,
      email: user.email,
      role: user.role,
    } as unknown as Record<string, unknown>,
  });

  return { success: true, data: user };
}

export async function toggleUserActive(
  id: string,
  actorId: string
): Promise<ServiceResult<UserListItem>> {
  // Prevent self-deactivation
  if (id === actorId) {
    return {
      success: false,
      error: "Tidak dapat menonaktifkan akun sendiri",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelectFields,
  });

  if (!user) {
    return { success: false, error: "Pengguna tidak ditemukan" };
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
    select: userSelectFields,
  });

  await createAuditLog({
    userId: actorId,
    action: "UPDATE",
    module: MODULES.USER,
    targetId: user.id,
    oldValue: {
      isActive: user.isActive,
    } as unknown as Record<string, unknown>,
    newValue: {
      isActive: updatedUser.isActive,
    } as unknown as Record<string, unknown>,
  });

  return { success: true, data: updatedUser };
}
