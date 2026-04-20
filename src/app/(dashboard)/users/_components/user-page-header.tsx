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
    <>
      <Button
        onClick={() => setCreateOpen(true)}
        className="gap-2 bg-emerald-600 hover:bg-emerald-700"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Tambah Pengguna
      </Button>
      <UserFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
}
