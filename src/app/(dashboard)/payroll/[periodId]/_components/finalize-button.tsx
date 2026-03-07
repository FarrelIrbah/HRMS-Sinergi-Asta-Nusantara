"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { finalizePayrollAction } from "@/lib/actions/payroll.actions";

interface FinalizeButtonProps {
  runId: string;
}

export function FinalizeButton({ runId }: FinalizeButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const result = await finalizePayrollAction({ payrollRunId: runId });

      if (!result.success) {
        toast.error(result.error ?? "Terjadi kesalahan");
        return;
      }

      toast.success("Penggajian berhasil difinalisasi");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan yang tidak terduga");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        Finalisasi Penggajian
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Finalisasi Penggajian"
        description="Setelah difinalisasi, data penggajian tidak dapat diubah atau dihitung ulang. Slip gaji dapat diunduh setelah finalisasi. Lanjutkan?"
        confirmText="Finalisasi"
        cancelText="Batal"
        onConfirm={handleConfirm}
        loading={loading}
      />
    </>
  );
}
