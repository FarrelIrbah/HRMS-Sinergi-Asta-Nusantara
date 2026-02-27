"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
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
  const [isPending, startTransition] = useTransition();

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
      header: "Nama",
    },
    {
      id: "departmentName",
      header: "Departemen",
      accessorFn: (row) => row.department.name,
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
          Tambah Jabatan
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={positions}
        searchKey="name"
        searchPlaceholder="Cari jabatan..."
      />

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
      />
    </div>
  );
}
