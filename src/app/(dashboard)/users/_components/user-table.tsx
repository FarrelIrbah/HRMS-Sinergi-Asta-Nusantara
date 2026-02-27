"use client";

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { getUserColumns, type UserRow } from "./user-columns";
import { UserFormDialog } from "./user-form-dialog";
import { toggleUserActiveAction } from "@/lib/actions/user.actions";
import { useRouter } from "next/navigation";

interface UserTableProps {
  data: UserRow[];
  total: number;
}

export function UserTable({ data, total }: UserTableProps) {
  const router = useRouter();
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmUser, setConfirmUser] = useState<UserRow | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleEdit = useCallback((user: UserRow) => {
    setEditUser(user);
    setEditOpen(true);
  }, []);

  const handleToggleActive = useCallback((user: UserRow) => {
    setConfirmUser(user);
    setConfirmOpen(true);
  }, []);

  const columns = useMemo(
    () =>
      getUserColumns({
        onEdit: handleEdit,
        onToggleActive: handleToggleActive,
      }),
    [handleEdit, handleToggleActive]
  );

  const handleConfirmToggle = async () => {
    if (!confirmUser) return;

    setIsToggling(true);
    try {
      const result = await toggleUserActiveAction(confirmUser.id);
      if (result.success) {
        toast.success("Status pengguna berhasil diubah");
        router.refresh();
      } else {
        toast.error(result.error ?? "Gagal mengubah status pengguna");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsToggling(false);
      setConfirmOpen(false);
      setConfirmUser(null);
    }
  };

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <div className="mb-4 text-sm text-muted-foreground">
        Total: {total} pengguna
      </div>
      <DataTable
        columns={columns}
        data={data}
        searchKey="name"
        searchPlaceholder="Cari pengguna..."
      />

      <UserFormDialog
        mode="edit"
        user={editUser ?? undefined}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={
          confirmUser?.isActive
            ? "Nonaktifkan Pengguna"
            : "Aktifkan Pengguna"
        }
        description={
          confirmUser?.isActive
            ? `Nonaktifkan pengguna "${confirmUser?.name}"? Pengguna tidak akan dapat masuk ke sistem.`
            : `Aktifkan kembali pengguna "${confirmUser?.name}"?`
        }
        onConfirm={handleConfirmToggle}
        confirmText={confirmUser?.isActive ? "Nonaktifkan" : "Aktifkan"}
        variant={confirmUser?.isActive ? "destructive" : "default"}
        loading={isToggling}
      />
    </>
  );
}
