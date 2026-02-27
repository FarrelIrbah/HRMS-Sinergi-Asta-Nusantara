"use client";

import { useEffect, useState, useTransition } from "react";
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
      // Fetch active departments for dropdown
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Jabatan" : "Tambah Jabatan"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Ubah informasi jabatan."
              : "Tambahkan jabatan baru ke sistem."}
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
                    <Input placeholder="Nama jabatan" {...field} />
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
                  <FormLabel>Departemen</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
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
