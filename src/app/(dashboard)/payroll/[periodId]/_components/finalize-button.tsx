"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
        className="gap-2 bg-emerald-600 hover:bg-emerald-700"
      >
        <Lock className="h-4 w-4" aria-hidden="true" />
        Finalisasi Penggajian
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-100"
                aria-hidden="true"
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <AlertDialogTitle className="text-slate-900">
                  Finalisasi Penggajian
                </AlertDialogTitle>
                <p className="text-sm leading-relaxed text-slate-600">
                  Setelah difinalisasi, data penggajian{" "}
                  <span className="font-medium text-slate-900">
                    tidak dapat diubah
                  </span>{" "}
                  atau dihitung ulang. Slip gaji akan tersedia untuk diunduh
                  setelah finalisasi.
                </p>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              disabled={loading}
              className="border-slate-200"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={loading}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Lock className="h-4 w-4" aria-hidden="true" />
              )}
              {loading ? "Memproses..." : "Finalisasi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
