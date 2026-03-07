"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SerializedTHRResult {
  employeeId: string;
  employeeNik: string;
  employeeName: string;
  religion: string;
  holidayName: string;
  serviceMonths: number;
  thrAmount: number;
  isEligible: boolean;
  calculationNote: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface THRTableProps {
  thrResults: SerializedTHRResult[];
}

export function THRTable({ thrResults }: THRTableProps) {
  if (thrResults.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-md border text-muted-foreground">
        Tidak ada data karyawan aktif
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>NIK</TableHead>
            <TableHead>Nama Karyawan</TableHead>
            <TableHead>Agama</TableHead>
            <TableHead>Hari Raya</TableHead>
            <TableHead className="text-right">Masa Kerja</TableHead>
            <TableHead className="text-right">Jumlah THR</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead>Keterangan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {thrResults.map((row) => (
            <TableRow
              key={row.employeeId}
              className={!row.isEligible ? "opacity-50" : undefined}
            >
              <TableCell className="font-mono text-sm">
                {row.employeeNik}
              </TableCell>
              <TableCell className="font-medium">{row.employeeName}</TableCell>
              <TableCell>{row.religion}</TableCell>
              <TableCell>{row.holidayName}</TableCell>
              <TableCell className="text-right">
                {row.serviceMonths} bulan
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatRupiah(row.thrAmount)}
              </TableCell>
              <TableCell className="text-center">
                {row.isEligible ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    Berhak
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 text-gray-500 hover:bg-gray-100"
                  >
                    Tidak Berhak
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {row.calculationNote}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
