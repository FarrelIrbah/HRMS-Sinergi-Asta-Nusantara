"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Mail, Phone, Plus, Save, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { createCandidateAction } from "@/lib/actions/recruitment.actions";
import {
  createCandidateSchema,
  type CreateCandidateInput,
} from "@/lib/validations/recruitment";

interface AddCandidateDialogProps {
  vacancyId: string;
}

export function AddCandidateDialog({ vacancyId }: AddCandidateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateCandidateInput>({
    resolver: zodResolver(
      createCandidateSchema
    ) as Resolver<CreateCandidateInput>,
    defaultValues: { name: "", email: "", phone: "", notes: "" },
  });

  const onSubmit = (data: CreateCandidateInput) => {
    startTransition(async () => {
      const result = await createCandidateAction(vacancyId, data);
      if (result.success) {
        toast.success("Kandidat berhasil ditambahkan");
        form.reset();
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Gagal menambahkan kandidat");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Tambah Kandidat
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
              aria-hidden="true"
            >
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-slate-900">
                Tambah Kandidat
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Tambahkan kandidat baru ke pipeline rekrutmen lowongan ini.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            aria-label="Form tambah kandidat"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-slate-700">
                    Nama Lengkap
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nama kandidat"
                      className="border-slate-200 bg-white"
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-slate-700">
                    Email
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                      />
                      <Input
                        type="email"
                        placeholder="email@contoh.com"
                        className="border-slate-200 bg-white pl-9"
                        autoComplete="email"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-slate-700">
                    Nomor Telepon{" "}
                    <span className="font-normal text-slate-400">
                      (opsional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                      />
                      <Input
                        placeholder="08xxxxxxxxxx"
                        className="border-slate-200 bg-white pl-9"
                        autoComplete="tel"
                        inputMode="tel"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-slate-700">
                    Catatan{" "}
                    <span className="font-normal text-slate-400">
                      (opsional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Catatan tambahan tentang kandidat..."
                      rows={3}
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
                type="button"
                variant="outline"
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
                {isPending ? "Menyimpan..." : "Tambah Kandidat"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
