"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
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

export function getEmployeeColumns({
  userRole,
}: EmployeeColumnsOptions): ColumnDef<EmployeeRow>[] {
  const canEdit = userRole === "HR_ADMIN" || userRole === "SUPER_ADMIN";

  return [
    {
      accessorKey: "namaLengkap",
      header: "Nama Lengkap",
      cell: ({ row }) => {
        const name = row.original.namaLengkap;
        const email = row.original.email;
        return (
          <div>
            <div className="font-medium">{name}</div>
            <div className="text-sm text-muted-foreground">{email}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "nik",
      header: "NIK",
    },
    {
      accessorKey: "departmentName",
      header: "Departemen",
    },
    {
      accessorKey: "positionName",
      header: "Jabatan",
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
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-red-100 text-red-800 border-red-200"
            }
          >
            {isActive ? "Aktif" : "Nonaktif"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "contractType",
      header: "Tipe Kontrak",
      cell: ({ row }) => {
        const type = row.getValue("contractType") as string;
        return (
          <Badge
            variant="outline"
            className={
              type === "PKWT"
                ? "bg-blue-100 text-blue-800 border-blue-200"
                : "bg-purple-100 text-purple-800 border-purple-200"
            }
          >
            {type}
          </Badge>
        );
      },
    },
    {
      accessorKey: "joinDate",
      header: "Tanggal Masuk",
      cell: ({ row }) => {
        const dateStr = row.getValue("joinDate") as string;
        return format(new Date(dateStr), "dd MMM yyyy", { locale: idLocale });
      },
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const employee = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Buka menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/employees/${employee.id}`}>Lihat Detail</Link>
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem asChild>
                  <Link href={`/employees/${employee.id}?tab=personal`}>
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
