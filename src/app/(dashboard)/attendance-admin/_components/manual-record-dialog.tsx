"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  CalendarIcon,
  ClipboardEdit,
  Loader2,
  Plus,
  Save,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { manualOverrideAction } from "@/lib/actions/attendance.actions";
import {
  manualAttendanceSchema,
  type ManualAttendanceInput,
} from "@/lib/validations/attendance";
import type { Resolver } from "react-hook-form";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  namaLengkap: string;
  nik: string;
}

interface ManualRecordDialogProps {
  employees: Employee[];
  defaultEmployeeId?: string;
  /**
   * When true, render a compact outline trigger suitable for inline use
   * inside a table row. Default = primary emerald button for page headers.
   */
  compact?: boolean;
}

export function ManualRecordDialog({
  employees,
  defaultEmployeeId,
  compact = false,
}: ManualRecordDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ManualAttendanceInput>({
    resolver: zodResolver(
      manualAttendanceSchema
    ) as Resolver<ManualAttendanceInput>,
    defaultValues: {
      employeeId: defaultEmployeeId ?? "",
      clockIn: "",
      clockOut: "",
      overrideReason: "",
    },
  });

  function onSubmit(values: ManualAttendanceInput) {
    startTransition(async () => {
      const result = await manualOverrideAction(values);
      if (result.success) {
        toast.success("Data absensi berhasil diperbarui");
        setOpen(false);
        form.reset({
          employeeId: defaultEmployeeId ?? "",
          clockIn: "",
          clockOut: "",
          overrideReason: "",
        });
      } else {
        toast.error(result.error ?? "Gagal memperbarui absensi");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {compact ? (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Input Manual
          </Button>
        ) : (
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Input Manual
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
              aria-hidden="true"
            >
              <ClipboardEdit className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-slate-900">
                Input / Koreksi Data Absensi
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Catat atau perbaiki absensi karyawan secara manual. Setiap
                perubahan akan tercatat dalam audit log.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            aria-label="Form input manual absensi"
          >
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-slate-700">
                    Karyawan
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!!defaultEmployeeId}
                  >
                    <FormControl>
                      <SelectTrigger className="border-slate-200 bg-white">
                        <div className="flex items-center gap-2">
                          <User
                            className="h-4 w-4 flex-shrink-0 text-slate-400"
                            aria-hidden="true"
                          />
                          <SelectValue placeholder="Pilih karyawan" />
                        </div>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.namaLengkap}{" "}
                          <span className="text-slate-400">({emp.nik})</span>
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
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm text-slate-700">
                    Tanggal
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start gap-2 border-slate-200 bg-white font-normal",
                            !field.value && "text-slate-400"
                          )}
                        >
                          <CalendarIcon
                            className="h-4 w-4 text-slate-400"
                            aria-hidden="true"
                          />
                          {field.value
                            ? format(field.value, "dd MMMM yyyy", {
                                locale: localeId,
                              })
                            : "Pilih tanggal"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="clockIn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-slate-700">
                      Jam Masuk{" "}
                      <span className="font-normal text-slate-400">(WIB)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        className="border-slate-200 bg-white tabular-nums"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clockOut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-slate-700">
                      Jam Pulang{" "}
                      <span className="font-normal text-slate-400">(WIB)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        className="border-slate-200 bg-white tabular-nums"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="overrideReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-slate-700">
                    Alasan Koreksi
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contoh: Karyawan lupa clock-in, izin sakit menyusul, dsb."
                      rows={2}
                      className="border-slate-200 bg-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                type="button"
                className="border-slate-200"
                onClick={() => setOpen(false)}
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
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
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
