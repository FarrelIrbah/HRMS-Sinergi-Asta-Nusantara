import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
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
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Buat Lowongan Baru</h1>
        <p className="text-muted-foreground text-sm">
          Isi detail lowongan pekerjaan
        </p>
      </div>
      <CreateVacancyForm departments={departments} />
    </div>
  );
}
