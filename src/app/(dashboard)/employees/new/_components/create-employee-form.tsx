"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  Gender,
  Religion,
  MaritalStatus,
  ContractType,
  PTKPStatus,
} from "@/types/enums";
import {
  GENDER_LABELS,
  RELIGION_LABELS,
  MARITAL_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  PTKP_STATUS_LABELS,
} from "@/lib/constants";
import {
  createEmployeeSchema,
  type CreateEmployeeInput,
} from "@/lib/validations/employee";
import { createEmployeeAction } from "@/lib/actions/employee.actions";
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

interface Department {
  id: string;
  name: string;
}

interface Position {
  id: string;
  name: string;
  departmentId: string;
}

interface CreateEmployeeFormProps {
  departments: Department[];
  positions: Position[];
}

const genderOptions = Object.entries(GENDER_LABELS) as [Gender, string][];
const religionOptions = Object.entries(RELIGION_LABELS) as [Religion, string][];
const maritalStatusOptions = Object.entries(MARITAL_STATUS_LABELS) as [
  MaritalStatus,
  string,
][];
const contractTypeOptions = Object.entries(CONTRACT_TYPE_LABELS) as [
  ContractType,
  string,
][];
const ptkpStatusOptions = Object.entries(PTKP_STATUS_LABELS) as [
  PTKPStatus,
  string,
][];

export function CreateEmployeeForm({
  departments,
  positions,
}: CreateEmployeeFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<CreateEmployeeInput>({
    resolver: zodResolver(createEmployeeSchema) as Resolver<CreateEmployeeInput>,
    defaultValues: {
      namaLengkap: "",
      email: "",
      initialPassword: "",
      departmentId: "",
      positionId: "",
      contractType: undefined,
      joinDate: undefined,
      nikKtp: "",
      tempatLahir: "",
      tanggalLahir: undefined,
      jenisKelamin: undefined,
      statusPernikahan: undefined,
      agama: undefined,
      alamat: "",
      nomorHp: "",
      npwp: "",
      ptkpStatus: undefined,
      bpjsKesehatanNo: "",
      bpjsKetenagakerjaanNo: "",
    },
  });

  const { isSubmitting } = form.formState;

  // Filter positions based on selected department
  const selectedDepartmentId = form.watch("departmentId");
  const filteredPositions = selectedDepartmentId
    ? positions.filter((p) => p.departmentId === selectedDepartmentId)
    : positions;

  const onSubmit = async (data: CreateEmployeeInput) => {
    try {
      const result = await createEmployeeAction(data);
      if (result.success) {
        toast.success("Karyawan berhasil ditambahkan");
        router.push(`/employees/${result.data!.id}`);
      } else {
        toast.error(result.error ?? "Gagal menambahkan karyawan");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section: Informasi Akun */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Akun</CardTitle>
            <CardDescription>
              Email dan password awal untuk login karyawan.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@perusahaan.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="initialPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password Awal *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimal 8 karakter"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section: Informasi Pribadi */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pribadi</CardTitle>
            <CardDescription>
              Data pribadi karyawan. Hanya nama lengkap yang wajib diisi.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="namaLengkap"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Nama Lengkap *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama lengkap sesuai KTP" {...field} />
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
                    <Input placeholder="Kota kelahiran" {...field} />
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
                      {...field}
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().split("T")[0]
                          : field.value ?? ""
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
                    <Input placeholder="08xxxxxxxxxx" {...field} />
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
                    <Textarea placeholder="Alamat lengkap" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section: Detail Pekerjaan */}
        <Card>
          <CardHeader>
            <CardTitle>Detail Pekerjaan</CardTitle>
            <CardDescription>
              Informasi departemen, jabatan, dan kontrak kerja.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departemen *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Reset position when department changes
                      form.setValue("positionId", "");
                    }}
                    value={field.value}
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
                    disabled={!selectedDepartmentId}
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
                      {...field}
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().split("T")[0]
                          : field.value ?? ""
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

        {/* Section: Pajak & BPJS */}
        <Card>
          <CardHeader>
            <CardTitle>Pajak & BPJS</CardTitle>
            <CardDescription>
              Informasi perpajakan dan jaminan sosial (opsional).
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
                    <Input placeholder="Nomor NPWP" {...field} />
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
                    <Input placeholder="Nomor BPJS Kesehatan" {...field} />
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
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/employees">Batal</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Menyimpan..." : "Simpan Karyawan"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
