"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, Plus, Building2, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SummaryTile } from "@/components/shared/summary-tile";
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
  const [isDeleting, startTransition] = useTransition();

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
      header: () => (
        <span className="text-xs font-semibold text-slate-600">
          Nama Departemen
        </span>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600"
            aria-hidden="true"
          >
            <Building2 className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-medium text-slate-900">
            {row.original.name}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: () => (
        <span className="text-xs font-semibold text-slate-600">Deskripsi</span>
      ),
      cell: ({ row }) => {
        const desc = row.original.description;
        if (!desc) return <span className="text-sm text-slate-400">—</span>;
        return (
          <span className="text-sm text-slate-600">
            {desc.length > 80 ? desc.slice(0, 80) + "…" : desc}
          </span>
        );
      },
    },
    {
      id: "positionCount",
      header: () => (
        <span className="text-xs font-semibold text-slate-600">
          Jumlah Jabatan
        </span>
      ),
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          <Briefcase className="h-3 w-3" aria-hidden="true" />
          {row.original._count.positions} jabatan
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: () => (
        <span className="text-xs font-semibold text-slate-600">
          Tanggal Dibuat
        </span>
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm text-slate-600">
          {new Date(row.original.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => (
        <span className="sr-only text-xs font-semibold text-slate-600">
          Aksi
        </span>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:bg-sky-50 hover:text-sky-700"
            onClick={() => handleEdit(row.original)}
            aria-label={`Edit departemen ${row.original.name}`}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
            onClick={() => handleDelete(row.original)}
            aria-label={`Hapus departemen ${row.original.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  const totalDepartments = departments.length;
  const totalPositions = departments.reduce(
    (sum, d) => sum + d._count.positions,
    0
  );
  const avgPositions =
    totalDepartments > 0 ? Math.round(totalPositions / totalDepartments) : 0;

  return (
    <div className="space-y-4">
      <section
        aria-label="Ringkasan departemen"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        <SummaryTile
          icon={Building2}
          label="Total Departemen"
          value={totalDepartments}
          tone="emerald"
        />
        <SummaryTile
          icon={Briefcase}
          label="Total Jabatan"
          value={totalPositions}
          tone="sky"
        />
        <SummaryTile
          icon={Briefcase}
          label="Rata-rata Jabatan"
          value={avgPositions}
          tone="violet"
        />
      </section>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 md:p-6">
          <DataTable
            columns={columns}
            data={departments}
            searchKey="name"
            searchPlaceholder="Cari departemen..."
            loading={loading}
            actions={
              <Button
                onClick={handleCreate}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Tambah Departemen
              </Button>
            }
          />
        </CardContent>
      </Card>

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
        loading={isDeleting}
      />
    </div>
  );
}
