"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  ArrowRight,
  Briefcase,
  Calendar,
  CircleOff,
  Loader2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toggleVacancyStatusAction } from "@/lib/actions/recruitment.actions";
import type { VacancyWithPipeline } from "@/lib/services/recruitment.service";
import { cn } from "@/lib/utils";
import { VacancyStatus } from "@/types/enums";

// ─── Helpers ────────────────────────────────────────────────────────────

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STAGE_CONFIG: Record<
  string,
  { label: string; color: string; bar: string }
> = {
  MELAMAR: { label: "Melamar", color: "bg-slate-100 text-slate-700", bar: "bg-slate-400" },
  SELEKSI_BERKAS: {
    label: "Seleksi",
    color: "bg-sky-50 text-sky-700",
    bar: "bg-sky-500",
  },
  INTERVIEW: {
    label: "Interview",
    color: "bg-amber-50 text-amber-700",
    bar: "bg-amber-500",
  },
  PENAWARAN: {
    label: "Penawaran",
    color: "bg-violet-50 text-violet-700",
    bar: "bg-violet-500",
  },
  DITERIMA: {
    label: "Diterima",
    color: "bg-emerald-50 text-emerald-700",
    bar: "bg-emerald-500",
  },
  DITOLAK: {
    label: "Ditolak",
    color: "bg-rose-50 text-rose-700",
    bar: "bg-rose-400",
  },
};

const PIPELINE_ORDER = [
  "MELAMAR",
  "SELEKSI_BERKAS",
  "INTERVIEW",
  "PENAWARAN",
  "DITERIMA",
  "DITOLAK",
] as const;

// ─── Props ──────────────────────────────────────────────────────────────

interface Props {
  vacancies: VacancyWithPipeline[];
}

// ─── Component ─────────────────────────────────────────────────────────

export function VacancyTable({ vacancies }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentStatus = searchParams.get("status") ?? "_all";

  function handleStatusFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "_all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    router.push(`/recruitment?${params.toString()}`);
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      const result = await toggleVacancyStatusAction(id);
      if (result.success) {
        toast.success("Status lowongan diperbarui");
      } else {
        toast.error(result.error ?? "Gagal mengubah status");
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* ─── Status tabs ──────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={currentStatus} onValueChange={handleStatusFilter}>
          <TabsList className="bg-white">
            <TabsTrigger value="_all" className="gap-2 text-xs sm:text-sm">
              Semua
            </TabsTrigger>
            <TabsTrigger
              value={VacancyStatus.OPEN}
              className="gap-2 text-xs sm:text-sm"
            >
              Dibuka
            </TabsTrigger>
            <TabsTrigger
              value={VacancyStatus.CLOSED}
              className="gap-2 text-xs sm:text-sm"
            >
              Ditutup
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-xs text-slate-500" aria-live="polite">
          <span className="font-semibold tabular-nums text-slate-700">
            {vacancies.length}
          </span>{" "}
          lowongan ditemukan
        </p>
      </div>

      {/* ─── Grid of vacancy cards ───────────────── */}
      {vacancies.length === 0 ? (
        <Card className="border-dashed border-slate-300 bg-white">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Briefcase
                className="h-6 w-6 text-slate-400"
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Belum ada lowongan pekerjaan
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Buat lowongan pertama untuk mulai menerima kandidat.
              </p>
            </div>
            <Button
              asChild
              size="sm"
              className="mt-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Link href="/recruitment/new">Buat Lowongan</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
          aria-label="Daftar lowongan pekerjaan"
        >
          {vacancies.map((v) => (
            <li key={v.id}>
              <VacancyCard
                vacancy={v}
                onToggle={handleToggle}
                isPending={isPending}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── VacancyCard ─────────────────────────────────────────────────────

function VacancyCard({
  vacancy,
  onToggle,
  isPending,
}: {
  vacancy: VacancyWithPipeline;
  onToggle: (id: string) => void;
  isPending: boolean;
}) {
  const isOpen = vacancy.status === VacancyStatus.OPEN;
  const totalCandidates = vacancy._count.candidates;

  const stageCounts = new Map<string, number>();
  for (const c of vacancy.candidates) {
    stageCounts.set(c.stage, (stageCounts.get(c.stage) ?? 0) + 1);
  }
  const pipelineEntries = PIPELINE_ORDER.filter(
    (stage) => (stageCounts.get(stage) ?? 0) > 0,
  );

  return (
    <Card className="group flex h-full flex-col border-slate-200 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/recruitment/${vacancy.id}`}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <h3 className="truncate text-base font-semibold text-slate-900 group-hover:text-emerald-700">
              {vacancy.title}
            </h3>
          </Link>
          <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
            <Briefcase
              className="h-3 w-3 flex-shrink-0"
              aria-hidden="true"
            />
            <span className="truncate">{vacancy.department.name}</span>
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "flex-shrink-0",
            isOpen
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
              : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-100",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "mr-1.5 inline-block h-1.5 w-1.5 rounded-full",
              isOpen ? "bg-emerald-500" : "bg-slate-400",
            )}
          />
          {isOpen ? "Dibuka" : "Ditutup"}
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 pb-4">
        {/* Meta */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="flex items-center gap-1.5 text-slate-400">
              <Users className="h-3 w-3" aria-hidden="true" />
              Kandidat
            </p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">
              {totalCandidates}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-slate-400">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              Dibuka
            </p>
            <p className="mt-0.5 text-sm font-medium tabular-nums text-slate-700">
              {formatDate(vacancy.openDate)}
            </p>
          </div>
        </div>

        {/* Pipeline visualization */}
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Pipeline Kandidat
          </p>
          {totalCandidates === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-2.5">
              <p className="text-xs text-slate-400">
                Belum ada pelamar untuk lowongan ini.
              </p>
            </div>
          ) : (
            <>
              <div
                className="flex h-2 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-label={`Progres kandidat: ${totalCandidates} total`}
                aria-valuenow={totalCandidates}
                aria-valuemin={0}
                aria-valuemax={totalCandidates}
              >
                {PIPELINE_ORDER.map((stage) => {
                  const count = stageCounts.get(stage) ?? 0;
                  if (count === 0) return null;
                  const pct = (count / totalCandidates) * 100;
                  return (
                    <span
                      key={stage}
                      className={cn("h-full", STAGE_CONFIG[stage].bar)}
                      style={{ width: `${pct}%` }}
                      title={`${STAGE_CONFIG[stage].label}: ${count}`}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-1.5" aria-hidden="true">
                {pipelineEntries.map((stage) => {
                  const count = stageCounts.get(stage) ?? 0;
                  return (
                    <span
                      key={stage}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                        STAGE_CONFIG[stage].color,
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          STAGE_CONFIG[stage].bar,
                        )}
                      />
                      {STAGE_CONFIG[stage].label} · {count}
                    </span>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="flex-1 justify-center gap-1.5"
          >
            <Link
              href={`/recruitment/${vacancy.id}`}
              aria-label={`Lihat detail lowongan ${vacancy.title}`}
            >
              Lihat Detail
              <ArrowRight
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => onToggle(vacancy.id)}
            className={cn(
              "gap-1.5",
              isOpen
                ? "text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700",
            )}
            aria-label={
              isOpen
                ? `Tutup lowongan ${vacancy.title}`
                : `Buka kembali lowongan ${vacancy.title}`
            }
          >
            {isPending ? (
              <Loader2
                className="h-3.5 w-3.5 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <CircleOff className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {isOpen ? "Tutup" : "Buka"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
