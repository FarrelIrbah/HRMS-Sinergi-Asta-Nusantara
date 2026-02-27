"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AUDIT_ACTIONS } from "@/lib/constants";
import type { AuditAction } from "@/types/enums";

export type AuditLogRow = {
  id: string;
  action: AuditAction;
  module: string;
  targetId: string;
  oldValue: unknown;
  newValue: unknown;
  createdAt: Date;
  user: {
    name: string;
    email: string;
  };
};

const actionColorMap: Record<AuditAction, string> = {
  CREATE: "bg-green-100 text-green-800 border-green-200",
  UPDATE: "bg-blue-100 text-blue-800 border-blue-200",
  DELETE: "bg-red-100 text-red-800 border-red-200",
};

export const auditLogColumns: ColumnDef<AuditLogRow>[] = [
  {
    accessorKey: "createdAt",
    header: "Waktu",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      return (
        <span className="whitespace-nowrap text-sm">
          {format(new Date(date), "dd MMM yyyy, HH:mm", { locale: id })}
        </span>
      );
    },
  },
  {
    accessorKey: "user",
    header: "Pengguna",
    cell: ({ row }) => {
      const user = row.getValue("user") as AuditLogRow["user"];
      return (
        <span className="text-sm font-medium">{user?.name ?? "-"}</span>
      );
    },
  },
  {
    accessorKey: "action",
    header: "Aksi",
    cell: ({ row }) => {
      const action = row.getValue("action") as AuditAction;
      return (
        <Badge variant="outline" className={actionColorMap[action]}>
          {AUDIT_ACTIONS[action]}
        </Badge>
      );
    },
  },
  {
    accessorKey: "module",
    header: "Modul",
    cell: ({ row }) => {
      return <span className="text-sm">{row.getValue("module")}</span>;
    },
  },
  {
    accessorKey: "targetId",
    header: "Target ID",
    cell: ({ row }) => {
      const targetId = row.getValue("targetId") as string;
      return (
        <span className="font-mono text-xs text-muted-foreground">
          {targetId?.substring(0, 8) ?? "-"}
        </span>
      );
    },
  },
  {
    id: "detail",
    header: "Detail",
    cell: ({ row }) => {
      const { id, oldValue, newValue } = row.original;
      const hasValues = oldValue !== null || newValue !== null;
      if (!hasValues) {
        return <span className="text-sm text-muted-foreground">-</span>;
      }
      return (
        <Link
          href={`/audit-log/${id}`}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Lihat
        </Link>
      );
    },
  },
];
