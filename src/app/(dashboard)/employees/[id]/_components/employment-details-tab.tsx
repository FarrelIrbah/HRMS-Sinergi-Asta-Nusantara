"use client";

import type { SerializedEmployee } from "./employee-profile-tabs";

interface Department {
  id: string;
  name: string;
}

interface Position {
  id: string;
  name: string;
  departmentId: string;
}

interface EmploymentDetailsTabProps {
  employee: SerializedEmployee;
  readOnly: boolean;
  departments: Department[];
  positions: Position[];
}

export function EmploymentDetailsTab({
  employee,
  readOnly,
  departments,
  positions,
}: EmploymentDetailsTabProps) {
  return (
    <div className="rounded-lg border p-8 text-center text-muted-foreground">
      Detail pekerjaan - {employee.namaLengkap} {readOnly ? "(read-only)" : ""}{" "}
      {departments.length} depts, {positions.length} positions
    </div>
  );
}
