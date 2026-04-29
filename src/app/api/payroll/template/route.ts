import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { buildPayrollTemplate } from "@/lib/services/payroll-import.service";

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

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const isHR =
    session.user.role === "HR_ADMIN" || session.user.role === "SUPER_ADMIN";
  if (!isHR) return new Response("Forbidden", { status: 403 });

  const monthParam = request.nextUrl.searchParams.get("month");
  const yearParam = request.nextUrl.searchParams.get("year");
  const now = new Date();
  const month = monthParam ? Math.max(1, Math.min(12, parseInt(monthParam, 10))) : now.getMonth() + 1;
  const year = yearParam ? Math.max(2024, Math.min(2099, parseInt(yearParam, 10))) : now.getFullYear();
  const periodLabel = `${MONTHS_ID[month - 1]} ${year}`;

  const buffer = buildPayrollTemplate(periodLabel);
  const fileName = `template-penggajian-${periodLabel.replace(" ", "-")}.xlsx`;

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
