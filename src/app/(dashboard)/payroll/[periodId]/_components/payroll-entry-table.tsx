"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";

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
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          disabled={runStatus !== "FINALIZED"}
          asChild={runStatus === "FINALIZED"}
        >
          {runStatus === "FINALIZED" ? (
            <a
              href={`/api/payroll/payslip/${row.original.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Unduh
            </a>
          ) : (
            <span>Unduh</span>
          )}
        </Button>
      ),
    },
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PayrollEntryTable({
  entries,
  runId: _runId,
  runStatus,
}: PayrollEntryTableProps) {
  const columns = buildColumns(runStatus);

  return (
    <DataTable
      columns={columns}
      data={entries}
      searchKey="employeeName"
      searchPlaceholder="Cari nama karyawan atau NIK..."
    />
  );
}
