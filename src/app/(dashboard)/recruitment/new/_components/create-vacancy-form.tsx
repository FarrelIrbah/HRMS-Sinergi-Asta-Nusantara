"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Briefcase,
  CalendarRange,
  CheckCircle2,
  FileText,
  Lightbulb,
  Loader2,
  Save,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { createVacancyAction } from "@/lib/actions/recruitment.actions";
import {
  createVacancySchema,
  type CreateVacancyInput,
} from "@/lib/validations/recruitment";

interface Department {
  id: string;
  name: string;
}

interface Props {
  departments: Department[];
}

const TIPS = [
  "Gunakan judul posisi yang spesifik (mis. 'Senior Frontend Engineer').",
  "Jelaskan tanggung jawab utama dalam 3–5 poin.",
  "Cantumkan kualifikasi minimum dan yang diutamakan terpisah.",
  "Tanggal tutup bersifat opsional — kosongkan untuk lowongan terbuka terus.",
];

export function CreateVacancyForm({ departments }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateVacancyInput>({
    resolver: zodResolver(createVacancySchema) as Resolver<CreateVacancyInput>,
    defaultValues: {
      title: "",
      departmentId: "",
      description: "",
      requirements: "",
    },
  });

  function onSubmit(values: CreateVacancyInput) {
    startTransition(async () => {
      try {
        const result = await createVacancyAction(values);
        if (!result.success) {
          toast.error(result.error ?? "Gagal membuat lowongan");
          return;
        }
        toast.success("Lowongan berhasil dibuat");
        router.push("/recruitment");
      } catch {
        toast.error("Terjadi kesalahan yang tidak terduga");
      }
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-6 lg:grid-cols-[1fr_300px]"
      >
        {/* ─── Main form column ─────────────────────────── */}
        <div className="space-y-6">
          {/* Section 1 — Informasi Lowongan */}
          <FormSection
            icon={Briefcase}
            title="Informasi Lowongan"
            description="Judul posisi dan departemen yang membuka lowongan."
          >
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Judul Posisi <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="contoh: Software Engineer"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Departemen <RequiredMark />
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
            </div>
          </FormSection>

          {/* Section 2 — Deskripsi & Persyaratan */}
          <FormSection
            icon={FileText}
            title="Deskripsi & Persyaratan"
            description="Detail tugas, tanggung jawab, dan kualifikasi kandidat."
          >
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Deskripsi Pekerjaan <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Jelaskan tanggung jawab dan lingkup pekerjaan..."
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Persyaratan <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tuliskan kualifikasi dan persyaratan kandidat..."
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>

          {/* Section 3 — Periode Lowongan */}
          <FormSection
            icon={CalendarRange}
            title="Periode Lowongan"
            description="Kapan lowongan dibuka dan ditutup untuk pelamar."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="openDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tanggal Buka <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={
                          field.value
                            ? new Date(field.value)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? new Date(e.target.value)
                              : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="closeDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tanggal Tutup{" "}
                      <span className="font-normal text-slate-400">
                        (opsional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={
                          field.value
                            ? new Date(field.value)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? new Date(e.target.value)
                              : undefined,
                          )
                        }
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
              Lowongan akan langsung berstatus <strong>Dibuka</strong> setelah
              disimpan.
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                asChild
              >
                <Link href="/recruitment" aria-label="Batal dan kembali">
                  Batal
                </Link>
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
                {isPending ? "Menyimpan..." : "Buat Lowongan"}
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Tips sidebar (lg+) ───────────────────────── */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Card className="border-emerald-200 bg-emerald-50/50 shadow-sm">
            <CardHeader className="flex flex-row items-start gap-2 space-y-0 pb-3">
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white"
                aria-hidden="true"
              >
                <Lightbulb className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm font-semibold text-slate-900">
                  Tips Menulis Lowongan
                </CardTitle>
                <CardDescription className="mt-0.5 text-xs">
                  Lowongan yang jelas menarik kandidat berkualitas.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2" aria-label="Daftar tips">
                {TIPS.map((tip, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs leading-relaxed text-slate-700"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </form>
    </Form>
  );
}

// ─── Sub-components ────────────────────────────────────

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 border-b border-slate-100 pb-4">
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base font-semibold text-slate-900">
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
