import { redirect } from "next/navigation";
import { UserCog } from "lucide-react";
import { auth } from "@/lib/auth";
import { getUsers } from "@/lib/services/user.service";
import { UserTable } from "./_components/user-table";
import { UserPageHeader } from "./_components/user-page-header";

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const { data: users, total } = await getUsers();

  return (
    <div
      className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
      aria-label="Halaman manajemen pengguna"
    >
      <header>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
              aria-hidden="true"
            >
              <UserCog className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Manajemen Pengguna
              </h1>
              <p className="mt-0.5 text-sm text-slate-600">
                Kelola akun pengguna sistem HRMS dan peran akses
              </p>
            </div>
          </div>
          <UserPageHeader />
        </div>
      </header>

      <UserTable data={users} total={total} />
    </div>
  );
}
