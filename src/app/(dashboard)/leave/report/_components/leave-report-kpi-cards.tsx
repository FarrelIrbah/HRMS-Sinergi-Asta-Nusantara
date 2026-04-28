import {
  CalendarCheck2,
  Clock,
  Minus,
  TrendingDown,
  TrendingUp,
  Users2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { SummaryTile } from "@/components/shared/summary-tile";
import { cn } from "@/lib/utils";

export interface LeaveReportKpis {
  employees: number;
  approvedDays: number;
  pending: number;
  rejected: number;
}

interface LeaveReportKpiCardsProps {
  current: LeaveReportKpis;
  previous: LeaveReportKpis;
  year: number;
}

export function LeaveReportKpiCards({
  current,
  previous,
  year,
}: LeaveReportKpiCardsProps) {
  const priorYear = year - 1;

  return (
    <section
      aria-label="Ringkasan laporan cuti"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      <SummaryTile
        icon={Users2}
        tone="emerald"
        label="Karyawan Mengajukan"
        value={current.employees}
        trailing={
          <DeltaChip
            current={current.employees}
            prior={previous.employees}
            priorYear={priorYear}
            neutral
          />
        }
      />
      <SummaryTile
        icon={CalendarCheck2}
        tone="sky"
        label="Total Disetujui"
        value={current.approvedDays}
        suffix="hari"
        trailing={
          <DeltaChip
            current={current.approvedDays}
            prior={previous.approvedDays}
            priorYear={priorYear}
            neutral
          />
        }
      />
      <SummaryTile
        icon={Clock}
        tone="amber"
        label="Menunggu"
        value={current.pending}
        trailing={
          <DeltaChip
            current={current.pending}
            prior={previous.pending}
            priorYear={priorYear}
            inverted
          />
        }
      />
      <SummaryTile
        icon={XCircle}
        tone="rose"
        label="Ditolak"
        value={current.rejected}
        trailing={
          <DeltaChip
            current={current.rejected}
            prior={previous.rejected}
            priorYear={priorYear}
            inverted
          />
        }
      />
    </section>
  );
}

// ─────────────────── Sub-component ───────────────────

function DeltaChip({
  current,
  prior,
  priorYear,
  neutral = false,
  inverted = false,
}: {
  current: number;
  prior: number;
  priorYear: number;
  neutral?: boolean;
  inverted?: boolean;
}) {
  const diff = current - prior;
  const pct =
    prior === 0
      ? current === 0
        ? 0
        : null
      : Math.round((diff / prior) * 100);

  let tone: "emerald" | "rose" | "slate" = "slate";
  let Icon: LucideIcon = Minus;

  if (diff === 0) {
    tone = "slate";
    Icon = Minus;
  } else if (neutral) {
    tone = "slate";
    Icon = diff > 0 ? TrendingUp : TrendingDown;
  } else if (inverted) {
    tone = diff > 0 ? "rose" : "emerald";
    Icon = diff > 0 ? TrendingUp : TrendingDown;
  } else {
    tone = diff > 0 ? "emerald" : "rose";
    Icon = diff > 0 ? TrendingUp : TrendingDown;
  }

  const toneClass =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : tone === "rose"
        ? "bg-rose-50 text-rose-700 ring-rose-100"
        : "bg-slate-100 text-slate-600 ring-slate-200";

  const label = (() => {
    if (diff === 0 && prior === 0) return `Belum ada data ${priorYear}`;
    if (diff === 0) return `Sama dengan ${priorYear}`;
    if (pct === null) return `Baru tahun ini`;
    const sign = diff > 0 ? "+" : "";
    return `${sign}${pct}% vs ${priorYear}`;
  })();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
        toneClass
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
}
