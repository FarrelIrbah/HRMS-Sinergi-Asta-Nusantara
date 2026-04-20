"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import {
  ArrowUpRight,
  PlusCircle,
  Pencil,
  Trash2,
  type LucideIcon,
} from "lucide-react";
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

const actionStyleMap: Record<
  AuditAction,
  { icon: LucideIcon; className: string }
> = {
  CREATE: {
    icon: PlusCircle,
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  UPDATE: {
    icon: Pencil,
    className: "bg-sky-50 text-sky-700 ring-sky-200",
  },
  DELETE: {
    icon: Trash2,
    className: "bg-rose-50 text-rose-700 ring-rose-200",
  },
};

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

export const auditLogColumns: ColumnDef<AuditLogRow>[] = [
  {
    accessorKey: "createdAt",
    header: () => (
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        Waktu
      </span>
    ),
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      return (
        <span className="whitespace-nowrap text-sm tabular-nums text-slate-700">
          {format(new Date(date), "dd MMM yyyy, HH:mm", { locale: id })}
        </span>
      );
    },
  },
  {
    accessorKey: "user",
    header: () => (
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        Pengguna
      </span>
    ),
    cell: ({ row }) => {
      const user = row.getValue("user") as AuditLogRow["user"];
      const name = user?.name ?? "-";
      return (
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200"
            aria-hidden="true"
          >
            {getInitials(name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">
              {name}
            </p>
            {user?.email && (
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "action",
    header: () => (
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        Aksi
      </span>
    ),
    cell: ({ row }) => {
      const action = row.getValue("action") as AuditAction;
      const style = actionStyleMap[action];
      const Icon = style.icon;
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style.className}`}
        >
          <Icon className="h-3 w-3" aria-hidden="true" />
          {AUDIT_ACTIONS[action]}
        </span>
      );
    },
  },
  {
    accessorKey: "module",
    header: () => (
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        Modul
      </span>
    ),
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
        {row.getValue("module")}
      </span>
    ),
  },
  {
    accessorKey: "targetId",
    header: () => (
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        Target ID
      </span>
    ),
    cell: ({ row }) => {
      const targetId = row.getValue("targetId") as string;
      if (!targetId) return <span className="text-sm text-slate-400">-</span>;
      return (
        <span className="inline-flex items-center rounded-md bg-slate-50 px-1.5 py-0.5 font-mono text-[11px] text-slate-600 ring-1 ring-inset ring-slate-200">
          {targetId.substring(0, 8)}
        </span>
      );
    },
  },
  {
    id: "detail",
    header: () => (
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        Detail
      </span>
    ),
    cell: ({ row }) => {
      const { id, oldValue, newValue } = row.original;
      const hasValues = oldValue !== null || newValue !== null;
      if (!hasValues) {
        return <span className="text-sm text-slate-400">-</span>;
      }
      return (
        <Link
          href={`/audit-log/${id}`}
          aria-label="Lihat detail perubahan"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800"
        >
          Lihat
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      );
    },
  },
];
