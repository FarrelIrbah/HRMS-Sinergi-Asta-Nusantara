import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { CreateVacancyForm } from "./_components/create-vacancy-form";

export default async function NewVacancyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  if (role !== "HR_ADMIN" && role !== "SUPER_ADMIN") redirect("/dashboard");

  const departments = await prisma.department.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });

  return (
    <div
      className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
      aria-label="Halaman buat lowongan baru"
    >
      {/* ─── Back link ───────────────────────────── */}
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <Link href="/recruitment" aria-label="Kembali ke daftar lowongan">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Kembali ke Daftar Lowongan
          </Link>
        </Button>
      </div>

      {/* ─── Header ──────────────────────────────── */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
            aria-hidden="true"
          >
            <BriefcaseBusiness className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Buat Lowongan Baru
          </h1>
        </div>
        <p className="text-sm text-slate-600">
          Isi detail lowongan pekerjaan agar kandidat memahami posisi dan
          kualifikasi yang dibutuhkan.
        </p>
      </header>

      <CreateVacancyForm departments={departments} />
    </div>
  );
}
