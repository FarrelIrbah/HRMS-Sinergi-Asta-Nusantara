"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLES } from "@/lib/constants";
import type { Role } from "@/types/enums";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
};

const roleColorMap: Record<Role, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-800 border-red-200",
  HR_ADMIN: "bg-blue-100 text-blue-800 border-blue-200",
  MANAGER: "bg-amber-100 text-amber-800 border-amber-200",
  EMPLOYEE: "bg-green-100 text-green-800 border-green-200",
};

interface UserColumnsOptions {
  onEdit: (user: UserRow) => void;
  onToggleActive: (user: UserRow) => void;
}

export function getUserColumns({
  onEdit,
  onToggleActive,
}: UserColumnsOptions): ColumnDef<UserRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Nama",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Peran",
      cell: ({ row }) => {
        const role = row.getValue("role") as Role;
        return (
          <Badge variant="outline" className={roleColorMap[role]}>
            {ROLES[role]}
          </Badge>
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
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-gray-100 text-gray-800 border-gray-200"
            }
          >
            {isActive ? "Aktif" : "Nonaktif"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Tanggal Dibuat",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date;
        return format(new Date(date), "dd MMM yyyy", { locale: id });
      },
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Buka menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(user)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleActive(user)}>
                {user.isActive ? "Nonaktifkan" : "Aktifkan"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
