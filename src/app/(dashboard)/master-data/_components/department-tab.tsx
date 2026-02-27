"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DepartmentFormDialog } from "./department-form-dialog";
import {
  getDepartmentsAction,
  deleteDepartmentAction,
} from "@/lib/actions/master-data.actions";

interface Department {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { positions: number };
}

export function DepartmentTab() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [, startTransition] = useTransition();

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getDepartmentsAction();
      if (result.success && result.data) {
        setDepartments(result.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleCreate = () => {
    setEditingDepartment(null);
    setFormOpen(true);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormOpen(true);
  };

  const handleDelete = (department: Department) => {
    setDeleteTarget(department);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteDepartmentAction(deleteTarget.id);
      if (result.success) {
        toast.success("Departemen berhasil dihapus");
        fetchDepartments();
      } else {
        toast.error(result.error || "Gagal menghapus departemen");
      }
      setDeleteTarget(null);
    });
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingDepartment(null);
    fetchDepartments();
  };

  const columns: ColumnDef<Department, unknown>[] = [
    {
      accessorKey: "name",
      header: "Nama",
    },
    {
      accessorKey: "description",
      header: "Deskripsi",
      cell: ({ row }) => {
        const desc = row.original.description;
        if (!desc) return <span className="text-muted-foreground">-</span>;
        return desc.length > 80 ? desc.slice(0, 80) + "..." : desc;
      },
    },
    {
      id: "positionCount",
      header: "Jumlah Jabatan",
      cell: ({ row }) => row.original._count.positions,
    },
    {
      accessorKey: "createdAt",
      header: "Tanggal Dibuat",
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Departemen
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={departments}
        searchKey="name"
        searchPlaceholder="Cari departemen..."
      />

      <DepartmentFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingDepartment(null);
        }}
        department={editingDepartment}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Hapus Departemen"
        description={`Hapus departemen "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={confirmDelete}
        confirmText="Hapus"
        variant="destructive"
      />
    </div>
  );
}
