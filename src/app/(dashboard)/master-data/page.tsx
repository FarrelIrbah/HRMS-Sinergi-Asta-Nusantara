import { redirect } from "next/navigation";
import { Database } from "lucide-react";
import { auth } from "@/lib/auth";
import { MasterDataTabs } from "./_components/master-data-tabs";

export default async function MasterDataPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div
      className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
      aria-label="Halaman data master"
    >
      <header>
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
            aria-hidden="true"
          >
            <Database className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Data Master
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Kelola data master seperti departemen, jabatan, lokasi kantor, dan
          jenis cuti
        </p>
      </header>

      <MasterDataTabs />
    </div>
  );
}
