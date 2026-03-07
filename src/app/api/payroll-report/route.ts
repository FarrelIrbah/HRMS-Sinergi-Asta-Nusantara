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
    include: {
      entries: {
        orderBy: { employeeName: "asc" },
      },
    },
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
    "Gaji Pokok",
    "Tunjangan",
    "Lembur",
    "THR",
    "Gaji Bruto",
    "BPJS Kes (Kryw)",
    "JHT (Kryw)",
    "JP (Kryw)",
    "PPh 21",
    "Total Potongan",
    "Gaji Bersih",
    "BPJS Kes (Prshn)",
    "JHT (Prshn)",
    "JP (Prshn)",
    "JKK",
    "JKM",
  ];

  const rows = run.entries.map((e, i) => [
    i + 1,
    e.employeeNik,
    e.employeeName,
    Number(e.baseSalary),
    Number(e.totalAllowances),
    Number(e.overtimePay),
    Number(e.thrAmount),
    Number(e.grossPay),
    Number(e.bpjsKesEmp),
    Number(e.bpjsJhtEmp),
    Number(e.bpjsJpEmp),
    Number(e.pph21),
    Number(e.totalDeductions),
    Number(e.netPay),
    Number(e.bpjsKesEmpr),
    Number(e.bpjsJhtEmpr),
    Number(e.bpjsJpEmpr),
    Number(e.bpjsJkk),
    Number(e.bpjsJkm),
  ]);

  const totalsRow = [
    "",
    "",
    "TOTAL",
    run.entries.reduce((s, e) => s + Number(e.baseSalary), 0),
    run.entries.reduce((s, e) => s + Number(e.totalAllowances), 0),
    run.entries.reduce((s, e) => s + Number(e.overtimePay), 0),
    run.entries.reduce((s, e) => s + Number(e.thrAmount), 0),
    run.entries.reduce((s, e) => s + Number(e.grossPay), 0),
    run.entries.reduce((s, e) => s + Number(e.bpjsKesEmp), 0),
    run.entries.reduce((s, e) => s + Number(e.bpjsJhtEmp), 0),
    run.entries.reduce((s, e) => s + Number(e.bpjsJpEmp), 0),
    run.entries.reduce((s, e) => s + Number(e.pph21), 0),
    run.entries.reduce((s, e) => s + Number(e.totalDeductions), 0),
    run.entries.reduce((s, e) => s + Number(e.netPay), 0),
    run.entries.reduce((s, e) => s + Number(e.bpjsKesEmpr), 0),
    run.entries.reduce((s, e) => s + Number(e.bpjsJhtEmpr), 0),
    run.entries.reduce((s, e) => s + Number(e.bpjsJpEmpr), 0),
    run.entries.reduce((s, e) => s + Number(e.bpjsJkk), 0),
    run.entries.reduce((s, e) => s + Number(e.bpjsJkm), 0),
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    [`Laporan Penggajian — ${periodLabel}`],
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
    ...Array(16).fill({ wch: 16 }),
  ];

  XLSX.utils.book_append_sheet(wb, ws, `Penggajian ${periodLabel}`);

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const fileName = `laporan-penggajian-${periodLabel.replace(" ", "-")}.xlsx`;

  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
