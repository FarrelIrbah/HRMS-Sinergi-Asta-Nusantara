"use client";

import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Detail Pekerjaan</CardTitle>
            <CardDescription>
              Informasi departemen, jabatan, dan kontrak kerja.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {/* Display-only: NIK */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                NIK Karyawan
              </label>
              <p className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                {employee.nik}
              </p>
            </div>

            {/* Display-only: Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Status</label>
              <div className="flex items-center rounded-md border bg-muted/50 px-3 py-2">
                <Badge
                  variant={employee.isActive ? "default" : "destructive"}
                >
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
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? "Menyimpan..." : "Simpan Detail Pekerjaan"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
