"use client";

import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, Info, Loader2, Receipt } from "lucide-react";
import { PTKP_STATUS_LABELS } from "@/lib/constants";
import type { PTKPStatus } from "@/types/enums";
import {
  updateTaxBpjsSchema,
  type UpdateTaxBpjsInput,
} from "@/lib/validations/employee";
import { updateTaxBpjsAction } from "@/lib/actions/employee.actions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SerializedEmployee } from "./employee-profile-tabs";

interface TaxBpjsTabProps {
  employee: SerializedEmployee;
  readOnly: boolean;
}

const ptkpStatusOptions = Object.entries(PTKP_STATUS_LABELS) as [
  PTKPStatus,
  string,
][];

export function TaxBpjsTab({ employee, readOnly }: TaxBpjsTabProps) {
  const router = useRouter();

  const form = useForm<UpdateTaxBpjsInput>({
    resolver: zodResolver(
      updateTaxBpjsSchema
    ) as Resolver<UpdateTaxBpjsInput>,
    defaultValues: {
      npwp: employee.npwp ?? "",
      ptkpStatus: (employee.ptkpStatus as PTKPStatus) ?? undefined,
      bpjsKesehatanNo: employee.bpjsKesehatanNo ?? "",
      bpjsKetenagakerjaanNo: employee.bpjsKetenagakerjaanNo ?? "",
      isTaxBorneByCompany: employee.isTaxBorneByCompany ?? false,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: UpdateTaxBpjsInput) => {
    try {
      const result = await updateTaxBpjsAction(employee.id, data);
      if (result.success) {
        toast.success("Data pajak & BPJS berhasil diperbarui");
        router.refresh();
      } else {
        toast.error(result.error ?? "Gagal memperbarui data pajak & BPJS");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/50 py-4">
            <div className="flex items-start gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700 ring-1 ring-violet-100"
                aria-hidden="true"
              >
                <Receipt className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Pajak &amp; BPJS
                </CardTitle>
                <CardDescription className="mt-0.5 text-sm text-slate-500">
                  NPWP, status PTKP, dan nomor kepesertaan jaminan sosial.
                </CardDescription>
              </div>
            </div>
            {readOnly && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                <Eye className="h-3 w-3" aria-hidden="true" />
                Baca
              </span>
            )}
          </CardHeader>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-2 md:p-6">
            <FormField
              control={form.control}
              name="npwp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NPWP</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nomor NPWP"
                      disabled={readOnly}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ptkpStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status PTKP</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status PTKP" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ptkpStatusOptions.map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bpjsKesehatanNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No. BPJS Kesehatan</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nomor BPJS Kesehatan"
                      disabled={readOnly}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bpjsKetenagakerjaanNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No. BPJS Ketenagakerjaan</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nomor BPJS Ketenagakerjaan"
                      disabled={readOnly}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isTaxBorneByCompany"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <div className="flex items-start gap-3 rounded-lg border border-violet-100 bg-violet-50/40 p-3">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value ?? false}
                        onChange={field.onChange}
                        disabled={readOnly}
                        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 accent-violet-600"
                      />
                    </FormControl>
                    <div className="min-w-0 flex-1">
                      <FormLabel className="!mt-0 text-sm font-medium text-slate-800">
                        PPh 21 Ditanggung Perusahaan
                      </FormLabel>
                      <p className="mt-0.5 flex items-start gap-1.5 text-xs text-slate-600">
                        <Info
                          className="mt-0.5 h-3 w-3 shrink-0 text-violet-600"
                          aria-hidden="true"
                        />
                        <span>
                          Jika diaktifkan, PPh 21 tetap dihitung dan dilaporkan
                          ke SPT, namun tidak dipotong dari gaji karyawan —
                          perusahaan yang menanggung.
                        </span>
                      </p>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {!readOnly && (
          <div className="flex items-center justify-end gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="mr-auto text-xs text-slate-500">
              Perubahan data perpajakan mempengaruhi perhitungan slip gaji
              berikutnya.
            </p>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {isSubmitting ? "Menyimpan..." : "Simpan Pajak & BPJS"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
