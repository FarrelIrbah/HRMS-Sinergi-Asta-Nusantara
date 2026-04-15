"use client";

import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, Loader2, UserRound } from "lucide-react";
import {
  GENDER_LABELS,
  RELIGION_LABELS,
  MARITAL_STATUS_LABELS,
} from "@/lib/constants";
import type { Gender, Religion, MaritalStatus } from "@/types/enums";
import {
  updatePersonalInfoSchema,
  type UpdatePersonalInfoInput,
} from "@/lib/validations/employee";
import { updatePersonalInfoAction } from "@/lib/actions/employee.actions";
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

interface PersonalInfoTabProps {
  employee: SerializedEmployee;
  readOnly: boolean;
}

const genderOptions = Object.entries(GENDER_LABELS) as [Gender, string][];
const religionOptions = Object.entries(RELIGION_LABELS) as [
  Religion,
  string,
][];
const maritalStatusOptions = Object.entries(MARITAL_STATUS_LABELS) as [
  MaritalStatus,
  string,
][];

function formatDateForInput(isoString: string | null): string {
  if (!isoString) return "";
  return isoString.split("T")[0];
}

export function PersonalInfoTab({ employee, readOnly }: PersonalInfoTabProps) {
  const router = useRouter();

  const form = useForm<UpdatePersonalInfoInput>({
    resolver: zodResolver(
      updatePersonalInfoSchema
    ) as unknown as Resolver<UpdatePersonalInfoInput>,
    defaultValues: {
      namaLengkap: employee.namaLengkap,
      nikKtp: employee.nikKtp ?? "",
      tempatLahir: employee.tempatLahir ?? "",
      tanggalLahir: (employee.tanggalLahir
        ? formatDateForInput(employee.tanggalLahir)
        : undefined) as UpdatePersonalInfoInput["tanggalLahir"],
      jenisKelamin: (employee.jenisKelamin as Gender) ?? undefined,
      statusPernikahan:
        (employee.statusPernikahan as MaritalStatus) ?? undefined,
      agama: (employee.agama as Religion) ?? undefined,
      alamat: employee.alamat ?? "",
      nomorHp: employee.nomorHp ?? "",
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: UpdatePersonalInfoInput) => {
    try {
      const result = await updatePersonalInfoAction(employee.id, data);
      if (result.success) {
        toast.success("Data pribadi berhasil diperbarui");
        router.refresh();
      } else {
        toast.error(result.error ?? "Gagal memperbarui data pribadi");
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
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                aria-hidden="true"
              >
                <UserRound className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Data Pribadi
                </CardTitle>
                <CardDescription className="mt-0.5 text-sm text-slate-500">
                  Identitas, kontak, dan status personal karyawan.
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
            {/* Email display (not editable) */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-slate-700">
                Email
              </label>
              <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {employee.email}
              </p>
            </div>

            <FormField
              control={form.control}
              name="namaLengkap"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nama lengkap sesuai KTP"
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
              name="nikKtp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIK KTP</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="16 digit NIK KTP"
                      maxLength={16}
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
              name="tempatLahir"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempat Lahir</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Kota kelahiran"
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
              name="tanggalLahir"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Lahir</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      disabled={readOnly}
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().split("T")[0]
                          : (field.value ?? "")
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

            <FormField
              control={form.control}
              name="jenisKelamin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Kelamin</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis kelamin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {genderOptions.map(([value, label]) => (
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
              name="statusPernikahan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Pernikahan</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {maritalStatusOptions.map(([value, label]) => (
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
              name="agama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agama</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih agama" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {religionOptions.map(([value, label]) => (
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
              name="nomorHp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor HP</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="08xxxxxxxxxx"
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
              name="alamat"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Alamat</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Alamat lengkap"
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
          <div className="flex items-center justify-end gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="mr-auto text-xs text-slate-500">
              Perubahan disimpan setelah Anda menekan tombol di samping.
            </p>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {isSubmitting ? "Menyimpan..." : "Simpan Data Pribadi"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
