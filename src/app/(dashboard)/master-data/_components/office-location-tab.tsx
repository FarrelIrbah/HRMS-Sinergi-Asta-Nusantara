"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { OfficeLocationFormDialog } from "./office-location-form-dialog";
import {
  getOfficeLocationsAction,
  deleteOfficeLocationAction,
} from "@/lib/actions/master-data.actions";

interface OfficeLocation {
  id: string;
  name: string;
  address: string | null;
  allowedIPs: string[];
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number | null;
  createdAt: string;
}

export function OfficeLocationTab() {
  const [locations, setLocations] = useState<OfficeLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] =
    useState<OfficeLocation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OfficeLocation | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getOfficeLocationsAction();
      if (result.success && result.data) {
        setLocations(result.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleCreate = () => {
    setEditingLocation(null);
    setFormOpen(true);
  };

  const handleEdit = (location: OfficeLocation) => {
    setEditingLocation(location);
    setFormOpen(true);
  };

  const handleDelete = (location: OfficeLocation) => {
    setDeleteTarget(location);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteOfficeLocationAction(deleteTarget.id);
      if (result.success) {
        toast.success("Lokasi kantor berhasil dihapus");
        fetchLocations();
      } else {
        toast.error(result.error || "Gagal menghapus lokasi kantor");
      }
      setDeleteTarget(null);
    });
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingLocation(null);
    fetchLocations();
  };

  const columns: ColumnDef<OfficeLocation, unknown>[] = [
    {
      accessorKey: "name",
      header: "Nama",
    },
    {
      accessorKey: "address",
      header: "Alamat",
      cell: ({ row }) => {
        const addr = row.original.address;
        if (!addr) return <span className="text-muted-foreground">-</span>;
        return addr.length > 60 ? addr.slice(0, 60) + "..." : addr;
      },
    },
    {
      id: "ipRange",
      header: "IP Range",
      cell: ({ row }) => {
        const ips = row.original.allowedIPs;
        if (!ips || ips.length === 0) {
          return (
            <span className="text-muted-foreground">Tidak dikonfigurasi</span>
          );
        }
        return `${ips.length} IP`;
      },
    },
    {
      id: "gps",
      header: "GPS",
      cell: ({ row }) => {
        const { latitude, longitude, radiusMeters } = row.original;
        if (latitude === null || longitude === null) {
          return (
            <span className="text-muted-foreground">Tidak dikonfigurasi</span>
          );
        }
        return (
          <span className="text-xs">
            {latitude.toFixed(4)}, {longitude.toFixed(4)}
            {radiusMeters ? ` (${radiusMeters}m)` : ""}
          </span>
        );
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
          Tambah Lokasi
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={locations}
        searchKey="name"
        searchPlaceholder="Cari lokasi kantor..."
      />

      <OfficeLocationFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingLocation(null);
        }}
        location={editingLocation}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Hapus Lokasi Kantor"
        description={`Hapus lokasi kantor "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={confirmDelete}
        confirmText="Hapus"
        variant="destructive"
      />
    </div>
  );
}
