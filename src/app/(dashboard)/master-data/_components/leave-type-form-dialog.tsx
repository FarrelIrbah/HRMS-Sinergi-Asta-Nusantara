"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Jenis Cuti" : "Tambah Jenis Cuti"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Ubah informasi jenis cuti."
              : "Tambahkan jenis cuti baru ke sistem."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="cth. Cuti Tahunan, Cuti Sakit"
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
                  <FormLabel>Kuota Tahunan</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={365}
                        placeholder="12"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10) || 0)
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        hari
                      </span>
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
                <FormItem className="flex flex-row items-center gap-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Cuti Berbayar</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="genderRestriction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pembatasan Gender</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === "ALL" ? null : value)
                    }
                    value={field.value ?? "ALL"}
                  >
                    <FormControl>
                      <SelectTrigger>
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
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
