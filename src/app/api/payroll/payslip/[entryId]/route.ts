import { type DocumentProps } from "@react-pdf/renderer";
import { renderToStream } from "@react-pdf/renderer";
import React, { type JSXElementConstructor, type ReactElement } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PayslipDocument, type PayslipData } from "@/lib/pdf/payslip-pdf";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS_ID = [
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

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { entryId } = await params;

  const entry = await prisma.payrollEntry.findUnique({
    where: { id: entryId },
    include: {
      payrollRun: true,
      employee: {
        include: {
          position: true,
          department: true,
          allowances: true,
        },
      },
    },
  });

  if (!entry) return new Response("Not Found", { status: 404 });

  // Auth: HR_ADMIN/SUPER_ADMIN can access any entry; EMPLOYEE/MANAGER can only access own
  const isHR =
    session.user.role === "HR_ADMIN" || session.user.role === "SUPER_ADMIN";
  if (!isHR) {
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id },
    });
    if (!employee || employee.id !== entry.employeeId) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  // Only FINALIZED payroll runs can have payslips downloaded
  if (entry.payrollRun.status !== "FINALIZED") {
    return new Response("Payroll belum difinalisasi", { status: 400 });
  }

  const periodLabel = `${MONTHS_ID[entry.payrollRun.month - 1]} ${entry.payrollRun.year}`;

  const data: PayslipData = {
    companyName: "PT Sinergi Asta Nusantara",
    periodLabel,
    employeeNik: entry.employeeNik,
    employeeName: entry.employeeName,
    position: entry.employee.position?.name ?? "-",
    department: entry.employee.department?.name ?? "-",
    baseSalary: Number(entry.baseSalary),
    allowanceItems: entry.employee.allowances.map(
      (a: { name: string; amount: { toString: () => string } }) => ({
        name: a.name,
        amount: Number(a.amount),
      })
    ),
    overtimePay: Number(entry.overtimePay),
    thrAmount: Number(entry.thrAmount),
    grossPay: Number(entry.grossPay),
    bpjsKesEmp: Number(entry.bpjsKesEmp),
    bpjsJhtEmp: Number(entry.bpjsJhtEmp),
    bpjsJpEmp: Number(entry.bpjsJpEmp),
    bpjsKesEmpr: Number(entry.bpjsKesEmpr),
    bpjsJhtEmpr: Number(entry.bpjsJhtEmpr),
    bpjsJpEmpr: Number(entry.bpjsJpEmpr),
    bpjsJkk: Number(entry.bpjsJkk),
    bpjsJkm: Number(entry.bpjsJkm),
    pph21: Number(entry.pph21),
    totalDeductions: Number(entry.totalDeductions),
    netPay: Number(entry.netPay),
  };

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

  const safeFileName = `slip-gaji-${entry.employeeNik}-${periodLabel.replace(" ", "-")}.pdf`;

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFileName}"`,
    },
  });
}
