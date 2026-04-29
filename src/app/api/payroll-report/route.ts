import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const isHR =
    session.user.role === "HR_ADMIN" || session.user.role === "SUPER_ADMIN";
  if (!isHR) return new Response("Forbidden", { status: 403 });

  const runId = request.nextUrl.searchParams.get("runId");
  if (!runId) return new Response("runId required", { status: 400 });

  const run = await prisma.payrollRun.findUnique({
    where: { id: runId },
    include: { entries: { orderBy: { employeeName: "asc" } } },
  });
  if (!run) return new Response("Not Found", { status: 404 });

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const periodLabel = `${months[run.month - 1]} ${run.year}`;

  const headers = [
    "No",
    "NIK",
    "Nama Karyawan",
    "Job Position",
    "Organization",
    "Grade / Level",
    "PTKP",
    "NPWP",
    "Basic Salary",
    "Tunjangan Komunikasi",
    "Tunjangan Kehadiran",
    "Tunjangan Jabatan",
    "Tunjangan Lainnya",
    "Tax Allowance",
    "THR",
    "Total Earnings",
    "BPJS Kesehatan Employee",
    "JHT Employee",
    "Jaminan Pensiun Employee",
    "PPH 21",
    "Potongan Keterlambatan",
    "Potongan Koperasi",
    "Potongan Lainnya",
    "Total Deductions",
    "Take Home Pay",
    "JKK",
    "JKM",
    "JHT Company",
    "Jaminan Pensiun Company",
    "BPJS Kesehatan Company",
    "Total Benefits",
    "Actual Working Day",
    "Schedule Working Day",
    "Dayoff",
    "National Holiday",
    "Company Holiday",
    "Special Holiday",
    "Attendance Codes",
  ];

  const numericColumns: (keyof typeof run.entries[number])[] = [
    "basicSalary",
    "tunjanganKomunikasi",
    "tunjanganKehadiran",
    "tunjanganJabatan",
    "tunjanganLainnya",
    "taxAllowance",
    "thr",
    "totalEarnings",
    "bpjsKesehatanEmployee",
    "jhtEmployee",
    "jaminanPensiunEmployee",
    "pph21",
    "potonganKeterlambatan",
    "potonganKoperasi",
    "potonganLainnya",
    "totalDeductions",
    "takeHomePay",
    "jkk",
    "jkm",
    "jhtCompany",
    "jaminanPensiunCompany",
    "bpjsKesehatanCompany",
    "totalBenefits",
  ];

  const rows = run.entries.map((e, i) => [
    i + 1,
    e.employeeNik,
    e.employeeName,
    e.jobPosition,
    e.organization,
    e.gradeLevel,
    e.ptkpStatus,
    e.npwp ?? "",
    Number(e.basicSalary),
    Number(e.tunjanganKomunikasi),
    Number(e.tunjanganKehadiran),
    Number(e.tunjanganJabatan),
    Number(e.tunjanganLainnya),
    Number(e.taxAllowance),
    Number(e.thr),
    Number(e.totalEarnings),
    Number(e.bpjsKesehatanEmployee),
    Number(e.jhtEmployee),
    Number(e.jaminanPensiunEmployee),
    Number(e.pph21),
    Number(e.potonganKeterlambatan),
    Number(e.potonganKoperasi),
    Number(e.potonganLainnya),
    Number(e.totalDeductions),
    Number(e.takeHomePay),
    Number(e.jkk),
    Number(e.jkm),
    Number(e.jhtCompany),
    Number(e.jaminanPensiunCompany),
    Number(e.bpjsKesehatanCompany),
    Number(e.totalBenefits),
    e.actualWorkingDay,
    e.scheduleWorkingDay,
    e.dayoff,
    e.nationalHoliday,
    e.companyHoliday,
    e.specialHoliday,
    e.attendanceCodes,
  ]);

  const totalsRow: (string | number)[] = ["", "", "TOTAL", "", "", "", "", ""];
  for (const col of numericColumns) {
    totalsRow.push(
      run.entries.reduce((s, e) => s + Number(e[col] as unknown as number), 0)
    );
  }
  // Pad attendance columns
  for (let i = 0; i < 7; i++) totalsRow.push("");

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    [`Rekap Penggajian — ${periodLabel}`],
    [`Status: ${run.status === "FINALIZED" ? "Difinalisasi" : "Draft"}`],
    [],
    headers,
    ...rows,
    totalsRow,
  ]);

  ws["!cols"] = [
    { wch: 4 },
    { wch: 14 },
    { wch: 28 },
    ...Array(headers.length - 3).fill({ wch: 18 }),
  ];

  XLSX.utils.book_append_sheet(wb, ws, `Penggajian ${periodLabel}`.slice(0, 31));

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const fileName = `rekap-penggajian-${periodLabel.replace(" ", "-")}.xlsx`;

  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
