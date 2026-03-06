import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLeaveRequests } from "@/lib/services/leave.service";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps {
  searchParams: Promise<{ year?: string; departmentId?: string }>;
}

export default async function LeaveReportPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!["HR_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/leave");
  }

  const sp = await searchParams;
  const year = Number(sp.year ?? new Date().getFullYear());
  const departmentId =
    sp.departmentId && sp.departmentId !== "_all"
      ? sp.departmentId
      : undefined;

  const [requests, departments] = await Promise.all([
    getLeaveRequests({ year, departmentId, status: "_all" }),
    prisma.department.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  // Group by employee for summary
  const employeeMap = new Map<
    string,
    {
      namaLengkap: string;
      nik: string;
      department: string;
      approved: number;
      pending: number;
      rejected: number;
    }
  >();

  for (const req of requests) {
    const existing = employeeMap.get(req.employeeId);
    if (existing) {
      if (req.status === "APPROVED") existing.approved += req.workingDays;
      if (req.status === "PENDING") existing.pending++;
      if (req.status === "REJECTED") existing.rejected++;
    } else {
      employeeMap.set(req.employeeId, {
        namaLengkap: req.employee.namaLengkap,
        nik: req.employee.nik,
        department: req.employee.department.name,
        approved: req.status === "APPROVED" ? req.workingDays : 0,
        pending: req.status === "PENDING" ? 1 : 0,
        rejected: req.status === "REJECTED" ? 1 : 0,
      });
    }
  }

  const summary = Array.from(employeeMap.values()).sort((a, b) =>
    a.namaLengkap.localeCompare(b.namaLengkap)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Laporan Penggunaan Cuti</h1>
        <p className="text-muted-foreground">
          Tahun {year}{" "}
          {departmentId ? "— departemen terpilih" : "— semua departemen"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Ringkasan per Karyawan — {year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Tidak ada data cuti untuk periode ini.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NIK</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead className="text-right">
                    Disetujui (hari)
                  </TableHead>
                  <TableHead className="text-right">Menunggu</TableHead>
                  <TableHead className="text-right">Ditolak</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.map((emp) => (
                  <TableRow key={emp.nik}>
                    <TableCell className="font-mono text-xs">
                      {emp.nik}
                    </TableCell>
                    <TableCell className="font-medium">
                      {emp.namaLengkap}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {emp.department}
                    </TableCell>
                    <TableCell className="text-right">{emp.approved}</TableCell>
                    <TableCell className="text-right">
                      {emp.pending > 0 ? (
                        <Badge variant="outline" className="text-xs">
                          {emp.pending}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {emp.rejected || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
