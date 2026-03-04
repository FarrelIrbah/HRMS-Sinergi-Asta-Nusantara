"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/shared/data-table";
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
    [userRole]
  );

  return (
    <>
      <div className="mb-4 text-sm text-muted-foreground">
        Total: {total} karyawan
      </div>
      <DataTable
        columns={columns}
        data={employees}
        searchKey="namaLengkap"
        searchPlaceholder="Cari karyawan..."
      />
    </>
  );
}
