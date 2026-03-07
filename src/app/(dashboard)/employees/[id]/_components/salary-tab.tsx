"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  updateEmployeeSalarySchema,
  type UpdateEmployeeSalaryInput,
} from "@/lib/validations/payroll";
import { updateEmployeeSalaryAction } from "@/lib/actions/payroll.actions";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ─── Props ────────────────────────────────────────────────────────────────────

interface AllowanceItem {
  id: string;
  name: string;
  amount: number;
  isFixed: boolean;
}

interface SalaryTabProps {
  employeeId: string;
  baseSalary: number;
  allowances: AllowanceItem[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SalaryTab({
  employeeId,
  baseSalary,
  allowances,
}: SalaryTabProps) {
  const router = useRouter();

  const form = useForm<UpdateEmployeeSalaryInput>({
    resolver: zodResolver(
      updateEmployeeSalarySchema
    ) as Resolver<UpdateEmployeeSalaryInput>,
    defaultValues: {
      employeeId,
      baseSalary,
      allowances: allowances.map((a) => ({
        id: a.id,
        name: a.name,
        amount: a.amount,
        isFixed: a.isFixed,
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "allowances",
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: UpdateEmployeeSalaryInput) => {
    try {
      const result = await updateEmployeeSalaryAction(data);
      if (result.success) {
        toast.success("Gaji & tunjangan berhasil diperbarui");
        router.refresh();
      } else {
        toast.error(result.error ?? "Gagal memperbarui gaji & tunjangan");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Gaji Pokok */}
        <Card>
          <CardHeader>
            <CardTitle>Gaji Pokok</CardTitle>
            <CardDescription>
              Gaji pokok karyawan sebelum tunjangan dan potongan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="baseSalary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gaji Pokok (Rp)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={1000}
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Tunjangan */}
        <Card>
          <CardHeader>
            <CardTitle>Tunjangan</CardTitle>
            <CardDescription>
              Daftar tunjangan karyawan. Tunjangan tetap termasuk dalam basis
              perhitungan BPJS.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Belum ada tunjangan. Klik &ldquo;Tambah Tunjangan&rdquo; untuk menambahkan.
              </p>
            )}

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-end gap-3 rounded-md border p-3"
              >
                {/* Nama Tunjangan */}
                <FormField
                  control={form.control}
                  name={`allowances.${index}.name`}
                  render={({ field: f }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Nama Tunjangan</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Tunjangan Makan" {...f} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Jumlah */}
                <FormField
                  control={form.control}
                  name={`allowances.${index}.amount`}
                  render={({ field: f }) => (
                    <FormItem className="w-40">
                      <FormLabel>Jumlah (Rp)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={1000}
                          placeholder="0"
                          {...f}
                          onChange={(e) => f.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tetap */}
                <FormField
                  control={form.control}
                  name={`allowances.${index}.isFixed`}
                  render={({ field: f }) => (
                    <FormItem className="flex flex-col items-center gap-1.5 pb-0.5">
                      <FormLabel className="text-xs">Tetap</FormLabel>
                      <FormControl>
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer rounded border-gray-300 text-primary accent-primary"
                          checked={f.value}
                          onChange={(e) => f.onChange(e.target.checked)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Remove button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mb-0.5 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Hapus tunjangan</span>
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: "", amount: 0, isFixed: true })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Tunjangan
            </Button>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
