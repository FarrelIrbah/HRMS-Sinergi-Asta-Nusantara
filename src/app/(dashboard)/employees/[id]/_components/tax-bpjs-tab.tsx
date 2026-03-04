"use client";

import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pajak & BPJS</CardTitle>
            <CardDescription>
              Informasi perpajakan dan jaminan sosial.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
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
          </CardContent>
        </Card>

        {!readOnly && (
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? "Menyimpan..." : "Simpan Pajak & BPJS"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
