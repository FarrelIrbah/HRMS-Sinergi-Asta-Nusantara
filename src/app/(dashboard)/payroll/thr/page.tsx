import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Decimal from "decimal.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { THRTable, type SerializedTHRResult } from "./_components/thr-table";
import { AddTHRForm } from "./_components/add-thr-form";
import { calculateEmployeeTHR } from "@/lib/services/thr.service";
import type { Religion } from "@/types/enums";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function THRPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (!["HR_ADMIN", "SUPER_ADMIN"].includes(role)) {
    redirect("/dashboard");
  }

  // Fetch all active employees with salary, fixed allowances, joinDate, and agama
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    select: {
      id: true,
      nik: true,
      namaLengkap: true,
      baseSalary: true,
      joinDate: true,
      agama: true,
      allowances: {
        where: { isFixed: true },
        select: { amount: true },
      },
    },
    orderBy: { namaLengkap: "asc" },
  });

  // Reference date: today (first of current month for consistency with payroll runs)
  const referenceDate = new Date();

  // Calculate THR for each employee
  const thrResults: SerializedTHRResult[] = employees.map((emp) => {
    const baseSalary = new Decimal(emp.baseSalary.toString());
    const fixedAllowancesTotal = emp.allowances.reduce(
      (sum, a) => sum.plus(new Decimal(a.amount.toString())),
      new Decimal(0)
    );

    // Employees without agama are treated as not eligible
    if (!emp.agama) {
      return {
        employeeId: emp.id,
        employeeNik: emp.nik,
        employeeName: emp.namaLengkap,
        religion: "—",
        holidayName: "—",
        serviceMonths: 0,
        thrAmount: 0,
        isEligible: false,
        calculationNote: "Agama tidak tercatat — tidak dapat menghitung THR",
      };
    }

    const result = calculateEmployeeTHR({
      joinDate: emp.joinDate,
      referenceDate,
      baseSalary,
      fixedAllowancesTotal,
      religion: emp.agama as Religion,
    });

    return {
      employeeId: emp.id,
      employeeNik: emp.nik,
      employeeName: emp.namaLengkap,
      religion: emp.agama,
      holidayName: result.holidayName,
      serviceMonths: result.serviceMonths,
      thrAmount: Number(result.thrAmount.toNumber()),
      isEligible: result.isEligible,
      calculationNote: result.calculationNote,
    };
  });

  // Summary totals
  const eligibleResults = thrResults.filter((r) => r.isEligible);
  const totalTHR = eligibleResults.reduce((sum, r) => sum + r.thrAmount, 0);
  const eligibleCount = eligibleResults.length;

  function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Hitung THR</h1>
        <p className="text-muted-foreground">
          Tunjangan Hari Raya berdasarkan Permenaker No. 6/2016
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-blue-800">
            Dasar Perhitungan THR
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700">
          <ul className="list-disc space-y-1 pl-4">
            <li>
              <strong>Basis:</strong> Gaji pokok + tunjangan tetap (isFixed=true)
            </li>
            <li>
              <strong>Masa kerja ≥ 12 bulan:</strong> 1× gaji sebulan
            </li>
            <li>
              <strong>Masa kerja 1–11 bulan:</strong> (masa kerja / 12) × gaji
              sebulan (proporsional)
            </li>
            <li>
              <strong>Masa kerja &lt; 1 bulan:</strong> Tidak berhak THR
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Add THR to Payroll Run */}
      <Card>
        <CardHeader>
          <CardTitle>Tambahkan THR ke Penggajian</CardTitle>
          <CardDescription>
            Pilih periode penggajian DRAFT yang akan ditambahkan komponen THR.
            Pastikan penggajian untuk bulan tersebut sudah dihitung terlebih
            dahulu di halaman Penggajian.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddTHRForm />
        </CardContent>
      </Card>

      {/* THR Eligibility Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kelayakan THR Karyawan</CardTitle>
          <CardDescription>
            Perhitungan THR untuk semua karyawan aktif (referensi: hari ini,{" "}
            {referenceDate.toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            )
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <THRTable thrResults={thrResults} />

          {/* Summary */}
          <div className="rounded-md border bg-muted/30 p-4">
            <p className="text-sm font-medium">
              Total THR Layak:{" "}
              <span className="text-base font-bold">
                {formatRupiah(totalTHR)}
              </span>{" "}
              untuk{" "}
              <span className="font-bold">{eligibleCount} karyawan</span>{" "}
              dari {thrResults.length} karyawan aktif
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
