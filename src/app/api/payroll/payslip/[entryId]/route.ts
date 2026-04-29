import { type DocumentProps } from "@react-pdf/renderer";
import { renderToStream } from "@react-pdf/renderer";
import React, { type JSXElementConstructor, type ReactElement } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PayslipDocument, type PayslipData } from "@/lib/pdf/payslip-pdf";

const MONTHS_EN_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function buildPayrollCutoff(month: number, year: number): string {
  const lastDay = new Date(year, month, 0).getDate();
  const monthLabel = MONTHS_EN_SHORT[month - 1];
  return `01 - ${lastDay} ${monthLabel} ${year}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { entryId } = await params;

  const entry = await prisma.payrollEntry.findUnique({
    where: { id: entryId },
    include: { payrollRun: true },
  });

  if (!entry) return new Response("Not Found", { status: 404 });

  const isHR =
    session.user.role === "HR_ADMIN" || session.user.role === "SUPER_ADMIN";
  if (!isHR) {
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!employee || employee.id !== entry.employeeId) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  if (entry.payrollRun.status !== "FINALIZED") {
    return new Response("Payroll belum difinalisasi", { status: 400 });
  }

  const data: PayslipData = {
    companyName: "PT. Sinergi Asta Nusantara",
    payrollCutoff: buildPayrollCutoff(entry.payrollRun.month, entry.payrollRun.year),
    employeeNik: entry.employeeNik,
    employeeName: entry.employeeName,
    jobPosition: entry.jobPosition,
    organization: entry.organization,
    gradeLevel: entry.gradeLevel,
    ptkpStatus: entry.ptkpStatus,
    npwp: entry.npwp,
    basicSalary: Number(entry.basicSalary),
    tunjanganKomunikasi: Number(entry.tunjanganKomunikasi),
    tunjanganKehadiran: Number(entry.tunjanganKehadiran),
    tunjanganJabatan: Number(entry.tunjanganJabatan),
    tunjanganLainnya: Number(entry.tunjanganLainnya),
    taxAllowance: Number(entry.taxAllowance),
    thr: Number(entry.thr),
    totalEarnings: Number(entry.totalEarnings),
    bpjsKesehatanEmployee: Number(entry.bpjsKesehatanEmployee),
    jhtEmployee: Number(entry.jhtEmployee),
    jaminanPensiunEmployee: Number(entry.jaminanPensiunEmployee),
    pph21: Number(entry.pph21),
    potonganKeterlambatan: Number(entry.potonganKeterlambatan),
    potonganKoperasi: Number(entry.potonganKoperasi),
    potonganLainnya: Number(entry.potonganLainnya),
    totalDeductions: Number(entry.totalDeductions),
    takeHomePay: Number(entry.takeHomePay),
    jkk: Number(entry.jkk),
    jkm: Number(entry.jkm),
    jhtCompany: Number(entry.jhtCompany),
    jaminanPensiunCompany: Number(entry.jaminanPensiunCompany),
    bpjsKesehatanCompany: Number(entry.bpjsKesehatanCompany),
    totalBenefits: Number(entry.totalBenefits),
    actualWorkingDay: entry.actualWorkingDay,
    scheduleWorkingDay: entry.scheduleWorkingDay,
    dayoff: entry.dayoff,
    nationalHoliday: entry.nationalHoliday,
    companyHoliday: entry.companyHoliday,
    specialHoliday: entry.specialHoliday,
    attendanceCodes: entry.attendanceCodes,
  };

  const safePeriod = `${entry.payrollRun.year}-${String(entry.payrollRun.month).padStart(2, "0")}`;
  const safeFileName = `Payslip-${safePeriod}-${entry.employeeNik}.pdf`;

  try {
    const element = React.createElement(
      PayslipDocument,
      { data }
    ) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>;

    const stream = await renderToStream(element);

    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<Buffer | string>) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFileName}"`,
      },
    });
  } catch (err) {
    console.error("[payslip-route] PDF generation failed:", err);
    return new Response(
      `Gagal menghasilkan PDF: ${err instanceof Error ? err.message : "Unknown error"}`,
      { status: 500 }
    );
  }
}
