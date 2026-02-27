"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserFormDialog } from "./user-form-dialog";
import { useRouter } from "next/navigation";

export function UserPageHeader() {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Manajemen Pengguna
        </h1>
        <p className="text-muted-foreground">
          Kelola akun pengguna sistem HRMS
        </p>
      </div>
      <Button onClick={() => setCreateOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Tambah Pengguna
      </Button>
      <UserFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
