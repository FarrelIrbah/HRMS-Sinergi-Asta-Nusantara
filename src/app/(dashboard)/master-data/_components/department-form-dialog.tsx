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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  departmentSchema,
  type DepartmentInput,
} from "@/lib/validations/master-data";
import {
  createDepartmentAction,
  updateDepartmentAction,
} from "@/lib/actions/master-data.actions";

interface Department {
  id: string;
  name: string;
  description: string | null;
}

interface DepartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
  onSuccess: () => void;
}

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
  onSuccess,
}: DepartmentFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!department;

  const form = useForm<DepartmentInput>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (department) {
        form.reset({
          name: department.name,
          description: department.description || "",
        });
      } else {
        form.reset({ name: "", description: "" });
      }
    }
  }, [open, department, form]);

  const onSubmit = (data: DepartmentInput) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateDepartmentAction(department.id, data)
        : await createDepartmentAction(data);

      if (result.success) {
        toast.success(
          isEditing
            ? "Departemen berhasil diubah"
            : "Departemen berhasil dibuat"
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
            {isEditing ? "Edit Departemen" : "Tambah Departemen"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Ubah informasi departemen."
              : "Tambahkan departemen baru ke sistem."}
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
                    <Input placeholder="Nama departemen" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi (opsional)</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Deskripsi departemen"
                      {...field}
                    />
                  </FormControl>
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
