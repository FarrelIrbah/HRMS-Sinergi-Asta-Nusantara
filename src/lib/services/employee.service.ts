import bcrypt from "bcryptjs";
import { Role } from "@/generated/prisma/client";
import type { Prisma, Employee } from "@/generated/prisma/client";
import { prisma, createAuditLog } from "@/lib/prisma";
import { MODULES, DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { ServiceResult } from "@/types";
import type { CreateEmployeeInput } from "@/lib/validations/employee";

// ===== NIK GENERATION =====

/**
 * Generate employee NIK in format EMP-{YYYY}-{4-digit sequential}.
 * Must be called inside a transaction to prevent race conditions.
 */
async function generateEmployeeNIK(
  tx: Prisma.TransactionClient
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `EMP-${year}-`;

  const lastEmployee = await tx.employee.findFirst({
    where: { nik: { startsWith: prefix } },
    orderBy: { nik: "desc" },
    select: { nik: true },
  });

  let nextSeq = 1;
  if (lastEmployee) {
    const lastSeq = parseInt(lastEmployee.nik.split("-")[2], 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  return `${prefix}${nextSeq.toString().padStart(4, "0")}`;
}

// ===== QUERY FUNCTIONS =====

interface GetEmployeesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  departmentId?: string;
  positionId?: string;
  isActive?: boolean;
  contractType?: string;
}

export async function getEmployees(params: GetEmployeesParams = {}) {
  const {
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    search,
    departmentId,
    positionId,
    isActive,
    contractType,
  } = params;

  const where: Prisma.EmployeeWhereInput = {
    ...(search && {
      OR: [
        { namaLengkap: { contains: search, mode: "insensitive" as const } },
        { nik: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(departmentId && { departmentId }),
    ...(positionId && { positionId }),
    ...(isActive !== undefined && { isActive }),
    ...(contractType && { contractType: contractType as Prisma.EnumContractTypeFilter["equals"] }),
  };

  const [data, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.employee.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getEmployeesForManager(
  userId: string,
  params: Omit<GetEmployeesParams, "departmentId"> = {}
) {
  // Look up manager's Employee record to find their department
  const managerEmployee = await prisma.employee.findUnique({
    where: { userId },
    select: { departmentId: true },
  });

  if (!managerEmployee) {
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      totalPages: 0,
    };
  }

  return getEmployees({
    ...params,
    departmentId: managerEmployee.departmentId,
  });
}

export async function getEmployeeById(id: string) {
  return prisma.employee.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true } },
      position: { select: { id: true, name: true } },
      documents: true,
      emergencyContacts: true,
    },
  });
}

export async function getEmployeeByUserId(userId: string) {
  return prisma.employee.findUnique({
    where: { userId },
    include: {
      department: { select: { id: true, name: true } },
      position: { select: { id: true, name: true } },
    },
  });
}

// ===== MUTATION FUNCTIONS =====

export async function createEmployee(
  data: CreateEmployeeInput,
  actorId: string
): Promise<ServiceResult<Employee>> {
  try {
    const employee = await prisma.$transaction(async (tx) => {
      // Check email uniqueness
      const existingUser = await tx.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new Error("Email sudah terdaftar");
      }

      // Generate NIK inside transaction
      const nik = await generateEmployeeNIK(tx);

      // Hash password
      const hashedPassword = await bcrypt.hash(data.initialPassword, 12);

      // Create User with EMPLOYEE role
      const user = await tx.user.create({
        data: {
          name: data.namaLengkap,
          email: data.email,
          hashedPassword,
          role: Role.EMPLOYEE,
          isActive: true,
        },
      });

      // Create Employee linked to User
      const emp = await tx.employee.create({
        data: {
          nik,
          userId: user.id,
          namaLengkap: data.namaLengkap,
          email: data.email,
          departmentId: data.departmentId,
          positionId: data.positionId,
          contractType: data.contractType,
          joinDate: data.joinDate,
          // Optional personal fields
          nikKtp: data.nikKtp || null,
          tempatLahir: data.tempatLahir || null,
          tanggalLahir: data.tanggalLahir instanceof Date ? data.tanggalLahir : null,
          jenisKelamin: data.jenisKelamin || null,
          statusPernikahan: data.statusPernikahan || null,
          agama: data.agama || null,
          alamat: data.alamat || null,
          nomorHp: data.nomorHp || null,
          // Optional tax/BPJS fields
          npwp: data.npwp || null,
          ptkpStatus: data.ptkpStatus || null,
          bpjsKesehatanNo: data.bpjsKesehatanNo || null,
          bpjsKetenagakerjaanNo: data.bpjsKetenagakerjaanNo || null,
        },
      });

      return emp;
    });

    // Audit log outside transaction
    await createAuditLog({
      userId: actorId,
      action: "CREATE",
      module: MODULES.EMPLOYEE,
      targetId: employee.id,
      newValue: {
        nik: employee.nik,
        namaLengkap: employee.namaLengkap,
        email: employee.email,
        departmentId: employee.departmentId,
        positionId: employee.positionId,
        contractType: employee.contractType,
      } as unknown as Record<string, unknown>,
    });

    return { success: true, data: employee };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal membuat karyawan",
    };
  }
}

export async function updatePersonalInfo(
  employeeId: string,
  data: {
    namaLengkap: string;
    nikKtp?: string;
    tempatLahir?: string;
    tanggalLahir?: Date | string;
    jenisKelamin?: string;
    statusPernikahan?: string;
    agama?: string;
    alamat?: string;
    nomorHp?: string;
  },
  actorId: string
): Promise<ServiceResult<Employee>> {
  const old = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!old) {
    return { success: false, error: "Karyawan tidak ditemukan" };
  }

  const employee = await prisma.employee.update({
    where: { id: employeeId },
    data: {
      namaLengkap: data.namaLengkap,
      nikKtp: data.nikKtp || null,
      tempatLahir: data.tempatLahir || null,
      tanggalLahir: data.tanggalLahir instanceof Date ? data.tanggalLahir : null,
      jenisKelamin: (data.jenisKelamin as Employee["jenisKelamin"]) || null,
      statusPernikahan: (data.statusPernikahan as Employee["statusPernikahan"]) || null,
      agama: (data.agama as Employee["agama"]) || null,
      alamat: data.alamat || null,
      nomorHp: data.nomorHp || null,
    },
  });

  await createAuditLog({
    userId: actorId,
    action: "UPDATE",
    module: MODULES.EMPLOYEE,
    targetId: employeeId,
    oldValue: {
      namaLengkap: old.namaLengkap,
      nikKtp: old.nikKtp,
      tempatLahir: old.tempatLahir,
      tanggalLahir: old.tanggalLahir,
      jenisKelamin: old.jenisKelamin,
      statusPernikahan: old.statusPernikahan,
      agama: old.agama,
      alamat: old.alamat,
      nomorHp: old.nomorHp,
    } as unknown as Record<string, unknown>,
    newValue: {
      namaLengkap: employee.namaLengkap,
      nikKtp: employee.nikKtp,
      tempatLahir: employee.tempatLahir,
      tanggalLahir: employee.tanggalLahir,
      jenisKelamin: employee.jenisKelamin,
      statusPernikahan: employee.statusPernikahan,
      agama: employee.agama,
      alamat: employee.alamat,
      nomorHp: employee.nomorHp,
    } as unknown as Record<string, unknown>,
  });

  return { success: true, data: employee };
}

export async function updateEmploymentDetails(
  employeeId: string,
  data: {
    departmentId: string;
    positionId: string;
    contractType: string;
    joinDate: Date;
    officeLocationId?: string;
  },
  actorId: string
): Promise<ServiceResult<Employee>> {
  const old = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!old) {
    return { success: false, error: "Karyawan tidak ditemukan" };
  }

  const employee = await prisma.employee.update({
    where: { id: employeeId },
    data: {
      departmentId: data.departmentId,
      positionId: data.positionId,
      contractType: data.contractType as Employee["contractType"],
      joinDate: data.joinDate,
      officeLocationId: data.officeLocationId || null,
    },
  });

  await createAuditLog({
    userId: actorId,
    action: "UPDATE",
    module: MODULES.EMPLOYEE,
    targetId: employeeId,
    oldValue: {
      departmentId: old.departmentId,
      positionId: old.positionId,
      contractType: old.contractType,
      joinDate: old.joinDate,
      officeLocationId: old.officeLocationId,
    } as unknown as Record<string, unknown>,
    newValue: {
      departmentId: employee.departmentId,
      positionId: employee.positionId,
      contractType: employee.contractType,
      joinDate: employee.joinDate,
      officeLocationId: employee.officeLocationId,
    } as unknown as Record<string, unknown>,
  });

  return { success: true, data: employee };
}

export async function updateTaxBpjs(
  employeeId: string,
  data: {
    npwp?: string;
    ptkpStatus?: string;
    bpjsKesehatanNo?: string;
    bpjsKetenagakerjaanNo?: string;
    isTaxBorneByCompany?: boolean;
  },
  actorId: string
): Promise<ServiceResult<Employee>> {
  const old = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!old) {
    return { success: false, error: "Karyawan tidak ditemukan" };
  }

  const employee = await prisma.employee.update({
    where: { id: employeeId },
    data: {
      npwp: data.npwp || null,
      ptkpStatus: (data.ptkpStatus as Employee["ptkpStatus"]) || null,
      bpjsKesehatanNo: data.bpjsKesehatanNo || null,
      bpjsKetenagakerjaanNo: data.bpjsKetenagakerjaanNo || null,
      isTaxBorneByCompany: data.isTaxBorneByCompany ?? false,
    },
  });

  await createAuditLog({
    userId: actorId,
    action: "UPDATE",
    module: MODULES.EMPLOYEE,
    targetId: employeeId,
    oldValue: {
      npwp: old.npwp,
      ptkpStatus: old.ptkpStatus,
      bpjsKesehatanNo: old.bpjsKesehatanNo,
      bpjsKetenagakerjaanNo: old.bpjsKetenagakerjaanNo,
      isTaxBorneByCompany: old.isTaxBorneByCompany,
    } as unknown as Record<string, unknown>,
    newValue: {
      npwp: employee.npwp,
      ptkpStatus: employee.ptkpStatus,
      bpjsKesehatanNo: employee.bpjsKesehatanNo,
      bpjsKetenagakerjaanNo: employee.bpjsKetenagakerjaanNo,
      isTaxBorneByCompany: employee.isTaxBorneByCompany,
    } as unknown as Record<string, unknown>,
  });

  return { success: true, data: employee };
}

export async function deactivateEmployee(
  employeeId: string,
  data: { terminationDate: Date; terminationReason: string },
  actorId: string
): Promise<ServiceResult<Employee>> {
  try {
    const old = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, userId: true, isActive: true, namaLengkap: true },
    });

    if (!old) {
      return { success: false, error: "Karyawan tidak ditemukan" };
    }

    if (!old.isActive) {
      return { success: false, error: "Karyawan sudah tidak aktif" };
    }

    const employee = await prisma.$transaction(async (tx) => {
      // Deactivate Employee
      const emp = await tx.employee.update({
        where: { id: employeeId },
        data: {
          isActive: false,
          terminationDate: data.terminationDate,
          terminationReason: data.terminationReason,
        },
      });

      // Deactivate linked User
      await tx.user.update({
        where: { id: old.userId },
        data: { isActive: false },
      });

      return emp;
    });

    // Audit log outside transaction
    await createAuditLog({
      userId: actorId,
      action: "UPDATE",
      module: MODULES.EMPLOYEE,
      targetId: employeeId,
      oldValue: {
        isActive: true,
        terminationDate: null,
        terminationReason: null,
      },
      newValue: {
        isActive: false,
        terminationDate: employee.terminationDate,
        terminationReason: employee.terminationReason,
        namaLengkap: old.namaLengkap,
      } as unknown as Record<string, unknown>,
    });

    return { success: true, data: employee };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal menonaktifkan karyawan",
    };
  }
}

// ===== ACCESS CONTROL =====

export async function canManagerAccessEmployee(
  managerUserId: string,
  employeeId: string
): Promise<boolean> {
  const [manager, employee] = await Promise.all([
    prisma.employee.findUnique({
      where: { userId: managerUserId },
      select: { departmentId: true },
    }),
    prisma.employee.findUnique({
      where: { id: employeeId },
      select: { departmentId: true },
    }),
  ]);

  if (!manager || !employee) {
    return false;
  }

  return manager.departmentId === employee.departmentId;
}
