"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  MoreHorizontal,
  Pencil,
  UserCheck,
  UserX,
  ShieldCheck,
  Mail,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

const roleBadgeClass: Record<Role, string> = {
  SUPER_ADMIN: "border-rose-300 bg-rose-50 text-rose-700",
  HR_ADMIN: "border-sky-300 bg-sky-50 text-sky-700",
  MANAGER: "border-amber-300 bg-amber-50 text-amber-700",
  EMPLOYEE: "border-emerald-300 bg-emerald-50 text-emerald-700",
};

interface UserColumnsOptions {
  onEdit: (user: UserRow) => void;
  onToggleActive: (user: UserRow) => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function getUserColumns({
  onEdit,
  onToggleActive,
}: UserColumnsOptions): ColumnDef<UserRow>[] {
  return [
    {
      accessorKey: "name",
      header: () => (
        <span className="text-xs font-semibold text-slate-600">Pengguna</span>
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600"
              aria-hidden="true"
            >
              {getInitials(user.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {user.name}
              </p>
              <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                <Mail className="h-3 w-3" aria-hidden="true" />
                {user.email}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: () => (
        <span className="text-xs font-semibold text-slate-600">Peran</span>
      ),
      cell: ({ row }) => {
        const role = row.getValue("role") as Role;
        return (
          <Badge
            variant="outline"
            className={`gap-1 text-xs ${roleBadgeClass[role]}`}
          >
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            {ROLES[role]}
          </Badge>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: () => (
        <span className="text-xs font-semibold text-slate-600">Status</span>
      ),
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge
            variant="outline"
            className={
              isActive
                ? "gap-1 border-emerald-300 bg-emerald-50 text-xs text-emerald-700"
                : "gap-1 border-slate-300 bg-slate-50 text-xs text-slate-600"
            }
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isActive ? "bg-emerald-500" : "bg-slate-400"
              }`}
              aria-hidden="true"
            />
            {isActive ? "Aktif" : "Nonaktif"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: () => (
        <span className="text-xs font-semibold text-slate-600">
          Tanggal Dibuat
        </span>
      ),
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date;
        return (
          <span className="whitespace-nowrap text-sm text-slate-600">
            {format(new Date(date), "dd MMM yyyy", { locale: id })}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: () => (
        <span className="sr-only text-xs font-semibold text-slate-600">
          Aksi
        </span>
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  aria-label={`Buka menu aksi untuk ${user.name}`}
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onEdit(user)}>
                  <Pencil
                    className="mr-2 h-3.5 w-3.5 text-slate-500"
                    aria-hidden="true"
                  />
                  Edit Pengguna
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onToggleActive(user)}
                  className={
                    user.isActive
                      ? "text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                      : "text-emerald-700 focus:bg-emerald-50 focus:text-emerald-800"
                  }
                >
                  {user.isActive ? (
                    <>
                      <UserX
                        className="mr-2 h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      Nonaktifkan
                    </>
                  ) : (
                    <>
                      <UserCheck
                        className="mr-2 h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      Aktifkan
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
