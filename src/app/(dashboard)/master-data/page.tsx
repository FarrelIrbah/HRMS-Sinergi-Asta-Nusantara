import { redirect } from "next/navigation";
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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Master</h1>
        <p className="text-muted-foreground">
          Kelola data master seperti departemen, jabatan, lokasi kantor, dan
          jenis cuti.
        </p>
      </div>
      <MasterDataTabs />
    </div>
  );
}
