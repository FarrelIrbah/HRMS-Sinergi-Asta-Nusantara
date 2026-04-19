"use client";

import { Users2 } from "lucide-react";
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
      <div className="py-12 text-center">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"
          aria-hidden="true"
        >
          <Users2 className="h-6 w-6" />
        </div>
        <p className="mt-3 text-sm font-medium text-slate-700">
          Tidak ada data karyawan aktif
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Tambahkan karyawan aktif untuk melihat kelayakan THR.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[960px]">
        <TableHeader>
          <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
            <TableHead className="w-[140px] pl-6 text-xs font-semibold text-slate-600">
              NIK
            </TableHead>
            <TableHead className="min-w-[180px] text-xs font-semibold text-slate-600">
              Nama Karyawan
            </TableHead>
            <TableHead className="w-[100px] text-xs font-semibold text-slate-600">
              Agama
            </TableHead>
            <TableHead className="w-[140px] text-xs font-semibold text-slate-600">
              Hari Raya
            </TableHead>
            <TableHead className="w-[110px] text-right text-xs font-semibold text-slate-600">
              Masa Kerja
            </TableHead>
            <TableHead className="w-[160px] text-right text-xs font-semibold text-slate-600">
              Jumlah THR
            </TableHead>
            <TableHead className="w-[120px] text-center text-xs font-semibold text-slate-600">
              Status
            </TableHead>
            <TableHead className="min-w-[200px] pr-6 text-xs font-semibold text-slate-600">
              Keterangan
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {thrResults.map((row) => (
            <TableRow
              key={row.employeeId}
              className={
                row.isEligible
                  ? "hover:bg-slate-50/50"
                  : "bg-slate-50/30 opacity-70 hover:bg-slate-50/50"
              }
            >
              <TableCell className="pl-6 font-mono text-xs text-slate-700">
                {row.employeeNik}
              </TableCell>
              <TableCell className="font-medium text-slate-900">
                {row.employeeName}
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {row.religion}
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {row.holidayName}
              </TableCell>
              <TableCell className="text-right tabular-nums text-slate-700">
                {row.serviceMonths} bulan
              </TableCell>
              <TableCell className="text-right tabular-nums font-semibold text-slate-900">
                {row.isEligible ? (
                  formatRupiah(row.thrAmount)
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {row.isEligible ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-300 text-xs text-emerald-700"
                  >
                    Berhak
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-slate-300 text-xs text-slate-500"
                  >
                    Tidak Berhak
                  </Badge>
                )}
              </TableCell>
              <TableCell
                className="pr-6 text-sm text-slate-500"
                title={row.calculationNote}
              >
                <span className="line-clamp-2 block">
                  {row.calculationNote}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
