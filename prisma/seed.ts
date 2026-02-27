import { PrismaClient, Role } from "../src/generated/prisma/client";
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

  // ── Summary ───────────────────────────────────────────────────────────
  console.log(
    `\nSeed complete: ${users.length} users, ${Object.keys(departments).length} departments, ${positionCount} positions, ${locationCount} locations, ${leaveCount} leave types`
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
