import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

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

  // HR and Super Admin: show all employees' finalized payslips
  if (role === "HR_ADMIN" || role === "SUPER_ADMIN") {
    const allEntries = await prisma.payrollEntry.findMany({
      where: { payrollRun: { status: "FINALIZED" } },
      include: {
        payrollRun: { select: { month: true, year: true } },
      },
      orderBy: [
        { payrollRun: { year: "desc" } },
        { payrollRun: { month: "desc" } },
        { employeeName: "asc" },
      ],
    });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Slip Gaji Karyawan</h1>
          <p className="text-muted-foreground">
            Unduh slip gaji semua karyawan dari periode yang telah difinalisasi
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Slip Gaji</CardTitle>
            <CardDescription>
              Hanya periode yang sudah difinalisasi yang tersedia
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allEntries.length === 0 ? (
              <div className="flex h-24 items-center justify-center text-muted-foreground">
                Belum ada slip gaji tersedia. Jalankan dan finalisasi penggajian
                terlebih dahulu.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Periode</TableHead>
                      <TableHead>NIK</TableHead>
                      <TableHead>Nama Karyawan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {formatPeriod(
                            entry.payrollRun.month,
                            entry.payrollRun.year
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {entry.employeeNik}
                        </TableCell>
                        <TableCell>{entry.employeeName}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            Difinalisasi
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <a
                            href={`/api/payroll/payslip/${entry.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              buttonVariants({ variant: "outline", size: "sm" })
                            )}
                          >
                            Unduh PDF
                          </a>
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
                        <a
                          href={`/api/payroll/payslip/${entry.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" })
                          )}
                        >
                          Unduh PDF
                        </a>
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
