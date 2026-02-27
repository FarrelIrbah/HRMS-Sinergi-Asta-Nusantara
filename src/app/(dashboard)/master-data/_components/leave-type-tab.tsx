"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LeaveTypeFormDialog } from "./leave-type-form-dialog";
import {
  getLeaveTypesAction,
  deleteLeaveTypeAction,
} from "@/lib/actions/master-data.actions";

interface LeaveType {
  id: string;
  name: string;
  annualQuota: number;
  isPaid: boolean;
  genderRestriction: string | null;
  createdAt: string;
}

const GENDER_LABELS: Record<string, string> = {
  MALE: "Pria",
  FEMALE: "Wanita",
};

export function LeaveTypeTab() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<LeaveType | null>(null);
  const [, startTransition] = useTransition();

  const fetchLeaveTypes = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getLeaveTypesAction();
      if (result.success && result.data) {
        setLeaveTypes(result.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  const handleCreate = () => {
    setEditingLeaveType(null);
    setFormOpen(true);
  };

  const handleEdit = (leaveType: LeaveType) => {
    setEditingLeaveType(leaveType);
    setFormOpen(true);
  };

  const handleDelete = (leaveType: LeaveType) => {
    setDeleteTarget(leaveType);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteLeaveTypeAction(deleteTarget.id);
      if (result.success) {
        toast.success("Jenis cuti berhasil dihapus");
        fetchLeaveTypes();
      } else {
        toast.error(result.error || "Gagal menghapus jenis cuti");
      }
      setDeleteTarget(null);
    });
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingLeaveType(null);
    fetchLeaveTypes();
  };

  const columns: ColumnDef<LeaveType, unknown>[] = [
    {
      accessorKey: "name",
      header: "Nama",
    },
    {
      accessorKey: "annualQuota",
      header: "Kuota Tahunan",
      cell: ({ row }) => `${row.original.annualQuota} hari`,
    },
    {
      accessorKey: "isPaid",
      header: "Berbayar",
      cell: ({ row }) =>
        row.original.isPaid ? (
          <Badge variant="default">Ya</Badge>
        ) : (
          <Badge variant="secondary">Tidak</Badge>
        ),
    },
    {
      id: "genderRestriction",
      header: "Pembatasan Gender",
      cell: ({ row }) => {
        const restriction = row.original.genderRestriction;
        if (!restriction) return "Semua";
        return GENDER_LABELS[restriction] || restriction;
      },
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
          Tambah Jenis Cuti
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={leaveTypes}
        searchKey="name"
        searchPlaceholder="Cari jenis cuti..."
      />

      <LeaveTypeFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingLeaveType(null);
        }}
        leaveType={editingLeaveType}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Hapus Jenis Cuti"
        description={`Hapus jenis cuti "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={confirmDelete}
        confirmText="Hapus"
        variant="destructive"
      />
    </div>
  );
}
