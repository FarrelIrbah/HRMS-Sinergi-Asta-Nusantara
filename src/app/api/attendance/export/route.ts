import * as XLSX from "xlsx";
import { renderToStream, type DocumentProps } from "@react-pdf/renderer";
import React, { type JSXElementConstructor, type ReactElement } from "react";
import { auth } from "@/lib/auth";
import { getMonthlyAttendanceRecap } from "@/lib/services/attendance.service";
import { AttendancePDFDocument } from "@/lib/pdf/attendance-pdf";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";

const TZ = "Asia/Jakarta";

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || !["HR_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const exportFormat = searchParams.get("format") ?? "xlsx";
  const deptId = searchParams.get("departmentId") ?? undefined;

  const records = await getMonthlyAttendanceRecap({ month, year, departmentId: deptId });
  const monthName = MONTHS_ID[month - 1];
  const fileName = `absensi-${year}-${String(month).padStart(2, "0")}`;

  if (exportFormat === "pdf") {
    const element = React.createElement(
      AttendancePDFDocument,
      { data: records, month, year }
    ) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>;

    const stream = await renderToStream(element);

    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<Buffer | string>) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}.pdf"`,
        "Content-Type": "application/pdf",
      },
    });
  }

  // Default: Excel
  const rows = records.map((r) => ({
    NIK: r.employee.nik,
    Nama: r.employee.namaLengkap,
    Departemen: r.employee.department.name,
    Jabatan: r.employee.position.name,
    Tanggal: format(toZonedTime(r.date, TZ), "dd/MM/yyyy"),
    "Jam Masuk": r.clockIn ? format(toZonedTime(r.clockIn, TZ), "HH:mm") : "",
    "Jam Pulang": r.clockOut ? format(toZonedTime(r.clockOut, TZ), "HH:mm") : "",
    "Total Jam": r.totalMinutes > 0 ? (r.totalMinutes / 60).toFixed(2) : "",
    "Terlambat (menit)": r.isLate ? r.lateMinutes : "",
    "Lembur (menit)": r.overtimeMinutes > 0 ? r.overtimeMinutes : "",
    "Override Manual": r.isManualOverride ? "Ya" : "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Absensi ${monthName}`);

  const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
    wch: Math.max(key.length, ...rows.map((r) => String(r[key as keyof typeof r] ?? "").length)) + 2,
  }));
  worksheet["!cols"] = colWidths;

  const xlsxBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new Response(new Uint8Array(xlsxBuffer), {
    status: 200,
    headers: {
      "Content-Disposition": `attachment; filename="${fileName}.xlsx"`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
