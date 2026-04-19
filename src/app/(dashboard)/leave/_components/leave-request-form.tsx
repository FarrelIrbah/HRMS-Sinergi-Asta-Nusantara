"use client";

import { useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CalendarIcon, Send } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { submitLeaveAction } from "@/lib/actions/leave.actions";
import {
  submitLeaveSchema,
  type SubmitLeaveInput,
} from "@/lib/validations/leave";

interface LeaveType {
  id: string;
  name: string;
  annualQuota: number;
}

interface Balance {
  leaveTypeId: string;
  allocatedDays: number;
  usedDays: number;
  leaveType: { id: string; name: string };
}

interface LeaveRequestFormProps {
  leaveTypes: LeaveType[];
  balances: Balance[];
}

export function LeaveRequestForm({
  leaveTypes,
  balances,
}: LeaveRequestFormProps) {
  const [isPending, startTransition] = useTransition();
  const balanceMap = new Map(balances.map((b) => [b.leaveTypeId, b]));

  const form = useForm<SubmitLeaveInput>({
    resolver: zodResolver(submitLeaveSchema) as Resolver<SubmitLeaveInput>,
    defaultValues: {
      leaveTypeId: "",
      reason: "",
    },
  });

  const selectedLeaveTypeId = form.watch("leaveTypeId");
  const selectedBalance = selectedLeaveTypeId
    ? balanceMap.get(selectedLeaveTypeId)
    : null;
  const remaining = selectedBalance
    ? Math.max(
        0,
        selectedBalance.allocatedDays - selectedBalance.usedDays
      )
    : null;

  function onSubmit(values: SubmitLeaveInput) {
    startTransition(async () => {
      const result = await submitLeaveAction(values);
      if (result.success) {
        toast.success("Pengajuan cuti berhasil dikirim");
        form.reset();
      } else {
        toast.error(result.error ?? "Gagal mengajukan cuti");
      }
    });
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600"
            aria-hidden="true"
          >
            <Send className="h-3.5 w-3.5" />
          </div>
          Ajukan Cuti
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="leaveTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-slate-700">
                    Jenis Cuti
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="border-slate-200">
                        <SelectValue placeholder="Pilih jenis cuti" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {leaveTypes.map((lt) => (
                        <SelectItem key={lt.id} value={lt.id}>
                          {lt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {remaining !== null && (
                    <p className="mt-1 text-xs text-slate-500">
                      Saldo tersedia:{" "}
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          remaining > 0
                            ? "border-emerald-300 text-emerald-700"
                            : "border-red-300 text-red-700"
                        }`}
                      >
                        {remaining} hari
                      </Badge>
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-slate-700">
                      Tanggal Mulai
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full justify-start border-slate-200 text-left text-sm font-normal"
                          >
                            <CalendarIcon
                              className="mr-2 h-4 w-4 text-slate-400"
                              aria-hidden="true"
                            />
                            {field.value
                              ? format(field.value, "dd MMM yyyy", {
                                  locale: localeId,
                                })
                              : "Pilih tanggal"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date <
                            new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-slate-700">
                      Tanggal Akhir
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full justify-start border-slate-200 text-left text-sm font-normal"
                          >
                            <CalendarIcon
                              className="mr-2 h-4 w-4 text-slate-400"
                              aria-hidden="true"
                            />
                            {field.value
                              ? format(field.value, "dd MMM yyyy", {
                                  locale: localeId,
                                })
                              : "Pilih tanggal"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date <
                            new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-slate-700">
                    Alasan
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Jelaskan alasan pengajuan cuti..."
                      className="resize-none border-slate-200"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isPending}
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {isPending ? "Mengirim..." : "Kirim Pengajuan"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
