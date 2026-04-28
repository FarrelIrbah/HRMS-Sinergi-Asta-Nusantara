import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Lock,
  Plus,
  Users,
} from "lucide-react";
import {
  getVacanciesWithPipeline,
  getRecruitmentStatsSummary,
} from "@/lib/services/recruitment.service";
import { Button } from "@/components/ui/button";
import { SummaryTile } from "@/components/shared/summary-tile";
import { VacancyTable } from "./_components/vacancy-table";
import { auth } from "@/lib/auth";

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

  const [vacancies, stats] = await Promise.all([
    getVacanciesWithPipeline(
      statusFilter as "OPEN" | "CLOSED" | undefined,
    ),
    getRecruitmentStatsSummary(),
  ]);

  return (
    <div
      className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
      aria-label="Halaman rekrutmen"
    >
      {/* ─── Header ───────────────────────────────── */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
              aria-hidden="true"
            >
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Rekrutmen
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Kelola lowongan pekerjaan dan pantau pipeline kandidat di setiap
            tahap.
          </p>
        </div>
        <Button
          asChild
          size="default"
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          <Link href="/recruitment/new" aria-label="Buat lowongan baru">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Buat Lowongan
          </Link>
        </Button>
      </header>

      {/* ─── KPI Summary ──────────────────────────── */}
      <section
        aria-label="Ringkasan statistik rekrutmen"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        <SummaryTile
          icon={BriefcaseBusiness}
          label="Lowongan Aktif"
          value={stats.openVacancies}
          tone="emerald"
        />
        <SummaryTile
          icon={Lock}
          label="Ditutup"
          value={stats.closedVacancies}
          tone="slate"
        />
        <SummaryTile
          icon={Users}
          label="Total Kandidat"
          value={stats.totalCandidates}
          tone="sky"
        />
        <SummaryTile
          icon={CalendarClock}
          label="Interview Terjadwal"
          value={stats.upcomingInterviews}
          tone="amber"
        />
        <SummaryTile
          icon={CheckCircle2}
          label="Hired Bulan Ini"
          value={stats.hiredThisMonth}
          tone="violet"
        />
      </section>

      {/* ─── Vacancy list ─────────────────────────── */}
      <VacancyTable vacancies={vacancies} />
    </div>
  );
}

