"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Pencil,
  Trash2,
  Plus,
  CalendarDays,
  BadgeDollarSign,
  Loader2,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SummaryTile } from "@/components/shared/summary-tile";
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
  const [isDeleting, startTransition] = useTransition();

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
      header: () => (
        <span className="text-xs font-semibold text-slate-600">Jenis Cuti</span>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600"
            aria-hidden="true"
          >
            <CalendarDays className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-medium text-slate-900">
            {row.original.name}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "annualQuota",
      header: () => (
        <span className="text-xs font-semibold text-slate-600">
          Kuota Tahunan
        </span>
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-slate-700">
          {row.original.annualQuota} hari
        </span>
      ),
    },
    {
      accessorKey: "isPaid",
      header: () => (
        <span className="text-xs font-semibold text-slate-600">Status</span>
      ),
      cell: ({ row }) =>
        row.original.isPaid ? (
          <Badge
            variant="outline"
            className="gap-1 border-emerald-300 bg-emerald-50 text-xs text-emerald-700"
          >
            <BadgeDollarSign className="h-3 w-3" aria-hidden="true" />
            Berbayar
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="gap-1 border-slate-300 bg-slate-50 text-xs text-slate-600"
          >
            Tidak Berbayar
          </Badge>
        ),
    },
    {
      id: "genderRestriction",
      header: () => (
        <span className="text-xs font-semibold text-slate-600">
          Pembatasan Gender
        </span>
      ),
      cell: ({ row }) => {
        const restriction = row.original.genderRestriction;
        if (!restriction) {
          return (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              <UserIcon className="h-3 w-3" aria-hidden="true" />
              Semua
            </span>
          );
        }
        const tone =
          restriction === "MALE"
            ? "bg-sky-50 text-sky-700"
            : "bg-rose-50 text-rose-700";
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs ${tone}`}
          >
            <UserIcon className="h-3 w-3" aria-hidden="true" />
            {GENDER_LABELS[restriction] || restriction}
          </span>
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
            aria-label={`Edit jenis cuti ${row.original.name}`}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
            onClick={() => handleDelete(row.original)}
            aria-label={`Hapus jenis cuti ${row.original.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  const totalTypes = leaveTypes.length;
  const paidTypes = leaveTypes.filter((l) => l.isPaid).length;
  const totalDays = leaveTypes.reduce((sum, l) => sum + l.annualQuota, 0);

  return (
    <div className="space-y-4">
      <section
        aria-label="Ringkasan jenis cuti"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        <SummaryTile
          icon={CalendarDays}
          label="Total Jenis Cuti"
          value={totalTypes}
          tone="emerald"
        />
        <SummaryTile
          icon={BadgeDollarSign}
          label="Berbayar"
          value={paidTypes}
          tone="sky"
        />
        <SummaryTile
          icon={CalendarDays}
          label="Total Hari Kuota"
          value={totalDays}
          tone="violet"
        />
      </section>

      <div className="flex justify-end">
        <Button
          onClick={handleCreate}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Tambah Jenis Cuti
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Memuat data jenis cuti…
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={leaveTypes}
              searchKey="name"
              searchPlaceholder="Cari jenis cuti..."
            />
          )}
        </CardContent>
      </Card>

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
        loading={isDeleting}
      />
    </div>
  );
}
