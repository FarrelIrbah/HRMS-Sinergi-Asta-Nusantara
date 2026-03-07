import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPayrollRuns } from "@/lib/services/payroll.service";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RunPayrollForm } from "./_components/run-payroll-form";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_LABELS = [
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

function formatPeriod(month: number, year: number): string {
  return `${MONTH_LABELS[month - 1]} ${year}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PayrollPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (!["HR_ADMIN", "SUPER_ADMIN"].includes(role)) {
    redirect("/dashboard");
  }

  const payrollRuns = await getPayrollRuns();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Penggajian</h1>
        <p className="text-muted-foreground">
          Kelola perhitungan dan finalisasi penggajian bulanan karyawan
        </p>
      </div>

      {/* Run Payroll Form */}
      <Card>
        <CardHeader>
          <CardTitle>Hitung Penggajian Bulan Baru</CardTitle>
          <CardDescription>
            Pilih bulan dan tahun lalu klik Hitung Gaji. Proses ini dapat
            diulang selama status masih DRAFT.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RunPayrollForm />
        </CardContent>
      </Card>

      {/* Payroll Runs List */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Penggajian</CardTitle>
          <CardDescription>
            Daftar semua periode penggajian yang pernah dihitung
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payrollRuns.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-muted-foreground">
              Belum ada data penggajian
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">
                      Jumlah Karyawan
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollRuns.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>
                        <Link
                          href={`/payroll/${run.id}`}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {formatPeriod(run.month, run.year)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {run.status === "FINALIZED" ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            Difinalisasi
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                            Draft
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {run._count.entries} karyawan
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
