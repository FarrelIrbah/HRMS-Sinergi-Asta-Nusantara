"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { FileSpreadsheet, FileDown, Users2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SerializedPayrollEntry {
  id: string;
  employeeId: string;
  employeeNik: string;
  employeeName: string;
  jobPosition: string;
  organization: string;
  totalEarnings: number;
  totalDeductions: number;
  totalBenefits: number;
  takeHomePay: number;
}

interface PayrollEntryTableProps {
  entries: SerializedPayrollEntry[];
  runId: string;
  runStatus: string;
  isHRAdmin: boolean;
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function buildColumns(runStatus: string): ColumnDef<SerializedPayrollEntry>[] {
  return [
    {
      accessorKey: "employeeNik",
      header: () => (
        <span className="text-xs font-semibold text-slate-600">NIK</span>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-700">
          {row.original.employeeNik}
        </span>
      ),
    },
    {
      accessorKey: "employeeName",
      header: () => (
        <span className="text-xs font-semibold text-slate-600">
          Nama Karyawan
        </span>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">
            {row.original.employeeName}
          </span>
          <span className="text-[11px] text-slate-500">
            {row.original.jobPosition} · {row.original.organization}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "totalEarnings",
      header: () => (
        <span className="text-xs font-semibold text-slate-600">
          Total Earnings
        </span>
      ),
      cell: ({ row }) => (
        <span className="tabular-nums text-slate-700">
          {formatRupiah(row.original.totalEarnings)}
        </span>
      ),
    },
    {
      accessorKey: "totalDeductions",
      header: () => (
        <span className="text-xs font-semibold text-slate-600">
          Total Deductions
        </span>
      ),
      cell: ({ row }) => (
        <span className="tabular-nums text-rose-600">
          {formatRupiah(row.original.totalDeductions)}
        </span>
      ),
    },
    {
      accessorKey: "takeHomePay",
      header: () => (
        <span className="text-xs font-semibold text-slate-600">
          Take Home Pay
        </span>
      ),
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums text-emerald-700">
          {formatRupiah(row.original.takeHomePay)}
        </span>
      ),
    },
    {
      accessorKey: "totalBenefits",
      header: () => (
        <span className="text-xs font-semibold text-slate-600">
          Benefits (Info)
        </span>
      ),
      cell: ({ row }) => (
        <span className="tabular-nums text-slate-500">
          {formatRupiah(row.original.totalBenefits)}
        </span>
      ),
    },
    {
      id: "payslip",
      header: () => (
        <span className="text-xs font-semibold text-slate-600">Slip Gaji</span>
      ),
      cell: ({ row }) =>
        runStatus === "FINALIZED" ? (
          <a
            href={`/api/payroll/payslip/${row.original.id}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Unduh slip gaji ${row.original.employeeName}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5 border-slate-200 text-xs"
            )}
          >
            <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
            Unduh
          </a>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="gap-1.5 border-slate-200 text-xs"
            title="Finalisasi periode untuk mengaktifkan unduhan"
          >
            <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
            Unduh
          </Button>
        ),
    },
  ];
}

export function PayrollEntryTable({
  entries,
  runId,
  runStatus,
  isHRAdmin,
}: PayrollEntryTableProps) {
  const columns = buildColumns(runStatus);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600"
            aria-hidden="true"
          >
            <Users2 className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900">
              Detail Penggajian
            </p>
            <p className="text-xs text-slate-500">
              {entries.length} karyawan pada periode ini
            </p>
          </div>
        </div>
        {isHRAdmin && (
          <a
            href={`/api/payroll-report?runId=${runId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-2 border-slate-200 bg-white"
            )}
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            Unduh Rekap Excel
          </a>
        )}
      </div>
      <DataTable
        columns={columns}
        data={entries}
        searchKey="employeeName"
        searchPlaceholder="Cari nama karyawan atau NIK..."
      />
    </div>
  );
}
