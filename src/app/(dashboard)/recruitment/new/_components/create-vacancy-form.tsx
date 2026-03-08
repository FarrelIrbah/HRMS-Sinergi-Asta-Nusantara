"use client";

import { useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createVacancyAction } from "@/lib/actions/recruitment.actions";
import {
  createVacancySchema,
  type CreateVacancyInput,
} from "@/lib/validations/recruitment";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Department {
  id: string;
  name: string;
}

interface Props {
  departments: Department[];
}

// ─── Component ─────────────────────────────────────────────────────────────────

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Judul Posisi */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Judul Posisi</FormLabel>
              <FormControl>
                <Input placeholder="contoh: Software Engineer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Departemen */}
        <FormField
          control={form.control}
          name="departmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Departemen</FormLabel>
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

        {/* Deskripsi */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi Pekerjaan</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Jelaskan tanggung jawab dan lingkup pekerjaan..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Persyaratan */}
        <FormField
          control={form.control}
          name="requirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Persyaratan</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tuliskan kualifikasi dan persyaratan kandidat..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tanggal Buka & Tutup */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="openDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Buka</FormLabel>
                <FormControl>
                  <input
                    type="date"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={
                      field.value
                        ? new Date(field.value).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? new Date(e.target.value) : undefined,
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
                  <span className="text-muted-foreground font-normal">
                    (opsional)
                  </span>
                </FormLabel>
                <FormControl>
                  <input
                    type="date"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={
                      field.value
                        ? new Date(field.value).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? new Date(e.target.value) : undefined,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Menyimpan..." : "Buat Lowongan"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => router.push("/recruitment")}
          >
            Batal
          </Button>
        </div>
      </form>
    </Form>
  );
}
