"use client";

import { Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { auditLogColumns, type AuditLogRow } from "./audit-log-columns";

interface AuditLogTableProps {
  data: AuditLogRow[];
  total: number;
}

export function AuditLogTable({ data, total }: AuditLogTableProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600"
              aria-hidden="true"
            >
              <Database className="h-3.5 w-3.5" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">
              Riwayat Aktivitas
            </h2>
          </div>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 tabular-nums">
            {total.toLocaleString("id-ID")} entri
          </span>
        </div>
        <div className="p-4">
          <DataTable columns={auditLogColumns} data={data} />
        </div>
      </CardContent>
    </Card>
  );
}
