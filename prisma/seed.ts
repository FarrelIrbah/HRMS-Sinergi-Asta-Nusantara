import {
  PrismaClient,
  Role,
  Gender,
  Religion,
  MaritalStatus,
  ContractType,
  PTKPStatus,
} from "../src/generated/prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // ── 1. Users ──────────────────────────────────────────────────────────
  const hashedPassword = await hash("Admin123!", 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@ptsan.co.id" },
      update: {},
      create: {
        name: "Super Admin",
        email: "admin@ptsan.co.id",
        hashedPassword,
        role: Role.SUPER_ADMIN,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "dewi.hr@ptsan.co.id" },
      update: {},
      create: {
        name: "Dewi Lestari",
        email: "dewi.hr@ptsan.co.id",
        hashedPassword,
        role: Role.HR_ADMIN,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "budi.mgr@ptsan.co.id" },
      update: {},
      create: {
        name: "Budi Santoso",
        email: "budi.mgr@ptsan.co.id",
        hashedPassword,
        role: Role.MANAGER,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "rina@ptsan.co.id" },
      update: {},
      create: {
        name: "Rina Wulandari",
        email: "rina@ptsan.co.id",
        hashedPassword,
        role: Role.EMPLOYEE,
        isActive: true,
      },
    }),
  ]);

  console.log(`  Users: ${users.length} upserted`);

  // ── 2. Departments ────────────────────────────────────────────────────
  const departmentData = [
    {
      name: "Penagihan",
      description: "Departemen penagihan dan collection management",
    },
    {
      name: "Keuangan",
      description: "Departemen keuangan dan akuntansi",
    },
    {
      name: "SDM",
      description: "Departemen sumber daya manusia",
    },
  ];

  const departments: Record<string, string> = {};
  for (const dept of departmentData) {
    const existing = await prisma.department.findFirst({
      where: { name: dept.name, deletedAt: null },
    });
    if (existing) {
      departments[dept.name] = existing.id;
    } else {
      const created = await prisma.department.create({ data: dept });
      departments[dept.name] = created.id;
    }
  }

  console.log(`  Departments: ${Object.keys(departments).length} seeded`);

  // ── 3. Positions ──────────────────────────────────────────────────────
  const positionData = [
    { name: "Kepala Penagihan", departmentName: "Penagihan" },
    { name: "Staff Penagihan", departmentName: "Penagihan" },
    { name: "Kepala Keuangan", departmentName: "Keuangan" },
    { name: "Staff Keuangan", departmentName: "Keuangan" },
    { name: "Staff SDM", departmentName: "SDM" },
  ];

  let positionCount = 0;
  for (const pos of positionData) {
    const departmentId = departments[pos.departmentName];
    const existing = await prisma.position.findFirst({
      where: { name: pos.name, departmentId, deletedAt: null },
    });
    if (!existing) {
      await prisma.position.create({
        data: { name: pos.name, departmentId },
      });
      positionCount++;
    } else {
      positionCount++;
    }
  }

  console.log(`  Positions: ${positionCount} seeded`);

  // ── 4. Office Locations ───────────────────────────────────────────────
  const locationData = [
    {
      name: "Kantor Pusat Jakarta",
      address: "Jl. Sudirman No. 123, Jakarta Selatan",
      allowedIPs: ["192.168.1.0/24"],
      latitude: -6.2088,
      longitude: 106.8456,
      radiusMeters: 200,
    },
    {
      name: "Kantor Cabang Bekasi",
      address: "Jl. Ahmad Yani No. 45, Bekasi",
      allowedIPs: ["10.0.0.0/24"],
      latitude: -6.2383,
      longitude: 106.9756,
      radiusMeters: 150,
    },
  ];

  let locationCount = 0;
  for (const loc of locationData) {
    const existing = await prisma.officeLocation.findFirst({
      where: { name: loc.name, deletedAt: null },
    });
    if (!existing) {
      await prisma.officeLocation.create({ data: loc });
    }
    locationCount++;
  }

  console.log(`  Office Locations: ${locationCount} seeded`);

  // ── 5. Leave Types ────────────────────────────────────────────────────
  const leaveTypeData = [
    {
      name: "Cuti Tahunan",
      annualQuota: 12,
      isPaid: true,
      genderRestriction: null,
    },
    {
      name: "Cuti Sakit",
      annualQuota: 14,
      isPaid: true,
      genderRestriction: null,
    },
    {
      name: "Cuti Melahirkan",
      annualQuota: 90,
      isPaid: true,
      genderRestriction: "FEMALE",
    },
    {
      name: "Cuti Ayah",
      annualQuota: 2,
      isPaid: true,
      genderRestriction: "MALE",
    },
  ];

  let leaveCount = 0;
  for (const lt of leaveTypeData) {
    const existing = await prisma.leaveType.findFirst({
      where: { name: lt.name, deletedAt: null },
    });
    if (!existing) {
      await prisma.leaveType.create({ data: lt });
    }
    leaveCount++;
  }

  console.log(`  Leave Types: ${leaveCount} seeded`);

  // ── 6. Positions lookup (for employee assignment) ────────────────────
  const positionsMap: Record<string, string> = {};
  for (const pos of positionData) {
    const found = await prisma.position.findFirst({
      where: { name: pos.name, departmentId: departments[pos.departmentName], deletedAt: null },
    });
    if (found) {
      positionsMap[pos.name] = found.id;
    }
  }

  // ── 7. Employees for existing users ─────────────────────────────────
  // Link existing seeded users to employee records
  const existingUserEmployees = [
    {
      nik: "EMP-2026-0001",
      email: "dewi.hr@ptsan.co.id",
      namaLengkap: "Dewi Lestari",
      departmentName: "SDM",
      positionName: "Staff SDM",
      contractType: ContractType.PKWTT,
      joinDate: new Date("2024-01-15"),
      jenisKelamin: Gender.FEMALE,
      agama: Religion.ISLAM,
      statusPernikahan: MaritalStatus.K,
      ptkpStatus: PTKPStatus.K_1,
    },
    {
      nik: "EMP-2026-0002",
      email: "budi.mgr@ptsan.co.id",
      namaLengkap: "Budi Santoso",
      departmentName: "Penagihan",
      positionName: "Kepala Penagihan",
      contractType: ContractType.PKWTT,
      joinDate: new Date("2023-06-01"),
      jenisKelamin: Gender.MALE,
      agama: Religion.ISLAM,
      statusPernikahan: MaritalStatus.K,
      ptkpStatus: PTKPStatus.K_2,
    },
    {
      nik: "EMP-2026-0003",
      email: "rina@ptsan.co.id",
      namaLengkap: "Rina Wulandari",
      departmentName: "Keuangan",
      positionName: "Staff Keuangan",
      contractType: ContractType.PKWT,
      joinDate: new Date("2025-03-01"),
      jenisKelamin: Gender.FEMALE,
      agama: Religion.KRISTEN,
      statusPernikahan: MaritalStatus.TK,
      ptkpStatus: PTKPStatus.TK_0,
    },
  ];

  let employeeCount = 0;
  for (const emp of existingUserEmployees) {
    const existing = await prisma.employee.findFirst({
      where: { nik: emp.nik },
    });
    if (!existing) {
      const user = await prisma.user.findUnique({
        where: { email: emp.email },
      });
      if (user) {
        // Check if user already has an employee record
        const existingByUser = await prisma.employee.findFirst({
          where: { userId: user.id },
        });
        if (!existingByUser) {
          await prisma.employee.create({
            data: {
              nik: emp.nik,
              userId: user.id,
              namaLengkap: emp.namaLengkap,
              email: emp.email,
              departmentId: departments[emp.departmentName],
              positionId: positionsMap[emp.positionName],
              contractType: emp.contractType,
              joinDate: emp.joinDate,
              jenisKelamin: emp.jenisKelamin,
              agama: emp.agama,
              statusPernikahan: emp.statusPernikahan,
              ptkpStatus: emp.ptkpStatus,
            },
          });
          employeeCount++;
        }
      }
    } else {
      employeeCount++;
    }
  }

  console.log(`  Employees (existing users): ${employeeCount} seeded`);

  // ── 8. Additional test employees with new User accounts ─────────────
  const additionalEmployees = [
    {
      nik: "EMP-2026-0004",
      email: "ahmad.p@ptsan.co.id",
      name: "Ahmad Prasetyo",
      departmentName: "Penagihan",
      positionName: "Staff Penagihan",
      contractType: ContractType.PKWTT,
      joinDate: new Date("2024-03-15"),
      jenisKelamin: Gender.MALE,
      agama: Religion.ISLAM,
      statusPernikahan: MaritalStatus.K,
      ptkpStatus: PTKPStatus.K_1,
      nikKtp: "3201012345670001",
      bpjsKesehatanNo: "0001234567890",
      bpjsKetenagakerjaanNo: "JKT-2024-001234",
      npwp: "12.345.678.9-012.000",
      tempatLahir: "Jakarta",
      tanggalLahir: new Date("1990-05-12"),
      alamat: "Jl. Kebon Jeruk No. 10, Jakarta Barat",
      nomorHp: "081234567890",
    },
    {
      nik: "EMP-2026-0005",
      email: "siti.n@ptsan.co.id",
      name: "Siti Nurhaliza",
      departmentName: "Keuangan",
      positionName: "Kepala Keuangan",
      contractType: ContractType.PKWTT,
      joinDate: new Date("2023-01-10"),
      jenisKelamin: Gender.FEMALE,
      agama: Religion.ISLAM,
      statusPernikahan: MaritalStatus.K,
      ptkpStatus: PTKPStatus.K_0,
      nikKtp: "3201012345670002",
      bpjsKesehatanNo: "0001234567891",
      bpjsKetenagakerjaanNo: "JKT-2023-005678",
      npwp: "23.456.789.0-012.000",
      tempatLahir: "Bandung",
      tanggalLahir: new Date("1988-11-20"),
      alamat: "Jl. Cikini Raya No. 55, Jakarta Pusat",
      nomorHp: "081234567891",
    },
    {
      nik: "EMP-2026-0006",
      email: "doni.s@ptsan.co.id",
      name: "Doni Setiawan",
      departmentName: "Penagihan",
      positionName: "Staff Penagihan",
      contractType: ContractType.PKWT,
      joinDate: new Date("2025-06-01"),
      jenisKelamin: Gender.MALE,
      agama: Religion.KATOLIK,
      statusPernikahan: MaritalStatus.TK,
      ptkpStatus: PTKPStatus.TK_0,
      // Minimal data - no KTP, BPJS, etc.
    },
    {
      nik: "EMP-2026-0007",
      email: "maya.r@ptsan.co.id",
      name: "Maya Rahayu",
      departmentName: "SDM",
      positionName: "Staff SDM",
      contractType: ContractType.PKWT,
      joinDate: new Date("2025-01-15"),
      jenisKelamin: Gender.FEMALE,
      agama: Religion.HINDU,
      statusPernikahan: MaritalStatus.TK,
      ptkpStatus: PTKPStatus.TK_0,
      nomorHp: "081234567893",
    },
    {
      nik: "EMP-2026-0008",
      email: "hendro.w@ptsan.co.id",
      name: "Hendro Wijaya",
      departmentName: "Keuangan",
      positionName: "Staff Keuangan",
      contractType: ContractType.PKWTT,
      joinDate: new Date("2023-09-01"),
      jenisKelamin: Gender.MALE,
      agama: Religion.BUDDHA,
      statusPernikahan: MaritalStatus.K,
      ptkpStatus: PTKPStatus.K_3,
      nikKtp: "3201012345670005",
      npwp: "34.567.890.1-012.000",
      tempatLahir: "Surabaya",
      tanggalLahir: new Date("1985-03-25"),
      alamat: "Jl. Gatot Subroto No. 88, Jakarta Selatan",
      nomorHp: "081234567894",
      // This employee is INACTIVE
      isActive: false,
      terminationDate: new Date("2025-12-31"),
      terminationReason: "Kontrak tidak diperpanjang",
    },
  ];

  const additionalPassword = await hash("Karyawan123!", 12);
  let additionalCount = 0;

  for (const emp of additionalEmployees) {
    const existingEmp = await prisma.employee.findFirst({
      where: { nik: emp.nik },
    });
    if (existingEmp) {
      additionalCount++;
      continue;
    }

    // Create user first
    const existingUser = await prisma.user.findUnique({
      where: { email: emp.email },
    });

    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
    } else {
      const newUser = await prisma.user.create({
        data: {
          name: emp.name,
          email: emp.email,
          hashedPassword: additionalPassword,
          role: Role.EMPLOYEE,
          isActive: emp.isActive !== false,
        },
      });
      userId = newUser.id;
    }

    // Check if user already has employee record
    const existingByUser = await prisma.employee.findFirst({
      where: { userId },
    });
    if (!existingByUser) {
      await prisma.employee.create({
        data: {
          nik: emp.nik,
          userId,
          namaLengkap: emp.name,
          email: emp.email,
          departmentId: departments[emp.departmentName],
          positionId: positionsMap[emp.positionName],
          contractType: emp.contractType,
          joinDate: emp.joinDate,
          jenisKelamin: emp.jenisKelamin,
          agama: emp.agama,
          statusPernikahan: emp.statusPernikahan,
          ptkpStatus: emp.ptkpStatus,
          nikKtp: emp.nikKtp ?? null,
          bpjsKesehatanNo: emp.bpjsKesehatanNo ?? null,
          bpjsKetenagakerjaanNo: emp.bpjsKetenagakerjaanNo ?? null,
          npwp: emp.npwp ?? null,
          tempatLahir: emp.tempatLahir ?? null,
          tanggalLahir: emp.tanggalLahir ?? null,
          alamat: emp.alamat ?? null,
          nomorHp: emp.nomorHp ?? null,
          isActive: emp.isActive !== false,
          terminationDate: emp.terminationDate ?? null,
          terminationReason: emp.terminationReason ?? null,
        },
      });
    }
    additionalCount++;
  }

  console.log(`  Additional employees: ${additionalCount} seeded`);

  // ── 9. Emergency Contacts ───────────────────────────────────────────
  // Add emergency contacts for Ahmad and Siti
  const ahmadEmp = await prisma.employee.findFirst({
    where: { nik: "EMP-2026-0004" },
  });
  const sitiEmp = await prisma.employee.findFirst({
    where: { nik: "EMP-2026-0005" },
  });

  let ecCount = 0;
  if (ahmadEmp) {
    const existing = await prisma.emergencyContact.findFirst({
      where: { employeeId: ahmadEmp.id },
    });
    if (!existing) {
      await prisma.emergencyContact.create({
        data: {
          employeeId: ahmadEmp.id,
          name: "Sari Prasetyo",
          relationship: "Istri",
          phone: "081298765432",
          address: "Jl. Kebon Jeruk No. 10, Jakarta Barat",
        },
      });
      ecCount++;
    }
  }
  if (sitiEmp) {
    const existing = await prisma.emergencyContact.findFirst({
      where: { employeeId: sitiEmp.id },
    });
    if (!existing) {
      await prisma.emergencyContact.create({
        data: {
          employeeId: sitiEmp.id,
          name: "Hasan Nurhaliza",
          relationship: "Suami",
          phone: "081387654321",
          address: "Jl. Cikini Raya No. 55, Jakarta Pusat",
        },
      });
      ecCount++;
    }
  }

  console.log(`  Emergency Contacts: ${ecCount} seeded`);

  // ── 10. Attendance Records (Phase 3) ──────────────────────────────────
  // Seed 5 weekday records (Mon-Fri of last week) for active employees
  // clockIn: 08:00 WIB = 01:00 UTC; clockOut: 17:00 WIB = 10:00 UTC
  // One record per week has isLate=true (Wednesday, clockIn at 08:35 WIB = 01:35 UTC)

  const officeLocation = await prisma.officeLocation.findFirst({
    where: { deletedAt: null },
    select: { id: true },
  });

  let attendanceCount = 0;
  if (officeLocation) {
    // Find all active employees (excluding the inactive one EMP-2026-0008)
    const activeEmployees = await prisma.employee.findMany({
      where: { isActive: true },
      select: { id: true, nik: true },
    });

    // Last week Mon-Fri: calculate dynamically from today
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    // Days since last Monday (if today is Mon=1, go back 7; if Fri=5, go back 11)
    const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek + 6;
    const lastMonday = new Date(today);
    lastMonday.setUTCDate(today.getUTCDate() - daysToLastMonday);
    lastMonday.setUTCHours(0, 0, 0, 0);

    // Define last week's weekdays
    const weekdays = [0, 1, 2, 3, 4].map((offset) => {
      const d = new Date(lastMonday);
      d.setUTCDate(lastMonday.getUTCDate() + offset);
      return d;
    });

    for (const employee of activeEmployees) {
      for (let i = 0; i < weekdays.length; i++) {
        const date = weekdays[i];
        const isWednesday = i === 2; // Wednesday = index 2 (late record)

        const existing = await prisma.attendanceRecord.findFirst({
          where: { employeeId: employee.id, date },
        });
        if (existing) {
          attendanceCount++;
          continue;
        }

        // clockIn: 08:00 WIB = 01:00 UTC (on-time), or 08:35 WIB = 01:35 UTC (late)
        const clockIn = new Date(date);
        if (isWednesday) {
          clockIn.setUTCHours(1, 35, 0, 0); // 08:35 WIB
        } else {
          clockIn.setUTCHours(1, 0, 0, 0); // 08:00 WIB
        }

        // clockOut: 17:00 WIB = 10:00 UTC
        const clockOut = new Date(date);
        clockOut.setUTCHours(10, 0, 0, 0);

        const totalMinutes = (clockOut.getTime() - clockIn.getTime()) / 60000;
        const lateMinutes = isWednesday ? 35 : 0;
        const earlyOutMinutes = 0;
        const overtimeMinutes = 0;

        await prisma.attendanceRecord.create({
          data: {
            employeeId: employee.id,
            officeLocationId: officeLocation.id,
            date,
            clockIn,
            clockOut,
            isLate: isWednesday,
            lateMinutes,
            isEarlyOut: false,
            earlyOutMinutes,
            overtimeMinutes,
            totalMinutes,
          },
        });
        attendanceCount++;
      }
    }
  } else {
    console.log("  Skipping attendance records: no office location found");
  }

  console.log(`  Attendance Records: ${attendanceCount} seeded`);

  // ── 11. Leave Balances (Phase 3) ──────────────────────────────────────
  // Ensure leave balances exist for all active employees for current year
  const currentYear = new Date().getFullYear();
  const allLeaveTypes = await prisma.leaveType.findMany({
    where: { deletedAt: null },
    select: { id: true, annualQuota: true },
  });

  const activeEmployeesForBalance = await prisma.employee.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  let balanceCount = 0;
  for (const emp of activeEmployeesForBalance) {
    for (const lt of allLeaveTypes) {
      await prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: emp.id,
            leaveTypeId: lt.id,
            year: currentYear,
          },
        },
        create: {
          employeeId: emp.id,
          leaveTypeId: lt.id,
          year: currentYear,
          allocatedDays: lt.annualQuota,
          usedDays: 0,
        },
        update: {},
      });
      balanceCount++;
    }
  }

  console.log(`  Leave Balances: ${balanceCount} upserted`);

  // ── 12. Leave Requests (Phase 3) ──────────────────────────────────────
  // Add one PENDING leave request for the main employee test user (Rina)
  // and one additional for Ahmad to show variety

  const annualLeaveType = await prisma.leaveType.findFirst({
    where: { name: "Cuti Tahunan", deletedAt: null },
    select: { id: true },
  });

  const rinaEmployee = await prisma.employee.findFirst({
    where: { nik: "EMP-2026-0003" },
    select: { id: true },
  });

  const ahmadEmployee = await prisma.employee.findFirst({
    where: { nik: "EMP-2026-0004" },
    select: { id: true },
  });

  let leaveRequestCount = 0;

  if (rinaEmployee && annualLeaveType) {
    // Rina's PENDING leave request: next week Mon-Tue
    const nextMonday = new Date();
    const dWk = nextMonday.getDay();
    const daysUntilNextMonday = dWk === 0 ? 1 : 8 - dWk;
    nextMonday.setDate(nextMonday.getDate() + daysUntilNextMonday);
    nextMonday.setUTCHours(0, 0, 0, 0);
    const nextTuesday = new Date(nextMonday);
    nextTuesday.setUTCDate(nextMonday.getUTCDate() + 1);

    const existingRina = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: rinaEmployee.id,
        status: "PENDING",
        leaveTypeId: annualLeaveType.id,
      },
    });
    if (!existingRina) {
      await prisma.leaveRequest.create({
        data: {
          employeeId: rinaEmployee.id,
          leaveTypeId: annualLeaveType.id,
          startDate: nextMonday,
          endDate: nextTuesday,
          workingDays: 2,
          reason: "Keperluan keluarga",
          status: "PENDING",
        },
      });
      leaveRequestCount++;
    }
  }

  if (ahmadEmployee && annualLeaveType) {
    // Ahmad's PENDING leave request: next Wednesday
    const nextWed = new Date();
    const dWk2 = nextWed.getDay();
    const daysUntilWed = dWk2 <= 3 ? 3 - dWk2 + 7 : 10 - dWk2;
    nextWed.setDate(nextWed.getDate() + daysUntilWed);
    nextWed.setUTCHours(0, 0, 0, 0);

    const existingAhmad = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: ahmadEmployee.id,
        status: "PENDING",
        leaveTypeId: annualLeaveType.id,
      },
    });
    if (!existingAhmad) {
      await prisma.leaveRequest.create({
        data: {
          employeeId: ahmadEmployee.id,
          leaveTypeId: annualLeaveType.id,
          startDate: nextWed,
          endDate: nextWed,
          workingDays: 1,
          reason: "Urusan pribadi",
          status: "PENDING",
        },
      });
      leaveRequestCount++;
    }
  }

  console.log(`  Leave Requests: ${leaveRequestCount} seeded`);

  // ── Summary ───────────────────────────────────────────────────────────
  console.log(
    `\nSeed complete: ${users.length} users, ${Object.keys(departments).length} departments, ${positionCount} positions, ${locationCount} locations, ${leaveCount} leave types, ${employeeCount + additionalCount} employees, ${ecCount} emergency contacts, ${attendanceCount} attendance records, ${balanceCount} leave balances, ${leaveRequestCount} leave requests`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
