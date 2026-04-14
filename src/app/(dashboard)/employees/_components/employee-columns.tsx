"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Eye, MoreHorizontal, Pencil } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Role } from "@/types/enums";

export type EmployeeRow = {
  id: string;
  nik: string;
  namaLengkap: string;
  email: string;
  departmentName: string;
  positionName: string;
  isActive: boolean;
  contractType: string;
  joinDate: string; // ISO string from server
};

interface EmployeeColumnsOptions {
  userRole: Role;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function getEmployeeColumns({
  userRole,
}: EmployeeColumnsOptions): ColumnDef<EmployeeRow>[] {
  const canEdit = userRole === "HR_ADMIN" || userRole === "SUPER_ADMIN";

  return [
    {
      accessorKey: "namaLengkap",
      header: "Karyawan",
      cell: ({ row }) => {
        const { namaLengkap, email, nik } = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarFallback className="bg-emerald-100 text-[11px] font-medium text-emerald-700">
                {initials(namaLengkap)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate font-medium text-slate-900">
                {namaLengkap}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="truncate">{email}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{nik}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "departmentName",
      header: "Departemen",
      cell: ({ row }) => (
        <span className="text-sm text-slate-700">
          {row.original.departmentName}
        </span>
      ),
    },
    {
      accessorKey: "positionName",
      header: "Jabatan",
      cell: ({ row }) => (
        <span className="text-sm text-slate-700">
          {row.original.positionName}
        </span>
      ),
    },
    {
      accessorKey: "contractType",
      header: "Kontrak",
      cell: ({ row }) => {
        const type = row.getValue("contractType") as string;
        return (
          <Badge
            variant="outline"
            className={
              type === "PKWT"
                ? "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50"
                : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-50"
            }
          >
            {type}
          </Badge>
        );
      },
    },
    {
      accessorKey: "joinDate",
      header: "Bergabung",
      cell: ({ row }) => {
        const dateStr = row.getValue("joinDate") as string;
        return (
          <span className="text-sm tabular-nums text-slate-600">
            {format(new Date(dateStr), "dd MMM yyyy", { locale: idLocale })}
          </span>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge
            variant="outline"
            className={
              isActive
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-100"
            }
          >
            <span
              aria-hidden="true"
              className={
                "mr-1 inline-block h-1.5 w-1.5 rounded-full " +
                (isActive ? "bg-emerald-500" : "bg-slate-400")
              }
            />
            {isActive ? "Aktif" : "Nonaktif"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Aksi</span>,
      cell: ({ row }) => {
        const employee = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-slate-900"
              >
                <span className="sr-only">Buka menu aksi karyawan</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/employees/${employee.id}`}>
                  <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                  Lihat Detail
                </Link>
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem asChild>
                  <Link href={`/employees/${employee.id}?tab=personal`}>
                    <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                    Edit
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
