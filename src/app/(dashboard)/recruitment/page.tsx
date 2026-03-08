import { getVacancies } from "@/lib/services/recruitment.service";
import { VacancyTable } from "./_components/vacancy-table";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function RecruitmentPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  if (role !== "HR_ADMIN" && role !== "SUPER_ADMIN") redirect("/dashboard");

  const params = await searchParams;
  const statusFilter =
    params.status === "CLOSED"
      ? "CLOSED"
      : params.status === "OPEN"
        ? "OPEN"
        : undefined;

  const vacancies = await getVacancies(statusFilter as "OPEN" | "CLOSED" | undefined);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rekrutmen</h1>
          <p className="text-muted-foreground text-sm">
            Kelola lowongan pekerjaan dan kandidat
          </p>
        </div>
        <a
          href="/recruitment/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Buat Lowongan
        </a>
      </div>
      <VacancyTable vacancies={vacancies} />
    </div>
  );
}
