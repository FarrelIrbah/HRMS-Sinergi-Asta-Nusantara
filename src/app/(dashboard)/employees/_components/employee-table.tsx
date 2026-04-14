"use client";

import { useMemo } from "react";
import { Users2 } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getEmployeeColumns,
  type EmployeeRow,
} from "./employee-columns";
import type { Role } from "@/types/enums";

interface EmployeeTableProps {
  employees: EmployeeRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  userRole: Role;
}

export function EmployeeTable({
  employees,
  total,
  userRole,
}: EmployeeTableProps) {
  const columns = useMemo(
    () => getEmployeeColumns({ userRole }),
    [userRole],
  );

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 border-b border-slate-100 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Users2
              className="h-4 w-4 text-emerald-600"
              aria-hidden="true"
            />
            Daftar Karyawan
          </CardTitle>
          <CardDescription className="text-xs">
            Menampilkan{" "}
            <span className="font-medium tabular-nums text-slate-700">
              {employees.length}
            </span>{" "}
            dari{" "}
            <span className="font-medium tabular-nums text-slate-700">
              {total}
            </span>{" "}
            karyawan
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="employee-data-table [&_table]:text-sm [&_tbody_tr]:border-slate-100 [&_tbody_tr:hover]:bg-slate-50/70 [&_thead_th]:bg-slate-50/60 [&_thead_th]:text-xs [&_thead_th]:font-semibold [&_thead_th]:uppercase [&_thead_th]:tracking-wide [&_thead_th]:text-slate-500">
          <DataTable columns={columns} data={employees} />
        </div>
      </CardContent>
    </Card>
  );
}
