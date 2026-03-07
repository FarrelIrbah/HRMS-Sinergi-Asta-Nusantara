import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

function formatPeriod(month: number, year: number): string {
  return `${MONTHS_ID[month - 1]} ${year}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PayslipPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;

  // HR and Super Admin: redirect info to payroll management page
  if (role === "HR_ADMIN" || role === "SUPER_ADMIN") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Slip Gaji</h1>
          <p className="text-muted-foreground">Unduh slip gaji karyawan</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-start gap-4 pt-6">
            <p className="text-muted-foreground">
              Untuk melihat semua slip gaji karyawan, buka halaman Penggajian
              dan pilih periode yang ingin ditampilkan.
            </p>
            <Button asChild>
              <Link href="/payroll">Buka Halaman Penggajian</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // EMPLOYEE / MANAGER: show their own payslip history
  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id },
  });

  if (!employee) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Slip Gaji Saya</h1>
          <p className="text-muted-foreground">Riwayat slip gaji Anda</p>
        </div>
        <Card>
          <CardContent className="flex h-24 items-center justify-center text-muted-foreground pt-6">
            Profil karyawan tidak ditemukan.
          </CardContent>
        </Card>
      </div>
    );
  }

  const payrollEntries = await prisma.payrollEntry.findMany({
    where: {
      employeeId: employee.id,
      payrollRun: { status: "FINALIZED" },
    },
    include: {
      payrollRun: {
        select: { month: true, year: true, status: true },
      },
    },
    orderBy: [
      { payrollRun: { year: "desc" } },
      { payrollRun: { month: "desc" } },
    ],
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Slip Gaji Saya</h1>
        <p className="text-muted-foreground">
          Daftar slip gaji yang tersedia untuk diunduh
        </p>
      </div>

      {/* Payslip List */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Slip Gaji</CardTitle>
          <CardDescription>
            Hanya slip gaji dari periode yang telah difinalisasi yang dapat
            diunduh.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payrollEntries.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-muted-foreground">
              Belum ada slip gaji tersedia.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {formatPeriod(
                          entry.payrollRun.month,
                          entry.payrollRun.year
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Difinalisasi
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={`/api/payroll/payslip/${entry.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                          >
                            Unduh PDF
                          </a>
                        </Button>
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
