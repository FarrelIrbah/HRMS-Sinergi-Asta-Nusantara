import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type SummaryTone =
  | "emerald"
  | "sky"
  | "violet"
  | "amber"
  | "slate"
  | "rose";

const TONE: Record<
  SummaryTone,
  { gradient: string; iconBg: string; iconText: string }
> = {
  emerald: {
    gradient: "from-emerald-50 via-white to-white",
    iconBg: "bg-emerald-100/70",
    iconText: "text-emerald-600",
  },
  sky: {
    gradient: "from-sky-50 via-white to-white",
    iconBg: "bg-sky-100/70",
    iconText: "text-sky-600",
  },
  violet: {
    gradient: "from-violet-50 via-white to-white",
    iconBg: "bg-violet-100/70",
    iconText: "text-violet-600",
  },
  amber: {
    gradient: "from-amber-50 via-white to-white",
    iconBg: "bg-amber-100/70",
    iconText: "text-amber-600",
  },
  rose: {
    gradient: "from-rose-50 via-white to-white",
    iconBg: "bg-rose-100/70",
    iconText: "text-rose-500",
  },
  slate: {
    gradient: "from-slate-50 via-white to-white",
    iconBg: "bg-slate-100/70",
    iconText: "text-slate-600",
  },
};

interface SummaryTileProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  tone: SummaryTone;
  suffix?: string;
  caption?: string;
  title?: string;
  href?: string;
  trailing?: React.ReactNode;
}

export function SummaryTile({
  icon: Icon,
  label,
  value,
  tone,
  suffix,
  caption,
  title,
  href,
  trailing,
}: SummaryTileProps) {
  const t = TONE[tone];
  const formatted =
    typeof value === "number" ? value.toLocaleString("id-ID") : value;

  const card = (
    <Card
      className={cn(
        "group relative h-full overflow-hidden border-slate-200/80 bg-gradient-to-br shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        t.gradient
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -right-4 -top-4 transition-transform duration-300 group-hover:scale-110",
          t.iconText
        )}
      >
        <Icon className="h-24 w-24 opacity-[0.08]" strokeWidth={1.25} />
      </div>
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {label}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span
                className="truncate text-2xl font-bold tabular-nums leading-tight tracking-tight text-slate-900"
                title={title ?? String(formatted)}
              >
                {formatted}
              </span>
              {suffix ? (
                <span className="flex-shrink-0 text-sm text-slate-500">
                  {suffix}
                </span>
              ) : null}
            </div>
          </div>
          <div
            className={cn(
              "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
              t.iconBg
            )}
            aria-hidden="true"
          >
            <Icon className={cn("h-4 w-4", t.iconText)} />
          </div>
        </div>
        {trailing ? (
          <div className="mt-3">{trailing}</div>
        ) : caption ? (
          <p className="mt-3 truncate text-xs text-slate-500">{caption}</p>
        ) : null}
        {href ? (
          <ArrowRight
            aria-hidden="true"
            className="absolute bottom-4 right-4 h-4 w-4 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-slate-500"
          />
        ) : null}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        aria-label={`${label}: ${formatted}${suffix ? ` ${suffix}` : ""}`}
      >
        {card}
      </Link>
    );
  }
  return card;
}
