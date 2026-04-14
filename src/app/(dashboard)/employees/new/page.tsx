import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";
import { auth } from "@/lib/auth";
import {
  getAllDepartments,
  getAllPositions,
} from "@/lib/services/master-data.service";
import { Button } from "@/components/ui/button";
import { CreateEmployeeForm } from "./_components/create-employee-form";

export default async function NewEmployeePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "HR_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    redirect("/employees");
  }

  const [departments, positions] = await Promise.all([
    getAllDepartments(),
    getAllPositions(),
  ]);

  return (
    <div
      className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
      aria-label="Halaman tambah karyawan"
    >
      {/* ─── Back link ───────────────────────────── */}
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <Link href="/employees" aria-label="Kembali ke daftar karyawan">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Kembali ke Daftar Karyawan
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
            <UserPlus className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Tambah Karyawan
          </h1>
        </div>
        <p className="text-sm text-slate-600">
          Lengkapi formulir berikut untuk mendaftarkan karyawan baru. Kolom
          bertanda <span className="font-medium text-rose-600">*</span> wajib
          diisi.
        </p>
      </header>

      <CreateEmployeeForm departments={departments} positions={positions} />
    </div>
  );
}
