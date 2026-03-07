"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { FileSpreadsheet } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SerializedPayrollEntry {
  id: string;
  employeeId: string;
  employeeNik: string;
  employeeName: string;
  baseSalary: number;
  totalAllowances: number;
  overtimePay: number;
  absenceDeduction: number;
  thrAmount: number;
  grossPay: number;
  bpjsKesEmp: number;
  bpjsKesEmpr: number;
  bpjsJhtEmp: number;
  bpjsJhtEmpr: number;
  bpjsJpEmp: number;
  bpjsJpEmpr: number;
  bpjsJkk: number;
  bpjsJkm: number;
  pph21: number;
  totalDeductions: number;
  netPay: number;
}

interface PayrollEntryTableProps {
  entries: SerializedPayrollEntry[];
  runId: string;
  runStatus: string;
  isHRAdmin: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Columns ──────────────────────────────────────────────────────────────────

function buildColumns(
  runStatus: string
): ColumnDef<SerializedPayrollEntry>[] {
  return [
    {
      accessorKey: "employeeNik",
      header: "NIK",
    },
    {
      accessorKey: "employeeName",
      header: "Nama Karyawan",
    },
    {
      accessorKey: "baseSalary",
      header: "Gaji Pokok",
      cell: ({ row }) => formatRupiah(row.original.baseSalary),
    },
    {
      accessorKey: "totalAllowances",
      header: "Tunjangan",
      cell: ({ row }) => formatRupiah(row.original.totalAllowances),
    },
    {
      accessorKey: "overtimePay",
      header: "Lembur",
      cell: ({ row }) => formatRupiah(row.original.overtimePay),
    },
    {
      accessorKey: "thrAmount",
      header: "THR",
      cell: ({ row }) => formatRupiah(row.original.thrAmount),
    },
    {
      accessorKey: "grossPay",
      header: "Gaji Bruto",
      cell: ({ row }) => (
        <span className="font-semibold">
          {formatRupiah(row.original.grossPay)}
        </span>
      ),
    },
    {
      accessorKey: "totalDeductions",
      header: "Total Potongan",
      cell: ({ row }) => (
        <span className="text-red-600">
          {formatRupiah(row.original.totalDeductions)}
        </span>
      ),
    },
    {
      accessorKey: "netPay",
      header: "Gaji Bersih",
      cell: ({ row }) => (
        <span className="font-semibold text-green-700">
          {formatRupiah(row.original.netPay)}
        </span>
      ),
    },
    {
      id: "payslip",
      header: "Unduh Slip",
      cell: ({ row }) =>
        runStatus === "FINALIZED" ? (
          <a
            href={`/api/payroll/payslip/${row.original.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Unduh
          </a>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Unduh
          </Button>
        ),
    },
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PayrollEntryTable({
  entries,
  runId,
  runStatus,
  isHRAdmin,
}: PayrollEntryTableProps) {
  const columns = buildColumns(runStatus);

  return (
    <div className="space-y-4">
      {isHRAdmin && (
        <div className="flex justify-end">
          <a
            href={`/api/payroll-report?runId=${runId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Unduh Rekap Excel
            </Button>
          </a>
        </div>
      )}
      <DataTable
        columns={columns}
        data={entries}
        searchKey="employeeName"
        searchPlaceholder="Cari nama karyawan atau NIK..."
      />
    </div>
  );
}
