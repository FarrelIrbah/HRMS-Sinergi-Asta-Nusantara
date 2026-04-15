"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  CircleDollarSign,
  Coins,
  Loader2,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Gaji Pokok */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-start gap-3 border-b border-slate-100 bg-slate-50/50 py-4">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
              aria-hidden="true"
            >
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Gaji Pokok
              </CardTitle>
              <CardDescription className="mt-0.5 text-sm text-slate-500">
                Nilai dasar gaji sebelum tunjangan, bonus, dan potongan.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-5 md:p-6">
            <FormField
              control={form.control}
              name="baseSalary"
              render={({ field }) => (
                <FormItem className="max-w-md">
                  <FormLabel className="text-slate-700">
                    Gaji Pokok (Rp)
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500"
                        aria-hidden="true"
                      >
                        Rp
                      </span>
                      <Input
                        type="number"
                        min={0}
                        step={1000}
                        placeholder="0"
                        className="pl-9 font-mono tabular-nums"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Tunjangan */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-start gap-3 border-b border-slate-100 bg-slate-50/50 py-4">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 ring-1 ring-sky-100"
              aria-hidden="true"
            >
              <Coins className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Tunjangan
              </CardTitle>
              <CardDescription className="mt-0.5 text-sm text-slate-500">
                Tunjangan tetap ikut dalam basis perhitungan BPJS dan pajak.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-5 md:p-6">
            {fields.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/40 px-4 py-8 text-center">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-600"
                  aria-hidden="true"
                >
                  <CircleDollarSign className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  Belum ada tunjangan
                </p>
                <p className="max-w-xs text-xs text-slate-500">
                  Klik tombol di bawah untuk menambahkan tunjangan pertama.
                </p>
              </div>
            )}

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/40 p-3 sm:flex-row sm:items-end"
              >
                {/* Nama Tunjangan */}
                <FormField
                  control={form.control}
                  name={`allowances.${index}.name`}
                  render={({ field: f }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs font-medium text-slate-600">
                        Nama Tunjangan
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: Tunjangan Makan"
                          className="bg-white"
                          {...f}
                        />
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
                    <FormItem className="sm:w-44">
                      <FormLabel className="text-xs font-medium text-slate-600">
                        Jumlah (Rp)
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500"
                            aria-hidden="true"
                          >
                            Rp
                          </span>
                          <Input
                            type="number"
                            min={0}
                            step={1000}
                            placeholder="0"
                            className="bg-white pl-8 font-mono tabular-nums"
                            {...f}
                            onChange={(e) =>
                              f.onChange(Number(e.target.value))
                            }
                          />
                        </div>
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
                    <FormItem className="flex flex-row items-center gap-2 sm:flex-col sm:items-center sm:justify-end sm:pb-2.5">
                      <FormLabel className="order-2 text-xs font-medium text-slate-600 sm:order-1">
                        Tetap
                      </FormLabel>
                      <FormControl>
                        <input
                          type="checkbox"
                          className="order-1 h-4 w-4 cursor-pointer rounded border-slate-300 accent-emerald-600 sm:order-2"
                          checked={f.value}
                          onChange={(e) => f.onChange(e.target.checked)}
                          aria-label={`Tunjangan tetap ${index + 1}`}
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
                  className="shrink-0 self-end text-rose-600 hover:bg-rose-50 hover:text-rose-700 sm:mb-0.5"
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
              className="gap-2 border-sky-200 text-sky-700 hover:bg-sky-50 hover:text-sky-800"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Tambah Tunjangan
            </Button>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="mr-auto text-xs text-slate-500">
            Perubahan berlaku untuk slip gaji periode berikutnya.
          </p>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {isSubmitting && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {isSubmitting ? "Menyimpan..." : "Simpan Gaji & Tunjangan"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
