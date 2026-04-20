"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CalendarDays, Loader2, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  leaveTypeSchema,
  type LeaveTypeInput,
} from "@/lib/validations/master-data";
import {
  createLeaveTypeAction,
  updateLeaveTypeAction,
} from "@/lib/actions/master-data.actions";

interface LeaveType {
  id: string;
  name: string;
  annualQuota: number;
  isPaid: boolean;
  genderRestriction: string | null;
}

interface LeaveTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveType: LeaveType | null;
  onSuccess: () => void;
}

export function LeaveTypeFormDialog({
  open,
  onOpenChange,
  leaveType,
  onSuccess,
}: LeaveTypeFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!leaveType;

  const form = useForm<LeaveTypeInput>({
    resolver: zodResolver(leaveTypeSchema),
    defaultValues: {
      name: "",
      annualQuota: 0,
      isPaid: true,
      genderRestriction: null,
    },
  });

  useEffect(() => {
    if (open) {
      if (leaveType) {
        form.reset({
          name: leaveType.name,
          annualQuota: leaveType.annualQuota,
          isPaid: leaveType.isPaid,
          genderRestriction: leaveType.genderRestriction as
            | "MALE"
            | "FEMALE"
            | null,
        });
      } else {
        form.reset({
          name: "",
          annualQuota: 0,
          isPaid: true,
          genderRestriction: null,
        });
      }
    }
  }, [open, leaveType, form]);

  const onSubmit = (data: LeaveTypeInput) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateLeaveTypeAction(leaveType.id, data)
        : await createLeaveTypeAction(data);

      if (result.success) {
        toast.success(
          isEditing
            ? "Jenis cuti berhasil diubah"
            : "Jenis cuti berhasil dibuat"
        );
        onSuccess();
      } else {
        toast.error(result.error || "Terjadi kesalahan");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-100"
              aria-hidden="true"
            >
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-slate-900">
                {isEditing ? "Edit Jenis Cuti" : "Tambah Jenis Cuti"}
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                {isEditing
                  ? "Perbarui kuota, status pembayaran, dan pembatasan."
                  : "Tambahkan jenis cuti baru dengan kuota tahunan."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            aria-label="Form jenis cuti"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-slate-700">Nama</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="cth. Cuti Tahunan, Cuti Sakit"
                      className="border-slate-200 bg-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="annualQuota"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-slate-700">
                    Kuota Tahunan
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={365}
                        placeholder="12"
                        className="border-slate-200 bg-white tabular-nums"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10) || 0)
                        }
                      />
                      <span className="text-sm text-slate-500">hari</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isPaid"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </FormControl>
                  <div className="flex-1">
                    <FormLabel className="text-sm font-medium text-slate-900">
                      Cuti Berbayar
                    </FormLabel>
                    <p className="text-xs text-slate-500">
                      Karyawan tetap menerima upah selama cuti berlangsung
                    </p>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="genderRestriction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-slate-700">
                    Pembatasan Gender
                  </FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === "ALL" ? null : value)
                    }
                    value={field.value ?? "ALL"}
                  >
                    <FormControl>
                      <SelectTrigger className="border-slate-200 bg-white">
                        <SelectValue placeholder="Pilih pembatasan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ALL">Semua</SelectItem>
                      <SelectItem value="MALE">Pria</SelectItem>
                      <SelectItem value="FEMALE">Wanita</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="border-slate-200"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="h-4 w-4" aria-hidden="true" />
                )}
                {isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
