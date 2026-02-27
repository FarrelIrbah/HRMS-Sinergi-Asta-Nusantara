import { prisma, createAuditLog } from "@/lib/prisma";
import { MODULES, DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type {
  DepartmentInput,
  PositionInput,
  OfficeLocationInput,
  LeaveTypeInput,
} from "@/lib/validations/master-data";

interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

// ===== DEPARTMENT FUNCTIONS =====

export async function getDepartments(params: PaginationParams = {}) {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE, search } = params;

  const where = {
    deletedAt: null as null,
    ...(search && {
      name: { contains: search, mode: "insensitive" as const },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.department.findMany({
      where,
      include: {
        _count: {
          select: {
            positions: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.department.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getAllDepartments() {
  return prisma.department.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function createDepartment(data: DepartmentInput, actorId: string) {
  const department = await prisma.department.create({
    data: {
      name: data.name,
      description: data.description || null,
    },
  });

  await createAuditLog({
    userId: actorId,
    action: "CREATE",
    module: MODULES.DEPARTMENT,
    targetId: department.id,
    newValue: { name: department.name, description: department.description },
  });

  return department;
}

export async function updateDepartment(
  id: string,
  data: DepartmentInput,
  actorId: string
) {
  const old = await prisma.department.findUniqueOrThrow({
    where: { id, deletedAt: null },
  });

  const department = await prisma.department.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
    },
  });

  await createAuditLog({
    userId: actorId,
    action: "UPDATE",
    module: MODULES.DEPARTMENT,
    targetId: department.id,
    oldValue: { name: old.name, description: old.description },
    newValue: { name: department.name, description: department.description },
  });

  return department;
}

export async function deleteDepartment(id: string, actorId: string) {
  const department = await prisma.department.findUniqueOrThrow({
    where: { id, deletedAt: null },
    include: {
      _count: {
        select: {
          positions: { where: { deletedAt: null } },
        },
      },
    },
  });

  if (department._count.positions > 0) {
    throw new Error(
      "Departemen memiliki jabatan aktif, tidak dapat dihapus"
    );
  }

  await prisma.department.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    userId: actorId,
    action: "DELETE",
    module: MODULES.DEPARTMENT,
    targetId: id,
    oldValue: { name: department.name, description: department.description },
  });
}

// ===== POSITION FUNCTIONS =====

export async function getPositions(params: PaginationParams = {}) {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE, search } = params;

  const where = {
    deletedAt: null as null,
    ...(search && {
      name: { contains: search, mode: "insensitive" as const },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.position.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.position.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getAllPositions(departmentId?: string) {
  return prisma.position.findMany({
    where: {
      deletedAt: null,
      ...(departmentId && { departmentId }),
    },
    select: { id: true, name: true, departmentId: true },
    orderBy: { name: "asc" },
  });
}

export async function createPosition(data: PositionInput, actorId: string) {
  // Verify department exists and is not deleted
  const department = await prisma.department.findUniqueOrThrow({
    where: { id: data.departmentId, deletedAt: null },
  });

  const position = await prisma.position.create({
    data: {
      name: data.name,
      departmentId: data.departmentId,
    },
  });

  await createAuditLog({
    userId: actorId,
    action: "CREATE",
    module: MODULES.POSITION,
    targetId: position.id,
    newValue: {
      name: position.name,
      departmentId: position.departmentId,
      departmentName: department.name,
    },
  });

  return position;
}

export async function updatePosition(
  id: string,
  data: PositionInput,
  actorId: string
) {
  const old = await prisma.position.findUniqueOrThrow({
    where: { id, deletedAt: null },
    include: { department: { select: { name: true } } },
  });

  // Verify new department exists and is not deleted
  const department = await prisma.department.findUniqueOrThrow({
    where: { id: data.departmentId, deletedAt: null },
  });

  const position = await prisma.position.update({
    where: { id },
    data: {
      name: data.name,
      departmentId: data.departmentId,
    },
  });

  await createAuditLog({
    userId: actorId,
    action: "UPDATE",
    module: MODULES.POSITION,
    targetId: position.id,
    oldValue: {
      name: old.name,
      departmentId: old.departmentId,
      departmentName: old.department.name,
    },
    newValue: {
      name: position.name,
      departmentId: position.departmentId,
      departmentName: department.name,
    },
  });

  return position;
}

export async function deletePosition(id: string, actorId: string) {
  const position = await prisma.position.findUniqueOrThrow({
    where: { id, deletedAt: null },
    include: { department: { select: { name: true } } },
  });

  await prisma.position.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    userId: actorId,
    action: "DELETE",
    module: MODULES.POSITION,
    targetId: id,
    oldValue: {
      name: position.name,
      departmentId: position.departmentId,
      departmentName: position.department.name,
    },
  });
}

// ===== OFFICE LOCATION FUNCTIONS =====

export async function getOfficeLocations(params: PaginationParams = {}) {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE, search } = params;

  const where = {
    deletedAt: null as null,
    ...(search && {
      name: { contains: search, mode: "insensitive" as const },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.officeLocation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.officeLocation.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getAllOfficeLocations() {
  return prisma.officeLocation.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function createOfficeLocation(
  data: OfficeLocationInput,
  actorId: string
) {
  const location = await prisma.officeLocation.create({
    data: {
      name: data.name,
      address: data.address || null,
      allowedIPs: data.allowedIPs ?? [],
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      radiusMeters: data.radiusMeters ?? null,
    },
  });

  await createAuditLog({
    userId: actorId,
    action: "CREATE",
    module: MODULES.OFFICE_LOCATION,
    targetId: location.id,
    newValue: {
      name: location.name,
      address: location.address,
      allowedIPs: location.allowedIPs,
      latitude: location.latitude,
      longitude: location.longitude,
      radiusMeters: location.radiusMeters,
    },
  });

  return location;
}

export async function updateOfficeLocation(
  id: string,
  data: OfficeLocationInput,
  actorId: string
) {
  const old = await prisma.officeLocation.findUniqueOrThrow({
    where: { id, deletedAt: null },
  });

  const location = await prisma.officeLocation.update({
    where: { id },
    data: {
      name: data.name,
      address: data.address || null,
      allowedIPs: data.allowedIPs ?? [],
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      radiusMeters: data.radiusMeters ?? null,
    },
  });

  await createAuditLog({
    userId: actorId,
    action: "UPDATE",
    module: MODULES.OFFICE_LOCATION,
    targetId: location.id,
    oldValue: {
      name: old.name,
      address: old.address,
      allowedIPs: old.allowedIPs,
      latitude: old.latitude,
      longitude: old.longitude,
      radiusMeters: old.radiusMeters,
    },
    newValue: {
      name: location.name,
      address: location.address,
      allowedIPs: location.allowedIPs,
      latitude: location.latitude,
      longitude: location.longitude,
      radiusMeters: location.radiusMeters,
    },
  });

  return location;
}

export async function deleteOfficeLocation(id: string, actorId: string) {
  const location = await prisma.officeLocation.findUniqueOrThrow({
    where: { id, deletedAt: null },
  });

  await prisma.officeLocation.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    userId: actorId,
    action: "DELETE",
    module: MODULES.OFFICE_LOCATION,
    targetId: id,
    oldValue: {
      name: location.name,
      address: location.address,
      allowedIPs: location.allowedIPs,
      latitude: location.latitude,
      longitude: location.longitude,
      radiusMeters: location.radiusMeters,
    },
  });
}

// ===== LEAVE TYPE FUNCTIONS =====

export async function getLeaveTypes(params: PaginationParams = {}) {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE, search } = params;

  const where = {
    deletedAt: null as null,
    ...(search && {
      name: { contains: search, mode: "insensitive" as const },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.leaveType.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.leaveType.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getAllLeaveTypes() {
  return prisma.leaveType.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, annualQuota: true },
    orderBy: { name: "asc" },
  });
}

export async function createLeaveType(
  data: LeaveTypeInput,
  actorId: string
) {
  const leaveType = await prisma.leaveType.create({
    data: {
      name: data.name,
      annualQuota: data.annualQuota,
      isPaid: data.isPaid,
      genderRestriction: data.genderRestriction ?? null,
    },
  });

  await createAuditLog({
    userId: actorId,
    action: "CREATE",
    module: MODULES.LEAVE_TYPE,
    targetId: leaveType.id,
    newValue: {
      name: leaveType.name,
      annualQuota: leaveType.annualQuota,
      isPaid: leaveType.isPaid,
      genderRestriction: leaveType.genderRestriction,
    },
  });

  return leaveType;
}

export async function updateLeaveType(
  id: string,
  data: LeaveTypeInput,
  actorId: string
) {
  const old = await prisma.leaveType.findUniqueOrThrow({
    where: { id, deletedAt: null },
  });

  const leaveType = await prisma.leaveType.update({
    where: { id },
    data: {
      name: data.name,
      annualQuota: data.annualQuota,
      isPaid: data.isPaid,
      genderRestriction: data.genderRestriction ?? null,
    },
  });

  await createAuditLog({
    userId: actorId,
    action: "UPDATE",
    module: MODULES.LEAVE_TYPE,
    targetId: leaveType.id,
    oldValue: {
      name: old.name,
      annualQuota: old.annualQuota,
      isPaid: old.isPaid,
      genderRestriction: old.genderRestriction,
    },
    newValue: {
      name: leaveType.name,
      annualQuota: leaveType.annualQuota,
      isPaid: leaveType.isPaid,
      genderRestriction: leaveType.genderRestriction,
    },
  });

  return leaveType;
}

export async function deleteLeaveType(id: string, actorId: string) {
  const leaveType = await prisma.leaveType.findUniqueOrThrow({
    where: { id, deletedAt: null },
  });

  await prisma.leaveType.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    userId: actorId,
    action: "DELETE",
    module: MODULES.LEAVE_TYPE,
    targetId: id,
    oldValue: {
      name: leaveType.name,
      annualQuota: leaveType.annualQuota,
      isPaid: leaveType.isPaid,
      genderRestriction: leaveType.genderRestriction,
    },
  });
}
