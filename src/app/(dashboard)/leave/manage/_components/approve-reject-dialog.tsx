"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  approveLeaveAction,
  rejectLeaveAction,
} from "@/lib/actions/leave.actions";

interface ApproveRejectDialogProps {
  leaveRequestId: string;
  mode: "approve" | "reject";
  employeeName: string;
}

export function ApproveRejectDialog({
  leaveRequestId,
  mode,
  employeeName,
}: ApproveRejectDialogProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (mode === "reject" && !notes.trim()) {
      toast.error("Alasan penolakan wajib diisi");
      return;
    }

    startTransition(async () => {
      const input = { leaveRequestId, notes };
      const result =
        mode === "approve"
          ? await approveLeaveAction(input)
          : await rejectLeaveAction(input);

      if (result.success) {
        toast.success(
          mode === "approve"
            ? "Pengajuan cuti disetujui"
            : "Pengajuan cuti ditolak"
        );
        setOpen(false);
        setNotes("");
      } else {
        toast.error(result.error ?? "Gagal memproses pengajuan");
      }
    });
  }

  const isApprove = mode === "approve";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={isApprove ? "default" : "destructive"}
          size="sm"
          className={`gap-1 text-xs ${isApprove ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
        >
          {isApprove ? (
            <CheckCircle className="h-3 w-3" aria-hidden="true" />
          ) : (
            <XCircle className="h-3 w-3" aria-hidden="true" />
          )}
          {isApprove ? "Setujui" : "Tolak"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-slate-900">
            {isApprove ? "Setujui" : "Tolak"} Pengajuan Cuti
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {isApprove
              ? `Anda akan menyetujui pengajuan cuti dari ${employeeName}.`
              : `Anda akan menolak pengajuan cuti dari ${employeeName}.`}
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-sm text-slate-700">
              Catatan {isApprove ? "(opsional)" : "(wajib)"}
            </Label>
            <Textarea
              id="notes"
              placeholder={
                isApprove
                  ? "Tambahkan catatan jika diperlukan..."
                  : "Jelaskan alasan penolakan..."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="border-slate-200"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-slate-200"
            >
              Batal
            </Button>
            <Button
              variant={isApprove ? "default" : "destructive"}
              onClick={handleSubmit}
              disabled={isPending}
              className={isApprove ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              {isPending
                ? "Memproses..."
                : isApprove
                  ? "Setujui"
                  : "Tolak"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
