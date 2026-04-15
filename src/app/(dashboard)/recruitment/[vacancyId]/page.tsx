import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarClock,
  CalendarDays,
  CircleCheck,
  CircleX,
  KanbanSquare,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getVacancyById } from "@/lib/services/recruitment.service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { AddCandidateDialog } from "./_components/add-candidate-dialog";
import { KanbanBoard } from "./_components/kanban-board";

interface Props {
  params: Promise<{ vacancyId: string }>;
}

const STAGE_LABELS: Record<string, string> = {
  MELAMAR: "Melamar",
  SELEKSI_BERKAS: "Seleksi Berkas",
  INTERVIEW: "Interview",
  PENAWARAN: "Penawaran",
  DITERIMA: "Diterima",
  DITOLAK: "Ditolak",
};

const STAGE_TONES: Record<
  string,
  { bg: string; text: string; ring: string; dot: string }
> = {
  MELAMAR: {
    bg: "bg-slate-50",
    text: "text-slate-700",
    ring: "ring-slate-200",
    dot: "bg-slate-400",
  },
  SELEKSI_BERKAS: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    ring: "ring-sky-100",
    dot: "bg-sky-500",
  },
  INTERVIEW: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-100",
    dot: "bg-amber-500",
  },
  PENAWARAN: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    ring: "ring-violet-100",
    dot: "bg-violet-500",
  },
  DITERIMA: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-100",
    dot: "bg-emerald-500",
  },
  DITOLAK: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-100",
    dot: "bg-rose-500",
  },
};

const STAGE_ORDER = Object.keys(STAGE_LABELS);
const ACTIVE_STAGES = ["MELAMAR", "SELEKSI_BERKAS", "INTERVIEW", "PENAWARAN"];

export default async function VacancyDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  if (role !== "HR_ADMIN" && role !== "SUPER_ADMIN") redirect("/dashboard");

  const { vacancyId } = await params;
  const vacancy = await getVacancyById(vacancyId);
  if (!vacancy) notFound();

  const isOpen = vacancy.status === "OPEN";
  const totalCandidates = vacancy.candidates.length;

  const stageCounts = STAGE_ORDER.reduce<Record<string, number>>(
    (acc, stage) => {
      acc[stage] = vacancy.candidates.filter((c) => c.stage === stage).length;
      return acc;
    },
    {},
  );

  return (
    <div
      className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
      aria-label={`Halaman lowongan ${vacancy.title}`}
    >
      {/* ─── Breadcrumb ───────────────────────────── */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-sm text-slate-500"
      >
        <Link
          href="/recruitment"
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-slate-200/60 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Rekrutmen
        </Link>
        <span aria-hidden="true" className="text-slate-300">
          /
        </span>
        <span className="truncate font-medium text-slate-700">
          {vacancy.title}
        </span>
      </nav>

      {/* ─── Vacancy Hero Card ────────────────────── */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
                aria-hidden="true"
              >
                <Briefcase className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                    {vacancy.title}
                  </h1>
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1.5",
                      isOpen
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                        : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    {isOpen ? (
                      <CircleCheck
                        className="h-3 w-3"
                        aria-hidden="true"
                      />
                    ) : (
                      <CircleX className="h-3 w-3" aria-hidden="true" />
                    )}
                    {isOpen ? "Terbuka" : "Ditutup"}
                  </Badge>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                  <Building2
                    className="h-3.5 w-3.5 text-slate-400"
                    aria-hidden="true"
                  />
                  {vacancy.department.name}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
              <AddCandidateDialog vacancyId={vacancyId} />
            </div>
          </div>

          <Separator className="my-5" />

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <MetaItem
              icon={CalendarDays}
              label="Dibuka"
              value={format(vacancy.openDate, "dd MMM yyyy", {
                locale: idLocale,
              })}
            />
            <MetaItem
              icon={CalendarClock}
              label="Ditutup"
              value={
                vacancy.closeDate
                  ? format(vacancy.closeDate, "dd MMM yyyy", {
                      locale: idLocale,
                    })
                  : "—"
              }
              muted={!vacancy.closeDate}
            />
            <MetaItem
              icon={Users}
              label="Total Kandidat"
              value={`${totalCandidates} orang`}
            />
            <MetaItem
              icon={KanbanSquare}
              label="Tahap Aktif"
              value={`${ACTIVE_STAGES.filter((s) => stageCounts[s] > 0).length} tahap`}
            />
          </dl>
        </CardContent>
      </Card>

      {/* ─── Pipeline Summary (Active Only) ────────── */}
      <section
        aria-label="Ringkasan tahap aktif rekrutmen"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {ACTIVE_STAGES.map((stage) => {
          const tone = STAGE_TONES[stage];
          return (
            <Card key={stage} className="border-slate-200 shadow-sm">
              <CardContent className="flex items-center gap-3 p-3.5">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                    tone.bg,
                    tone.text,
                    tone.ring,
                  )}
                  aria-hidden="true"
                >
                  <span className={cn("h-2 w-2 rounded-full", tone.dot)} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-500">
                    {STAGE_LABELS[stage]}
                  </p>
                  <p className="text-xl font-bold tabular-nums leading-tight text-slate-900">
                    {stageCounts[stage]}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* ─── Kanban Board ─────────────────────────── */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 md:p-5">
          <div className="mb-4 flex items-center gap-2">
            <KanbanSquare
              className="h-4 w-4 text-slate-500"
              aria-hidden="true"
            />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              Pipeline Kandidat
            </h2>
            <span className="ml-auto text-xs text-slate-500">
              Tarik &amp; lepaskan kartu untuk mengubah tahap
            </span>
          </div>
          <KanbanBoard
            initialCandidates={vacancy.candidates}
            vacancyId={vacancyId}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── MetaItem ──────────────────────────────────────────────

function MetaItem({
  icon: Icon,
  label,
  value,
  muted = false,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 ring-1 ring-slate-200"
        aria-hidden="true"
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium text-slate-500">{label}</dt>
        <dd
          className={cn(
            "truncate text-sm",
            muted ? "text-slate-400" : "font-medium text-slate-800",
          )}
          title={value}
        >
          {value}
        </dd>
      </div>
    </div>
  );
}
