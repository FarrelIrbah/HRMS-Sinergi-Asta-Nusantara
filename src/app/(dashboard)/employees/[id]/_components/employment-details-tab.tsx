"use client";

import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Briefcase, Eye, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTRACT_TYPE_LABELS } from "@/lib/constants";
import type { ContractType } from "@/types/enums";
import {
  updateEmploymentSchema,
  type UpdateEmploymentInput,
} from "@/lib/validations/employee";
import { updateEmploymentAction } from "@/lib/actions/employee.actions";
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
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SerializedEmployee } from "./employee-profile-tabs";

interface Department {
  id: string;
  name: string;
}

interface Position {
  id: string;
  name: string;
  departmentId: string;
}

interface EmploymentDetailsTabProps {
  employee: SerializedEmployee;
  readOnly: boolean;
  departments: Department[];
  positions: Position[];
}

const contractTypeOptions = Object.entries(CONTRACT_TYPE_LABELS) as [
  ContractType,
  string,
][];

function formatDateForInput(isoString: string | null): string {
  if (!isoString) return "";
  return isoString.split("T")[0];
}

export function EmploymentDetailsTab({
  employee,
  readOnly,
  departments,
  positions,
}: EmploymentDetailsTabProps) {
  const router = useRouter();

  const form = useForm<UpdateEmploymentInput>({
    resolver: zodResolver(
      updateEmploymentSchema
    ) as Resolver<UpdateEmploymentInput>,
    defaultValues: {
      departmentId: employee.departmentId,
      positionId: employee.positionId,
      contractType: employee.contractType as ContractType,
      joinDate: formatDateForInput(employee.joinDate) as unknown as Date,
      officeLocationId: employee.officeLocationId ?? "",
    },
  });

  const { isSubmitting } = form.formState;

  // Filter positions by selected department
  const selectedDepartmentId = form.watch("departmentId");
  const filteredPositions = selectedDepartmentId
    ? positions.filter((p) => p.departmentId === selectedDepartmentId)
    : positions;

  const onSubmit = async (data: UpdateEmploymentInput) => {
    try {
      const result = await updateEmploymentAction(employee.id, data);
      if (result.success) {
        toast.success("Detail pekerjaan berhasil diperbarui");
        router.refresh();
      } else {
        toast.error(result.error ?? "Gagal memperbarui detail pekerjaan");
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
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 ring-1 ring-sky-100"
                aria-hidden="true"
              >
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Detail Pekerjaan
                </CardTitle>
                <CardDescription className="mt-0.5 text-sm text-slate-500">
                  Departemen, jabatan, dan kontrak kerja karyawan.
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
            {/* Display-only: NIK */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-slate-700">
                NIK Karyawan
              </label>
              <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm tabular-nums text-slate-700">
                {employee.nik}
              </p>
            </div>

            {/* Display-only: Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-slate-700">
                Status
              </label>
              <div className="flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1.5",
                    employee.isActive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                      : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-100",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      employee.isActive ? "bg-emerald-500" : "bg-slate-400",
                    )}
                  />
                  {employee.isActive ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>
            </div>

            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departemen *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("positionId", "");
                    }}
                    value={field.value}
                    disabled={readOnly}
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

            <FormField
              control={form.control}
              name="positionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jabatan *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={readOnly || !selectedDepartmentId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            selectedDepartmentId
                              ? "Pilih jabatan"
                              : "Pilih departemen terlebih dahulu"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredPositions.map((pos) => (
                        <SelectItem key={pos.id} value={pos.id}>
                          {pos.name}
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
              name="contractType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe Kontrak *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe kontrak" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contractTypeOptions.map(([value, label]) => (
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
              name="joinDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Masuk *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      disabled={readOnly}
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().split("T")[0]
                          : (field.value as unknown as string) ?? ""
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === "" ? undefined : val);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {!readOnly && (
          <div className="flex items-center justify-end gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="mr-auto text-xs text-slate-500">
              Memindah departemen akan mereset pilihan jabatan.
            </p>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {isSubmitting ? "Menyimpan..." : "Simpan Detail Pekerjaan"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
