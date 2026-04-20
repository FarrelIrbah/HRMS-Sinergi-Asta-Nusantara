"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Briefcase, Loader2, Save } from "lucide-react";
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
  positionSchema,
  type PositionInput,
} from "@/lib/validations/master-data";
import {
  createPositionAction,
  updatePositionAction,
  getAllDepartmentsAction,
} from "@/lib/actions/master-data.actions";

interface Position {
  id: string;
  name: string;
  departmentId: string;
  department: { id: string; name: string };
}

interface Department {
  id: string;
  name: string;
}

interface PositionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: Position | null;
  onSuccess: () => void;
}

export function PositionFormDialog({
  open,
  onOpenChange,
  position,
  onSuccess,
}: PositionFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [departments, setDepartments] = useState<Department[]>([]);
  const isEditing = !!position;

  const form = useForm<PositionInput>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      name: "",
      departmentId: "",
    },
  });

  useEffect(() => {
    if (open) {
      getAllDepartmentsAction().then((result) => {
        if (result.success && result.data) {
          setDepartments(result.data);
        }
      });

      if (position) {
        form.reset({
          name: position.name,
          departmentId: position.departmentId,
        });
      } else {
        form.reset({ name: "", departmentId: "" });
      }
    }
  }, [open, position, form]);

  const onSubmit = (data: PositionInput) => {
    startTransition(async () => {
      const result = isEditing
        ? await updatePositionAction(position.id, data)
        : await createPositionAction(data);

      if (result.success) {
        toast.success(
          isEditing ? "Jabatan berhasil diubah" : "Jabatan berhasil dibuat"
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
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 ring-1 ring-sky-100"
              aria-hidden="true"
            >
              <Briefcase className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-slate-900">
                {isEditing ? "Edit Jabatan" : "Tambah Jabatan"}
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                {isEditing
                  ? "Perbarui informasi jabatan dan departemen terkait."
                  : "Tambahkan jabatan baru dan tetapkan departemennya."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            aria-label="Form jabatan"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-slate-700">Nama</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nama jabatan"
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
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-slate-700">
                    Departemen
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-slate-200 bg-white">
                        <SelectValue placeholder="Pilih departemen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
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
