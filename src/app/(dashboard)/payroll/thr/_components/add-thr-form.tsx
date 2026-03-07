"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { addTHRToPayrollAction } from "@/lib/actions/payroll.actions";

// ─── Schema ───────────────────────────────────────────────────────────────────

const formSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2024).max(2099),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_LABELS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const YEAR_OPTIONS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

// ─── Component ────────────────────────────────────────────────────────────────

export function AddTHRForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const result = await addTHRToPayrollAction({
        month: values.month,
        year: values.year,
      });

      if (!result.success) {
        toast.error(result.error ?? "Terjadi kesalahan");
        return;
      }

      toast.success("THR berhasil ditambahkan ke penggajian bulan tersebut");
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan yang tidak terduga");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-wrap items-end gap-4"
      >
        {/* Bulan */}
        <FormField
          control={form.control}
          name="month"
          render={({ field }) => (
            <FormItem className="min-w-[160px]">
              <FormLabel>Bulan Penggajian</FormLabel>
              <Select
                onValueChange={(val) => field.onChange(parseInt(val, 10))}
                value={String(field.value)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih bulan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MONTH_LABELS.map((label, idx) => (
                    <SelectItem key={idx + 1} value={String(idx + 1)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tahun */}
        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem className="min-w-[120px]">
              <FormLabel>Tahun</FormLabel>
              <Select
                onValueChange={(val) => field.onChange(parseInt(val, 10))}
                value={String(field.value)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tahun" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {YEAR_OPTIONS.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Memproses..." : "Tambahkan ke Penggajian"}
        </Button>
      </form>
    </Form>
  );
}
