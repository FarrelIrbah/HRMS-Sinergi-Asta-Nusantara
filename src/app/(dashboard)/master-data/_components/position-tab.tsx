"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, Plus, Briefcase, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SummaryTile } from "@/components/shared/summary-tile";
import { PositionFormDialog } from "./position-form-dialog";
import {
  getPositionsAction,
  deletePositionAction,
} from "@/lib/actions/master-data.actions";

interface Position {
  id: string;
  name: string;
  departmentId: string;
  department: { id: string; name: string };
  createdAt: string;
}

export function PositionTab() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Position | null>(null);
  const [isDeleting, startTransition] = useTransition();

  const fetchPositions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPositionsAction();
      if (result.success && result.data) {
        setPositions(result.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const handleCreate = () => {
    setEditingPosition(null);
    setFormOpen(true);
  };

  const handleEdit = (position: Position) => {
    setEditingPosition(position);
    setFormOpen(true);
  };

  const handleDelete = (position: Position) => {
    setDeleteTarget(position);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deletePositionAction(deleteTarget.id);
      if (result.success) {
        toast.success("Jabatan berhasil dihapus");
        fetchPositions();
      } else {
        toast.error(result.error || "Gagal menghapus jabatan");
      }
      setDeleteTarget(null);
    });
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingPosition(null);
    fetchPositions();
  };

  const columns: ColumnDef<Position, unknown>[] = [
    {
      accessorKey: "name",
      header: () => (
        <span className="text-xs font-semibold text-slate-600">
          Nama Jabatan
        </span>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-600"
            aria-hidden="true"
          >
            <Briefcase className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-medium text-slate-900">
            {row.original.name}
          </span>
        </div>
      ),
    },
    {
      id: "departmentName",
      header: () => (
        <span className="text-xs font-semibold text-slate-600">Departemen</span>
      ),
      accessorFn: (row) => row.department.name,
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          <Building2 className="h-3 w-3" aria-hidden="true" />
          {row.original.department.name}
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
            aria-label={`Edit jabatan ${row.original.name}`}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
            onClick={() => handleDelete(row.original)}
            aria-label={`Hapus jabatan ${row.original.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  const totalPositions = positions.length;
  const uniqueDepartments = new Set(positions.map((p) => p.departmentId)).size;

  return (
    <div className="space-y-4">
      <section
        aria-label="Ringkasan jabatan"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        <SummaryTile
          icon={Briefcase}
          label="Total Jabatan"
          value={totalPositions}
          tone="emerald"
        />
        <SummaryTile
          icon={Building2}
          label="Departemen Terkait"
          value={uniqueDepartments}
          tone="sky"
        />
        <SummaryTile
          icon={Briefcase}
          label="Rata-rata / Departemen"
          value={
            uniqueDepartments > 0
              ? Math.round(totalPositions / uniqueDepartments)
              : 0
          }
          tone="violet"
        />
      </section>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 md:p-6">
          <DataTable
            columns={columns}
            data={positions}
            searchKey="name"
            searchPlaceholder="Cari jabatan..."
            loading={loading}
            actions={
              <Button
                onClick={handleCreate}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Tambah Jabatan
              </Button>
            }
          />
        </CardContent>
      </Card>

      <PositionFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingPosition(null);
        }}
        position={editingPosition}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Hapus Jabatan"
        description={`Hapus jabatan "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={confirmDelete}
        confirmText="Hapus"
        variant="destructive"
        loading={isDeleting}
      />
    </div>
  );
}
