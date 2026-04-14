import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Lock,
  Plus,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  getVacanciesWithPipeline,
  getRecruitmentStatsSummary,
} from "@/lib/services/recruitment.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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

// ─────────────────── Sub-components ───────────────────

type Tone = "emerald" | "sky" | "violet" | "amber" | "slate";

const TONE_MAP: Record<Tone, { bg: string; text: string; ring: string }> = {
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-100",
  },
  sky: { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-100" },
  violet: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    ring: "ring-violet-100",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-100",
  },
  slate: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    ring: "ring-slate-200",
  },
};

function SummaryTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: Tone;
}) {
  const t = TONE_MAP[tone];
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ring-1",
            t.bg,
            t.text,
            t.ring,
          )}
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold tabular-nums leading-tight text-slate-900">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
