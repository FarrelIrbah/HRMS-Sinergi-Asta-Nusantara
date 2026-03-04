"use client";

import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Pribadi</CardTitle>
            <CardDescription>
              Informasi pribadi karyawan.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {/* Email display (not editable) */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Email</label>
              <p className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
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
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? "Menyimpan..." : "Simpan Data Pribadi"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
