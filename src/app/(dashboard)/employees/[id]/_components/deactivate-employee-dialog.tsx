"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  deactivateEmployeeSchema,
  type DeactivateEmployeeInput,
} from "@/lib/validations/employee";
import { deactivateEmployeeAction } from "@/lib/actions/employee.actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Resolver } from "react-hook-form";

interface DeactivateEmployeeDialogProps {
  employeeId: string;
  employeeName: string;
}

export function DeactivateEmployeeDialog({
  employeeId,
  employeeName,
}: DeactivateEmployeeDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const form = useForm<DeactivateEmployeeInput>({
    resolver: zodResolver(
      deactivateEmployeeSchema
    ) as unknown as Resolver<DeactivateEmployeeInput>,
    defaultValues: {
      terminationReason: "",
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: DeactivateEmployeeInput) {
    const result = await deactivateEmployeeAction(employeeId, values);

    if (!result.success) {
      toast.error(result.error ?? "Gagal menonaktifkan karyawan");
      return;
    }

    toast.success("Karyawan berhasil dinonaktifkan");
    setOpen(false);
    form.reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Nonaktifkan Karyawan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nonaktifkan Karyawan</DialogTitle>
          <DialogDescription>
            Nonaktifkan karyawan <strong>{employeeName}</strong> dari sistem.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Karyawan ini akan dinonaktifkan dan tidak dapat login ke sistem.
          </span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="terminationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Pemberhentian</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={
                        field.value
                          ? new Date(field.value).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) => {
                        field.onChange(
                          e.target.value ? new Date(e.target.value) : undefined
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terminationReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alasan Pemberhentian</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Masukkan alasan pemberhentian..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Nonaktifkan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
