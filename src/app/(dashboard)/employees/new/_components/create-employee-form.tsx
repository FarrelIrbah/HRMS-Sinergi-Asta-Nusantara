"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  AtSign,
  Briefcase,
  Eye,
  EyeOff,
  Loader2,
  Receipt,
  Save,
  User,
  type LucideIcon,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

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

const SECTIONS = [
  {
    id: "informasi-akun",
    step: 1,
    title: "Informasi Akun",
    hint: "Email & password login",
    icon: AtSign,
  },
  {
    id: "informasi-pribadi",
    step: 2,
    title: "Informasi Pribadi",
    hint: "Data diri karyawan",
    icon: User,
  },
  {
    id: "detail-pekerjaan",
    step: 3,
    title: "Detail Pekerjaan",
    hint: "Departemen, jabatan, kontrak",
    icon: Briefcase,
  },
  {
    id: "pajak-bpjs",
    step: 4,
    title: "Pajak & BPJS",
    hint: "NPWP, PTKP, nomor BPJS",
    icon: Receipt,
  },
] as const;

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
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-6 lg:grid-cols-[260px_1fr]"
      >
        {/* ─── Section Navigator (sticky on lg+) ────────── */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <nav aria-label="Navigasi bagian formulir">
            <ol className="space-y-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="group flex items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <span
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700"
                      aria-hidden="true"
                    >
                      {s.step}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 group-hover:text-emerald-700">
                        {s.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {s.hint}
                      </p>
                    </div>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        {/* ─── Form column ──────────────────────────────── */}
        <div className="space-y-6">
          {/* Section 1 — Informasi Akun */}
          <FormSection
            id="informasi-akun"
            step={1}
            icon={AtSign}
            title="Informasi Akun"
            description="Email dan password awal untuk login karyawan."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Email <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@perusahaan.com"
                        autoComplete="email"
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
                    <FormLabel>
                      Password Awal <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimal 8 karakter"
                          autoComplete="new-password"
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={
                            showPassword
                              ? "Sembunyikan password"
                              : "Tampilkan password"
                          }
                          className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <p className="text-xs text-slate-500">
                      Karyawan dapat mengubah password setelah login pertama.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>

          {/* Section 2 — Informasi Pribadi */}
          <FormSection
            id="informasi-pribadi"
            step={2}
            icon={User}
            title="Informasi Pribadi"
            description="Data pribadi karyawan. Hanya nama lengkap yang wajib diisi."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="namaLengkap"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>
                      Nama Lengkap <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nama lengkap sesuai KTP"
                        autoComplete="name"
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
                        inputMode="numeric"
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
                      <Input
                        placeholder="08xxxxxxxxxx"
                        inputMode="tel"
                        autoComplete="tel"
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
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>

          {/* Section 3 — Detail Pekerjaan */}
          <FormSection
            id="detail-pekerjaan"
            step={3}
            icon={Briefcase}
            title="Detail Pekerjaan"
            description="Informasi departemen, jabatan, dan kontrak kerja."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Departemen <RequiredMark />
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
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
                    <FormLabel>
                      Jabatan <RequiredMark />
                    </FormLabel>
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
                    <FormLabel>
                      Tipe Kontrak <RequiredMark />
                    </FormLabel>
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
                    <FormLabel>
                      Tanggal Masuk <RequiredMark />
                    </FormLabel>
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
            </div>
          </FormSection>

          {/* Section 4 — Pajak & BPJS */}
          <FormSection
            id="pajak-bpjs"
            step={4}
            icon={Receipt}
            title="Pajak & BPJS"
            description="Informasi perpajakan dan jaminan sosial (opsional, dapat dilengkapi nanti)."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="npwp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NPWP</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nomor NPWP"
                        inputMode="numeric"
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
            </div>
          </FormSection>

          {/* ─── Sticky action bar ─────────────────────── */}
          <div
            className={cn(
              "sticky bottom-4 z-10 flex flex-col-reverse items-stretch gap-2",
              "rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur",
              "sm:flex-row sm:items-center sm:justify-between",
            )}
          >
            <p className="text-xs text-slate-500">
              Pastikan semua kolom wajib terisi sebelum menyimpan.
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                asChild
              >
                <Link href="/employees" aria-label="Batal dan kembali">
                  Batal
                </Link>
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Save className="h-4 w-4" aria-hidden="true" />
                )}
                {isSubmitting ? "Menyimpan..." : "Simpan Karyawan"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}

// ─── Sub-components ────────────────────────────────────

function FormSection({
  id,
  step,
  icon: Icon,
  title,
  description,
  children,
}: {
  id: string;
  step: number;
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-24 border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 border-b border-slate-100 pb-4">
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <span className="text-xs font-medium text-slate-400 tabular-nums">
              Langkah {step}
            </span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            {title}
          </CardTitle>
          <CardDescription className="mt-1 text-xs">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  );
}

function RequiredMark() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-rose-600">
      *
    </span>
  );
}
