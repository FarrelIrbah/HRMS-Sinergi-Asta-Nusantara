"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Pencil,
  Trash2,
  Plus,
  MapPin,
  Globe,
  Navigation,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SummaryTile } from "@/components/shared/summary-tile";
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
  const [isDeleting, startTransition] = useTransition();

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
      header: () => (
        <span className="text-xs font-semibold text-slate-600">Nama Lokasi</span>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600"
            aria-hidden="true"
          >
            <MapPin className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-medium text-slate-900">
            {row.original.name}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "address",
      header: () => (
        <span className="text-xs font-semibold text-slate-600">Alamat</span>
      ),
      cell: ({ row }) => {
        const addr = row.original.address;
        if (!addr) return <span className="text-sm text-slate-400">—</span>;
        return (
          <span className="text-sm text-slate-600">
            {addr.length > 60 ? addr.slice(0, 60) + "…" : addr}
          </span>
        );
      },
    },
    {
      id: "ipRange",
      header: () => (
        <span className="text-xs font-semibold text-slate-600">IP Range</span>
      ),
      cell: ({ row }) => {
        const ips = row.original.allowedIPs;
        if (!ips || ips.length === 0) {
          return (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              <Globe className="h-3 w-3" aria-hidden="true" />
              Tidak dikonfigurasi
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
            <Globe className="h-3 w-3" aria-hidden="true" />
            {ips.length} IP
          </span>
        );
      },
    },
    {
      id: "gps",
      header: () => (
        <span className="text-xs font-semibold text-slate-600">GPS</span>
      ),
      cell: ({ row }) => {
        const { latitude, longitude, radiusMeters } = row.original;
        if (latitude === null || longitude === null) {
          return (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              <Navigation className="h-3 w-3" aria-hidden="true" />
              Tidak dikonfigurasi
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-xs text-emerald-700">
            <Navigation className="h-3 w-3" aria-hidden="true" />
            {latitude.toFixed(4)}, {longitude.toFixed(4)}
            {radiusMeters ? ` · ${radiusMeters}m` : ""}
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
            aria-label={`Edit lokasi ${row.original.name}`}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
            onClick={() => handleDelete(row.original)}
            aria-label={`Hapus lokasi ${row.original.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  const totalLocations = locations.length;
  const withGps = locations.filter(
    (l) => l.latitude !== null && l.longitude !== null
  ).length;
  const withIp = locations.filter((l) => l.allowedIPs.length > 0).length;

  return (
    <div className="space-y-4">
      <section
        aria-label="Ringkasan lokasi kantor"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        <SummaryTile
          icon={MapPin}
          label="Total Lokasi"
          value={totalLocations}
          tone="emerald"
        />
        <SummaryTile
          icon={Navigation}
          label="Dengan GPS"
          value={withGps}
          tone="sky"
        />
        <SummaryTile
          icon={Globe}
          label="Dengan IP Range"
          value={withIp}
          tone="violet"
        />
      </section>

      <div className="flex justify-end">
        <Button
          onClick={handleCreate}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Tambah Lokasi
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Memuat data lokasi…
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={locations}
              searchKey="name"
              searchPlaceholder="Cari lokasi kantor..."
            />
          )}
        </CardContent>
      </Card>

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
        loading={isDeleting}
      />
    </div>
  );
}
