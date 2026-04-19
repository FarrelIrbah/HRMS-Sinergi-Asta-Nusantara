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
import Decimal from "decimal.js";

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
      // Dev seed: allowedIPs empty = allow all; GPS null = skip radius check
      allowedIPs: [] as string[],
      latitude: null,
      longitude: null,
      radiusMeters: null,
    },
    {
      name: "Kantor Cabang Bekasi",
      address: "Jl. Ahmad Yani No. 45, Bekasi",
      allowedIPs: [] as string[],
      latitude: null,
      longitude: null,
      radiusMeters: null,
    },
  ];

  let locationCount = 0;
  for (const loc of locationData) {
    const existing = await prisma.officeLocation.findFirst({
      where: { name: loc.name, deletedAt: null },
    });
    if (!existing) {
      await prisma.officeLocation.create({ data: loc });
    } else {
      // Update existing to dev-permissive config
      await prisma.officeLocation.update({
        where: { id: existing.id },
        data: {
          allowedIPs: loc.allowedIPs,
          latitude: loc.latitude,
          longitude: loc.longitude,
          radiusMeters: loc.radiusMeters,
        },
      });
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

  // ── 9b. Assign officeLocationId to employees that don't have one ──────
  // Ensures clock-in/out works for all seeded employees
  const defaultOffice = await prisma.officeLocation.findFirst({
    where: { deletedAt: null },
    select: { id: true },
  });
  if (defaultOffice) {
    const assigned = await prisma.employee.updateMany({
      where: { officeLocationId: null, isActive: true },
      data: { officeLocationId: defaultOffice.id },
    });
    if (assigned.count > 0) {
      console.log(`  Office location assigned to ${assigned.count} employees`);
    }
  }

  // ── 10. Attendance Records (Phase 3 — enhanced) ────────────────────────
  // Seed 4 weeks of weekday attendance with realistic variety per employee

  const officeLocation = await prisma.officeLocation.findFirst({
    where: { deletedAt: null },
    select: { id: true },
  });

  let attendanceCount = 0;
  if (officeLocation) {
    const activeEmployees = await prisma.employee.findMany({
      where: { isActive: true },
      select: { id: true, nik: true },
    });

    // Helper: generate weekdays for a given week offset (0 = current, -1 = last, etc.)
    const getWeekdays = (weekOffset: number): Date[] => {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0=Sun..6=Sat
      // Monday of current week
      const currentMonday = new Date(today);
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      currentMonday.setUTCDate(today.getUTCDate() - daysFromMonday + weekOffset * 7);
      currentMonday.setUTCHours(0, 0, 0, 0);

      const days: Date[] = [];
      for (let i = 0; i < 5; i++) {
        const d = new Date(currentMonday);
        d.setUTCDate(currentMonday.getUTCDate() + i);
        // Don't include future dates
        if (d <= today) days.push(d);
      }
      return days;
    }

    // Attendance patterns per employee index for variety
    // Pattern: [clockInHour, clockInMin, clockOutHour, clockOutMin]
    // Hours in UTC (WIB - 7)
    type DayPattern = { inH: number; inM: number; outH: number; outM: number };
    const patterns: DayPattern[][] = [
      // Pattern 0: Punctual employee, occasional late Wed
      [
        { inH: 0, inM: 58, outH: 10, outM: 5 },   // Mon 07:58 - 17:05
        { inH: 1, inM: 0, outH: 10, outM: 0 },     // Tue 08:00 - 17:00
        { inH: 1, inM: 25, outH: 10, outM: 0 },    // Wed 08:25 LATE
        { inH: 0, inM: 55, outH: 10, outM: 0 },    // Thu 07:55 - 17:00
        { inH: 1, inM: 0, outH: 11, outM: 30 },    // Fri overtime 18:30
      ],
      // Pattern 1: Sometimes late, sometimes early out
      [
        { inH: 1, inM: 0, outH: 9, outM: 30 },     // Mon early out 16:30
        { inH: 1, inM: 40, outH: 10, outM: 0 },    // Tue 08:40 LATE
        { inH: 1, inM: 0, outH: 10, outM: 0 },     // Wed on-time
        { inH: 1, inM: 15, outH: 10, outM: 0 },    // Thu 08:15 LATE
        { inH: 1, inM: 0, outH: 10, outM: 0 },     // Fri on-time
      ],
      // Pattern 2: Overtime lover
      [
        { inH: 0, inM: 50, outH: 11, outM: 0 },    // Mon OT 18:00
        { inH: 1, inM: 0, outH: 10, outM: 0 },     // Tue on-time
        { inH: 1, inM: 0, outH: 11, outM: 30 },    // Wed OT 18:30
        { inH: 1, inM: 0, outH: 10, outM: 0 },     // Thu on-time
        { inH: 0, inM: 45, outH: 12, outM: 0 },    // Fri OT 19:00
      ],
      // Pattern 3: Mixed
      [
        { inH: 1, inM: 0, outH: 10, outM: 0 },     // Mon on-time
        { inH: 1, inM: 0, outH: 10, outM: 0 },     // Tue on-time
        { inH: 1, inM: 30, outH: 10, outM: 0 },    // Wed 08:30 LATE
        { inH: 1, inM: 0, outH: 9, outM: 45 },     // Thu early out 16:45
        { inH: 1, inM: 5, outH: 10, outM: 15 },    // Fri slightly late + slightly OT
      ],
    ];

    const weeks = [-3, -2, -1, 0]; // 4 weeks

    for (let empIdx = 0; empIdx < activeEmployees.length; empIdx++) {
      const employee = activeEmployees[empIdx];
      const patternSet = patterns[empIdx % patterns.length];

      for (const weekOffset of weeks) {
        const weekdays = getWeekdays(weekOffset);
        for (let dayIdx = 0; dayIdx < weekdays.length; dayIdx++) {
          const date = weekdays[dayIdx];
          const pattern = patternSet[dayIdx % patternSet.length];

          // Add slight random variation per week to avoid identical data
          const minuteJitter = (weekOffset + empIdx) % 3 === 0 ? 5 : 0;

          const existing = await prisma.attendanceRecord.findFirst({
            where: { employeeId: employee.id, date },
          });
          if (existing) {
            attendanceCount++;
            continue;
          }

          const clockIn = new Date(date);
          clockIn.setUTCHours(pattern.inH, pattern.inM + minuteJitter, 0, 0);

          const clockOut = new Date(date);
          clockOut.setUTCHours(pattern.outH, pattern.outM, 0, 0);

          const totalMinutes = Math.round(
            (clockOut.getTime() - clockIn.getTime()) / 60000
          );

          // Work hours: 08:00-17:00 WIB = 01:00-10:00 UTC (540 min)
          // Late if clockIn > 01:00 UTC (08:00 WIB)
          const clockInMinFromStart = (pattern.inH * 60 + pattern.inM + minuteJitter) - 60; // minutes after 01:00 UTC
          const isLate = clockInMinFromStart > 0;
          const lateMinutes = isLate ? clockInMinFromStart : 0;

          // Early out if clockOut < 10:00 UTC (17:00 WIB)
          const clockOutMinFromEnd = 600 - (pattern.outH * 60 + pattern.outM); // minutes before 10:00 UTC
          const isEarlyOut = clockOutMinFromEnd > 0;
          const earlyOutMinutes = isEarlyOut ? clockOutMinFromEnd : 0;

          // Overtime if clockOut > 10:00 UTC (17:00 WIB)
          const overtimeMinutes =
            pattern.outH * 60 + pattern.outM > 600
              ? pattern.outH * 60 + pattern.outM - 600
              : 0;

          await prisma.attendanceRecord.create({
            data: {
              employeeId: employee.id,
              officeLocationId: officeLocation.id,
              date,
              clockIn,
              clockOut,
              isLate,
              lateMinutes,
              isEarlyOut,
              earlyOutMinutes,
              overtimeMinutes,
              totalMinutes,
            },
          });
          attendanceCount++;
        }
      }
    }
  } else {
    console.log("  Skipping attendance records: no office location found");
  }

  console.log(`  Attendance Records: ${attendanceCount} seeded`);

  // ── 11. Leave Balances (Phase 3) ──────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const allLeaveTypes = await prisma.leaveType.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, annualQuota: true },
  });

  const activeEmployeesForBalance = await prisma.employee.findMany({
    where: { isActive: true },
    select: { id: true, nik: true },
  });

  // Pre-define used days per employee (nik → leaveTypeName → usedDays)
  const usedDaysMap: Record<string, Record<string, number>> = {
    "EMP-2026-0001": { "Cuti Tahunan": 3, "Cuti Sakit": 1 },
    "EMP-2026-0002": { "Cuti Tahunan": 2 },
    "EMP-2026-0003": { "Cuti Tahunan": 4, "Cuti Sakit": 2 },
    "EMP-2026-0004": { "Cuti Tahunan": 1 },
    "EMP-2026-0005": { "Cuti Tahunan": 5, "Cuti Sakit": 1 },
    "EMP-2026-0006": { "Cuti Tahunan": 0 },
    "EMP-2026-0007": { "Cuti Sakit": 1 },
  };

  let balanceCount = 0;
  for (const emp of activeEmployeesForBalance) {
    for (const lt of allLeaveTypes) {
      const usedDays = usedDaysMap[emp.nik]?.[lt.name] ?? 0;
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
          usedDays,
        },
        update: { usedDays },
      });
      balanceCount++;
    }
  }

  console.log(`  Leave Balances: ${balanceCount} upserted`);

  // ── 12. Leave Requests (Phase 3 — enhanced) ──────────────────────────
  // Diverse leave requests across employees with various statuses

  // Clear existing leave requests to re-seed cleanly
  await prisma.leaveRequest.deleteMany({});

  const leaveTypeMap: Record<string, string> = {};
  for (const lt of allLeaveTypes) {
    leaveTypeMap[lt.name] = lt.id;
  }

  const employeesByNik: Record<string, string> = {};
  for (const emp of activeEmployeesForBalance) {
    employeesByNik[emp.nik] = emp.id;
  }

  // Find the HR admin user for approvedBy
  const hrAdminUser = await prisma.user.findUnique({
    where: { email: "dewi.hr@ptsan.co.id" },
    select: { id: true },
  });

  const today = new Date();
  const makeDate = (daysFromToday: number) => {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() + daysFromToday);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  };

  const leaveSeeds = [
    // Dewi (EMP-0001) — 3 Cuti Tahunan approved (past), 1 Cuti Sakit approved
    {
      nik: "EMP-2026-0001", type: "Cuti Tahunan", start: -30, end: -28,
      days: 3, status: "APPROVED" as const, reason: "Liburan keluarga ke Bali",
      notes: "Disetujui", approvedDaysAgo: 35,
    },
    {
      nik: "EMP-2026-0001", type: "Cuti Sakit", start: -14, end: -14,
      days: 1, status: "APPROVED" as const, reason: "Demam tinggi, istirahat dokter",
      notes: "Semoga lekas sembuh", approvedDaysAgo: 14,
    },
    // Budi (EMP-0002) — 2 Cuti Tahunan approved, 1 rejected
    {
      nik: "EMP-2026-0002", type: "Cuti Tahunan", start: -21, end: -20,
      days: 2, status: "APPROVED" as const, reason: "Acara pernikahan saudara",
      notes: "Disetujui", approvedDaysAgo: 25,
    },
    {
      nik: "EMP-2026-0002", type: "Cuti Tahunan", start: 5, end: 9,
      days: 5, status: "REJECTED" as const, reason: "Mudik lebaran lebih awal",
      notes: "Periode tersebut sedang high season, mohon ajukan tanggal lain",
      approvedDaysAgo: 2,
    },
    // Rina (EMP-0003) — 4 Cuti Tahunan approved (past), 2 Sakit, 1 PENDING, 1 CANCELLED
    {
      nik: "EMP-2026-0003", type: "Cuti Tahunan", start: -45, end: -42,
      days: 4, status: "APPROVED" as const, reason: "Wisuda adik di Yogyakarta",
      notes: "Disetujui", approvedDaysAgo: 50,
    },
    {
      nik: "EMP-2026-0003", type: "Cuti Sakit", start: -10, end: -9,
      days: 2, status: "APPROVED" as const, reason: "Sakit flu berat, surat dokter terlampir",
      notes: "Semoga lekas sembuh", approvedDaysAgo: 10,
    },
    {
      nik: "EMP-2026-0003", type: "Cuti Tahunan", start: 7, end: 8,
      days: 2, status: "PENDING" as const, reason: "Keperluan keluarga",
    },
    {
      nik: "EMP-2026-0003", type: "Cuti Tahunan", start: 14, end: 14,
      days: 1, status: "CANCELLED" as const, reason: "Urusan pribadi (dibatalkan)",
    },
    // Ahmad (EMP-0004) — 1 approved, 1 PENDING
    {
      nik: "EMP-2026-0004", type: "Cuti Tahunan", start: -7, end: -7,
      days: 1, status: "APPROVED" as const, reason: "Mengurus surat-surat",
      notes: "Disetujui", approvedDaysAgo: 10,
    },
    {
      nik: "EMP-2026-0004", type: "Cuti Tahunan", start: 10, end: 10,
      days: 1, status: "PENDING" as const, reason: "Urusan pribadi",
    },
    // Siti (EMP-0005) — 5 Cuti Tahunan approved, 1 Sakit
    {
      nik: "EMP-2026-0005", type: "Cuti Tahunan", start: -60, end: -56,
      days: 5, status: "APPROVED" as const, reason: "Liburan akhir tahun",
      notes: "Disetujui", approvedDaysAgo: 65,
    },
    {
      nik: "EMP-2026-0005", type: "Cuti Sakit", start: -5, end: -5,
      days: 1, status: "APPROVED" as const, reason: "Migrain, perlu istirahat",
      notes: "Disetujui", approvedDaysAgo: 5,
    },
    // Doni (EMP-0006) — 1 PENDING
    {
      nik: "EMP-2026-0006", type: "Cuti Tahunan", start: 3, end: 4,
      days: 2, status: "PENDING" as const, reason: "Menghadiri acara keluarga di Semarang",
    },
    // Maya (EMP-0007) — 1 Sakit approved
    {
      nik: "EMP-2026-0007", type: "Cuti Sakit", start: -3, end: -3,
      days: 1, status: "APPROVED" as const, reason: "Sakit perut, rawat jalan",
      notes: "Disetujui", approvedDaysAgo: 3,
    },
  ];

  let leaveRequestCount = 0;
  for (const ls of leaveSeeds) {
    const employeeId = employeesByNik[ls.nik];
    const leaveTypeId = leaveTypeMap[ls.type];
    if (!employeeId || !leaveTypeId) continue;

    await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId,
        startDate: makeDate(ls.start),
        endDate: makeDate(ls.end),
        workingDays: ls.days,
        status: ls.status,
        reason: ls.reason,
        approverNotes: ls.notes ?? null,
        approvedById:
          ls.status === "APPROVED" || ls.status === "REJECTED"
            ? hrAdminUser?.id ?? null
            : null,
        approvedAt:
          ls.approvedDaysAgo != null
            ? makeDate(-ls.approvedDaysAgo)
            : null,
      },
    });
    leaveRequestCount++;
  }

  console.log(`  Leave Requests: ${leaveRequestCount} seeded`);

  // ── 13. Employee Salaries (Phase 4) ───────────────────────────────────
  console.log("Seeding employee salaries...");
  // Give all employees without a salary a default base salary
  const salaryDefaultResult = await prisma.employee.updateMany({
    where: { baseSalary: 0 },
    data: { baseSalary: 5000000 },
  });
  if (salaryDefaultResult.count > 0) {
    console.log(`  Default baseSalary set for ${salaryDefaultResult.count} employees`);
  }

  // Distinct salaries for the first three seeded employees for meaningful payroll test data
  const salaryOverrides = [
    { nik: "EMP-2026-0001", baseSalary: 8000000 },
    { nik: "EMP-2026-0002", baseSalary: 6500000 },
    { nik: "EMP-2026-0003", baseSalary: 7200000 },
  ];

  let allowanceCount = 0;
  for (const override of salaryOverrides) {
    const emp = await prisma.employee.findFirst({ where: { nik: override.nik } });
    if (emp) {
      await prisma.employee.update({
        where: { id: emp.id },
        data: { baseSalary: override.baseSalary },
      });
      // Add a transport allowance if none exists
      const existing = await prisma.employeeAllowance.findFirst({
        where: { employeeId: emp.id },
      });
      if (!existing) {
        await prisma.employeeAllowance.create({
          data: {
            employeeId: emp.id,
            name: "Tunjangan Transport",
            amount: 500000,
            isFixed: true,
          },
        });
        allowanceCount++;
      }
    }
  }

  console.log(`  Salary overrides applied: ${salaryOverrides.length} employees, ${allowanceCount} allowances added`);

  // ── 14. Recruitment seed (Phase 5) ───────────────────────────────────
  console.log("Seeding recruitment data...");

  // Use the first active department found
  const seedDeptId = Object.values(departments)[0];

  // Create 2 vacancies
  const vacancy1 =
    (await prisma.vacancy.findFirst({ where: { title: "Frontend Developer" } })) ??
    (await prisma.vacancy.create({
      data: {
        title: "Frontend Developer",
        departmentId: seedDeptId,
        description:
          "Kami mencari Frontend Developer yang berpengalaman dengan React dan Next.js.",
        requirements:
          "Minimal 2 tahun pengalaman React, familiar dengan TypeScript dan Tailwind CSS.",
        status: "OPEN",
        openDate: new Date("2026-03-01"),
      },
    }));

  const vacancy2 =
    (await prisma.vacancy.findFirst({ where: { title: "HR Specialist" } })) ??
    (await prisma.vacancy.create({
      data: {
        title: "HR Specialist",
        departmentId: seedDeptId,
        description: "Mencari HR Specialist untuk mendukung operasional HRD.",
        requirements:
          "Pengalaman minimal 1 tahun di bidang HR, menguasai administrasi kepegawaian.",
        status: "OPEN",
        openDate: new Date("2026-03-05"),
      },
    }));

  // Create candidates across different stages
  const candidateSeeds = [
    {
      name: "Budi Santoso",
      email: "budi@example.com",
      stage: "SELEKSI_BERKAS",
      vacancyId: vacancy1.id,
      offerSalary: undefined as number | undefined,
    },
    {
      name: "Sari Dewi",
      email: "sari@example.com",
      stage: "INTERVIEW",
      vacancyId: vacancy1.id,
      offerSalary: undefined as number | undefined,
    },
    {
      name: "Andi Wijaya",
      email: "andi@example.com",
      stage: "PENAWARAN",
      vacancyId: vacancy1.id,
      offerSalary: 8000000,
    },
    {
      name: "Rina Putri",
      email: "rina@example.com",
      stage: "MELAMAR",
      vacancyId: vacancy2.id,
      offerSalary: undefined as number | undefined,
    },
    {
      name: "Dedi Kurniawan",
      email: "dedi@example.com",
      stage: "DITERIMA",
      vacancyId: vacancy2.id,
      offerSalary: 6000000,
    },
  ];

  let candidateCount = 0;
  for (const cs of candidateSeeds) {
    const existing = await prisma.candidate.findFirst({
      where: { email: cs.email },
    });
    if (!existing) {
      await prisma.candidate.create({
        data: {
          name: cs.name,
          email: cs.email,
          stage: cs.stage as any,
          vacancyId: cs.vacancyId,
          offerSalary: cs.offerSalary != null ? new Decimal(cs.offerSalary) : null,
        },
      });
    }
    candidateCount++;
  }

  console.log(
    `  Recruitment: 2 vacancies (Frontend Developer, HR Specialist), ${candidateCount} candidates seeded`
  );

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
