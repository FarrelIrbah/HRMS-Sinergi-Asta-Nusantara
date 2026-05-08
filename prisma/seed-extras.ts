/**
 * Seed extras — runs AFTER main seed.ts to populate:
 * - Payroll runs (1 FINALIZED prev month + 1 DRAFT current month)
 * - Audit log history (simulasi aktivitas CRUD lintas modul)
 * - Interviews untuk kandidat di stage INTERVIEW/PENAWARAN/DITERIMA
 *
 * Usage: npx tsx prisma/seed-extras.ts
 *
 * Idempotent: cek-existing-before-create di semua bagian.
 */
import "dotenv/config";
import { PrismaClient, AuditAction } from "../src/generated/prisma/client";
import Decimal from "decimal.js";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding extras (payroll + audit log + interviews)...\n");

  // ─── 1. PAYROLL RUNS ──────────────────────────────────────────────────
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    include: { department: true, position: true },
  });

  const superAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  });
  const hrAdmin = await prisma.user.findFirst({
    where: { role: "HR_ADMIN" },
  });

  if (!superAdmin || !hrAdmin) {
    console.log("  ⚠️  SUPER_ADMIN atau HR_ADMIN tidak ditemukan — skip payroll seed");
    return;
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();
  // Previous month (handle Jan rollover)
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  // ── 1a. Previous month — FINALIZED
  let finalizedRun = await prisma.payrollRun.findUnique({
    where: { month_year: { month: prevMonth, year: prevYear } },
  });
  if (!finalizedRun) {
    finalizedRun = await prisma.payrollRun.create({
      data: {
        month: prevMonth,
        year: prevYear,
        status: "FINALIZED",
        createdBy: hrAdmin.id,
      },
    });
  }

  for (const emp of employees) {
    const existing = await prisma.payrollEntry.findUnique({
      where: {
        payrollRunId_employeeId: {
          payrollRunId: finalizedRun.id,
          employeeId: emp.id,
        },
      },
    });
    if (existing) continue;

    // Generate plausible payroll numbers based on contract & PTKP
    const baseSalary = new Decimal(emp.contractType === "PKWTT" ? 8500000 : 6500000);
    const tunjanganKomunikasi = new Decimal(300000);
    const tunjanganKehadiran = new Decimal(500000);
    const tunjanganJabatan = emp.contractType === "PKWTT" ? new Decimal(1500000) : new Decimal(0);
    const tunjanganLainnya = new Decimal(0);
    const taxAllowance = new Decimal(emp.isTaxBorneByCompany ? 250000 : 0);
    const thr = new Decimal(0); // bukan bulan THR

    const totalEarnings = baseSalary
      .plus(tunjanganKomunikasi)
      .plus(tunjanganKehadiran)
      .plus(tunjanganJabatan)
      .plus(tunjanganLainnya)
      .plus(taxAllowance)
      .plus(thr);

    const bpjsKesEmp = baseSalary.times(0.01);
    const jhtEmp = baseSalary.times(0.02);
    const jpEmp = baseSalary.times(0.01);
    const pph21 = totalEarnings.times(0.025);
    const potonganKeterlambatan = new Decimal(0);
    const potonganKoperasi = new Decimal(0);
    const potonganLainnya = new Decimal(0);

    const totalDeductions = bpjsKesEmp
      .plus(jhtEmp)
      .plus(jpEmp)
      .plus(pph21)
      .plus(potonganKeterlambatan)
      .plus(potonganKoperasi)
      .plus(potonganLainnya);

    const takeHomePay = totalEarnings.minus(totalDeductions);

    const jkk = baseSalary.times(0.0024);
    const jkm = baseSalary.times(0.003);
    const jhtCompany = baseSalary.times(0.037);
    const jpCompany = baseSalary.times(0.02);
    const bpjsKesCompany = baseSalary.times(0.04);
    const totalBenefits = jkk.plus(jkm).plus(jhtCompany).plus(jpCompany).plus(bpjsKesCompany);

    await prisma.payrollEntry.create({
      data: {
        payrollRunId: finalizedRun.id,
        employeeId: emp.id,
        employeeNik: emp.nik,
        employeeName: emp.namaLengkap,
        jobPosition: emp.position.name,
        organization: emp.department.name,
        gradeLevel: emp.contractType === "PKWTT" ? "Tetap" : "Kontrak",
        ptkpStatus: emp.ptkpStatus ?? "TK_0",
        npwp: emp.npwp,
        basicSalary: baseSalary,
        tunjanganKomunikasi,
        tunjanganKehadiran,
        tunjanganJabatan,
        tunjanganLainnya,
        taxAllowance,
        thr,
        totalEarnings,
        bpjsKesehatanEmployee: bpjsKesEmp,
        jhtEmployee: jhtEmp,
        jaminanPensiunEmployee: jpEmp,
        pph21,
        potonganKeterlambatan,
        potonganKoperasi,
        potonganLainnya,
        totalDeductions,
        takeHomePay,
        jkk,
        jkm,
        jhtCompany,
        jaminanPensiunCompany: jpCompany,
        bpjsKesehatanCompany: bpjsKesCompany,
        totalBenefits,
        actualWorkingDay: 22,
        scheduleWorkingDay: 22,
        dayoff: 8,
        nationalHoliday: 1,
        companyHoliday: 0,
        specialHoliday: 0,
        attendanceCodes: "H:22d",
      },
    });
  }
  console.log(
    `  Payroll FINALIZED ${prevMonth}/${prevYear}: ${employees.length} entries`
  );

  // ── 1b. Current month — DRAFT
  let draftRun = await prisma.payrollRun.findUnique({
    where: { month_year: { month: currentMonth, year: currentYear } },
  });
  if (!draftRun) {
    draftRun = await prisma.payrollRun.create({
      data: {
        month: currentMonth,
        year: currentYear,
        status: "DRAFT",
        createdBy: hrAdmin.id,
      },
    });
  }

  // Same payroll numbers but for fewer employees (simulate partial import)
  const partialEmployees = employees.slice(0, Math.min(5, employees.length));
  for (const emp of partialEmployees) {
    const existing = await prisma.payrollEntry.findUnique({
      where: {
        payrollRunId_employeeId: {
          payrollRunId: draftRun.id,
          employeeId: emp.id,
        },
      },
    });
    if (existing) continue;

    const baseSalary = new Decimal(emp.contractType === "PKWTT" ? 8500000 : 6500000);
    const totalEarnings = baseSalary.plus(2300000); // simplified
    const totalDeductions = baseSalary.times(0.06).plus(totalEarnings.times(0.025));
    const takeHomePay = totalEarnings.minus(totalDeductions);
    const totalBenefits = baseSalary.times(0.1024);

    await prisma.payrollEntry.create({
      data: {
        payrollRunId: draftRun.id,
        employeeId: emp.id,
        employeeNik: emp.nik,
        employeeName: emp.namaLengkap,
        jobPosition: emp.position.name,
        organization: emp.department.name,
        gradeLevel: emp.contractType === "PKWTT" ? "Tetap" : "Kontrak",
        ptkpStatus: emp.ptkpStatus ?? "TK_0",
        npwp: emp.npwp,
        basicSalary: baseSalary,
        tunjanganKomunikasi: new Decimal(300000),
        tunjanganKehadiran: new Decimal(500000),
        tunjanganJabatan: emp.contractType === "PKWTT" ? new Decimal(1500000) : new Decimal(0),
        tunjanganLainnya: new Decimal(0),
        taxAllowance: new Decimal(0),
        thr: new Decimal(0),
        totalEarnings,
        bpjsKesehatanEmployee: baseSalary.times(0.01),
        jhtEmployee: baseSalary.times(0.02),
        jaminanPensiunEmployee: baseSalary.times(0.01),
        pph21: totalEarnings.times(0.025),
        potonganKeterlambatan: new Decimal(0),
        potonganKoperasi: new Decimal(0),
        potonganLainnya: new Decimal(0),
        totalDeductions,
        takeHomePay,
        jkk: baseSalary.times(0.0024),
        jkm: baseSalary.times(0.003),
        jhtCompany: baseSalary.times(0.037),
        jaminanPensiunCompany: baseSalary.times(0.02),
        bpjsKesehatanCompany: baseSalary.times(0.04),
        totalBenefits,
        actualWorkingDay: 15,
        scheduleWorkingDay: 22,
        dayoff: 4,
        nationalHoliday: 0,
        companyHoliday: 0,
        specialHoliday: 0,
        attendanceCodes: "H:15d (in progress)",
      },
    });
  }
  console.log(
    `  Payroll DRAFT ${currentMonth}/${currentYear}: ${partialEmployees.length} entries`
  );

  // ─── 2. INTERVIEWS ────────────────────────────────────────────────────
  const candidatesForInterview = await prisma.candidate.findMany({
    where: {
      stage: { in: ["INTERVIEW", "PENAWARAN", "DITERIMA"] },
    },
  });

  let interviewCount = 0;
  for (const cand of candidatesForInterview) {
    const existing = await prisma.interview.findFirst({
      where: { candidateId: cand.id },
    });
    if (existing) continue;

    // 1-2 interviews per candidate, scheduled in past
    const interview1Date = new Date(now);
    interview1Date.setDate(interview1Date.getDate() - 14);

    await prisma.interview.create({
      data: {
        candidateId: cand.id,
        scheduledAt: interview1Date,
        interviewerName: "Dewi Lestari",
        notes: "Interview tahap 1: technical assessment",
      },
    });
    interviewCount++;

    if (cand.stage === "PENAWARAN" || cand.stage === "DITERIMA") {
      const interview2Date = new Date(now);
      interview2Date.setDate(interview2Date.getDate() - 7);

      await prisma.interview.create({
        data: {
          candidateId: cand.id,
          scheduledAt: interview2Date,
          interviewerName: "Budi Santoso",
          notes: "Interview tahap 2: cultural fit & negosiasi",
        },
      });
      interviewCount++;
    }
  }
  console.log(`  Interviews: ${interviewCount} seeded`);

  // ─── 3. AUDIT LOG SIMULATION ──────────────────────────────────────────
  // Simulate historical audit events spanning past 3 months across all modules.
  // Skip if audit logs already populated > 30 entries (idempotent guard).
  const existingAuditCount = await prisma.auditLog.count();
  if (existingAuditCount > 30) {
    console.log(`  AuditLog: skip (already has ${existingAuditCount} entries)`);
  } else {
    const allEmployees = await prisma.employee.findMany({ take: 8 });
    const allDepartments = await prisma.department.findMany();
    const allLeaveTypes = await prisma.leaveType.findMany();
    const allCandidates = await prisma.candidate.findMany();
    const allPayrollRuns = await prisma.payrollRun.findMany();

    const actor = (i: number) => (i % 2 === 0 ? superAdmin.id : hrAdmin.id);
    const daysAgo = (n: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - n);
      return d;
    };

    const events: Array<{
      userId: string;
      action: AuditAction;
      module: string;
      targetId: string;
      newValue?: any;
      oldValue?: any;
      createdAt: Date;
    }> = [];

    // Employee creates (3 entries)
    allEmployees.slice(0, 3).forEach((emp, i) => {
      events.push({
        userId: actor(i),
        action: "CREATE",
        module: "Karyawan",
        targetId: emp.id,
        newValue: {
          nik: emp.nik,
          namaLengkap: emp.namaLengkap,
          email: emp.email,
          departmentId: emp.departmentId,
        },
        createdAt: daysAgo(60 - i * 5),
      });
    });

    // Employee updates (4 entries — personal info, employment, tax-bpjs)
    allEmployees.slice(0, 4).forEach((emp, i) => {
      events.push({
        userId: actor(i),
        action: "UPDATE",
        module: "Karyawan",
        targetId: emp.id,
        oldValue: { alamat: "Alamat lama" },
        newValue: { alamat: emp.alamat ?? "Alamat baru" },
        createdAt: daysAgo(40 - i * 3),
      });
    });

    // Master data CRUD
    if (allDepartments[0]) {
      events.push({
        userId: superAdmin.id,
        action: "UPDATE",
        module: "Departemen",
        targetId: allDepartments[0].id,
        oldValue: { description: "Lama" },
        newValue: { description: allDepartments[0].description ?? "Baru" },
        createdAt: daysAgo(30),
      });
    }

    if (allLeaveTypes[0]) {
      events.push({
        userId: superAdmin.id,
        action: "CREATE",
        module: "Jenis Cuti",
        targetId: allLeaveTypes[0].id,
        newValue: {
          name: allLeaveTypes[0].name,
          annualQuota: allLeaveTypes[0].annualQuota,
          isPaid: allLeaveTypes[0].isPaid,
        },
        createdAt: daysAgo(80),
      });
    }

    // Leave request submit/approve/reject
    const leaveRequests = await prisma.leaveRequest.findMany({ take: 5 });
    leaveRequests.forEach((lr, i) => {
      events.push({
        userId: actor(i),
        action: "CREATE",
        module: "Permintaan Cuti",
        targetId: lr.id,
        newValue: {
          leaveTypeId: lr.leaveTypeId,
          startDate: lr.startDate.toISOString(),
          endDate: lr.endDate.toISOString(),
        },
        createdAt: daysAgo(20 - i * 2),
      });

      if (lr.status === "APPROVED") {
        events.push({
          userId: hrAdmin.id,
          action: "UPDATE",
          module: "Permintaan Cuti",
          targetId: lr.id,
          newValue: { approvedBy: "HR_ADMIN", notes: "Disetujui" },
          createdAt: daysAgo(18 - i * 2),
        });
      } else if (lr.status === "REJECTED") {
        events.push({
          userId: hrAdmin.id,
          action: "UPDATE",
          module: "Permintaan Cuti",
          targetId: lr.id,
          newValue: { status: "REJECTED", rejectedBy: "HR_ADMIN", notes: "Saldo tidak cukup" },
          createdAt: daysAgo(18 - i * 2),
        });
      }
    });

    // Attendance manual override
    const attendance = await prisma.attendanceRecord.findFirst();
    if (attendance) {
      events.push({
        userId: hrAdmin.id,
        action: "UPDATE",
        module: "Absensi",
        targetId: attendance.employeeId,
        newValue: {
          date: attendance.date.toISOString(),
          clockIn: "08:00",
          clockOut: "17:00",
          overrideReason: "Karyawan lupa absen pulang — koreksi manual",
        },
        createdAt: daysAgo(10),
      });
    }

    // Recruitment events
    const vacancies = await prisma.vacancy.findMany();
    vacancies.forEach((v, i) => {
      events.push({
        userId: hrAdmin.id,
        action: "CREATE",
        module: "Lowongan",
        targetId: v.id,
        newValue: { title: v.title, departmentId: v.departmentId },
        createdAt: daysAgo(70 - i * 10),
      });
    });

    allCandidates.slice(0, 4).forEach((c, i) => {
      events.push({
        userId: hrAdmin.id,
        action: "CREATE",
        module: "Kandidat",
        targetId: c.id,
        newValue: { name: c.name, email: c.email, vacancyId: c.vacancyId },
        createdAt: daysAgo(35 - i * 3),
      });
      events.push({
        userId: hrAdmin.id,
        action: "UPDATE",
        module: "Kandidat",
        targetId: c.id,
        newValue: { stage: c.stage },
        createdAt: daysAgo(20 - i * 2),
      });
    });

    // Payroll audit (Paket A)
    if (allPayrollRuns.length > 0) {
      const finalized = allPayrollRuns.find((p) => p.status === "FINALIZED");
      const draft = allPayrollRuns.find((p) => p.status === "DRAFT");
      if (finalized) {
        events.push({
          userId: hrAdmin.id,
          action: "CREATE",
          module: "Payroll",
          targetId: finalized.id,
          newValue: {
            month: finalized.month,
            year: finalized.year,
            entryCount: employees.length,
            status: "DRAFT",
          },
          createdAt: daysAgo(40),
        });
        events.push({
          userId: hrAdmin.id,
          action: "UPDATE",
          module: "Payroll",
          targetId: finalized.id,
          oldValue: { status: "DRAFT" },
          newValue: { status: "FINALIZED" },
          createdAt: daysAgo(38),
        });
      }
      if (draft) {
        events.push({
          userId: hrAdmin.id,
          action: "CREATE",
          module: "Payroll",
          targetId: draft.id,
          newValue: {
            month: draft.month,
            year: draft.year,
            entryCount: partialEmployees.length,
            status: "DRAFT",
          },
          createdAt: daysAgo(3),
        });
      }
    }

    // User management
    const allUsers = await prisma.user.findMany({ take: 3 });
    allUsers.forEach((u, i) => {
      events.push({
        userId: superAdmin.id,
        action: "CREATE",
        module: "Manajemen Pengguna",
        targetId: u.id,
        newValue: { name: u.name, email: u.email, role: u.role },
        createdAt: daysAgo(85 - i * 5),
      });
    });

    // Insert all events
    let auditCount = 0;
    for (const ev of events) {
      await prisma.auditLog.create({
        data: {
          userId: ev.userId,
          action: ev.action,
          module: ev.module,
          targetId: ev.targetId,
          oldValue: ev.oldValue ?? undefined,
          newValue: ev.newValue ?? undefined,
          createdAt: ev.createdAt,
        },
      });
      auditCount++;
    }
    console.log(`  AuditLog: ${auditCount} historical entries seeded`);
  }

  // ─── Final summary ────────────────────────────────────────────────────
  const finalCounts = {
    payrollRuns: await prisma.payrollRun.count(),
    payrollEntries: await prisma.payrollEntry.count(),
    interviews: await prisma.interview.count(),
    auditLogs: await prisma.auditLog.count(),
  };
  console.log("\n✅ Extras seed complete:", finalCounts);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Extras seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
