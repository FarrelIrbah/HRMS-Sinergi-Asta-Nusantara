"use client";

import { DataTable } from "@/components/shared/data-table";
import { auditLogColumns, type AuditLogRow } from "./audit-log-columns";

interface AuditLogTableProps {
  data: AuditLogRow[];
  total: number;
}

export function AuditLogTable({ data, total }: AuditLogTableProps) {
  return (
    <>
      <div className="mb-4 text-sm text-muted-foreground">
        Total: {total} entri
      </div>
      <DataTable columns={auditLogColumns} data={data} />
    </>
  );
}
