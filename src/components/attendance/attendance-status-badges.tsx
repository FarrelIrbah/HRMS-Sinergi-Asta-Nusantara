import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}j`;
  return `${h}j ${m}m`;
}

interface AttendanceRecordLike {
  clockOut: Date | null;
  isLate: boolean;
  lateMinutes: number;
  isEarlyOut: boolean;
  earlyOutMinutes?: number;
  overtimeMinutes: number;
  isManualOverride?: boolean;
}

interface AttendanceStatusBadgesProps {
  record: AttendanceRecordLike;
  showOvertime?: boolean;
  showManual?: boolean;
  className?: string;
}

const BADGE_BASE =
  "border text-[11px] font-medium px-2 py-0.5 rounded-md hover:bg-opacity-100";

export function AttendanceStatusBadges({
  record,
  showOvertime = true,
  showManual = true,
  className,
}: AttendanceStatusBadgesProps) {
  const isOnTime =
    !record.isLate &&
    !record.isEarlyOut &&
    record.overtimeMinutes === 0 &&
    !!record.clockOut;

  const badges: React.ReactNode[] = [];

  if (isOnTime) {
    badges.push(
      <Badge
        key="ontime"
        variant="outline"
        className={cn(
          BADGE_BASE,
          "border-emerald-200 bg-emerald-50 text-emerald-700"
        )}
      >
        <span
          className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"
          aria-hidden="true"
        />
        Tepat Waktu
      </Badge>
    );
  }

  if (record.isLate) {
    badges.push(
      <Badge
        key="late"
        variant="outline"
        className={cn(
          BADGE_BASE,
          "border-amber-200 bg-amber-50 text-amber-800"
        )}
      >
        <span
          className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-500"
          aria-hidden="true"
        />
        Terlambat {record.lateMinutes}m
      </Badge>
    );
  }

  if (record.isEarlyOut) {
    badges.push(
      <Badge
        key="early"
        variant="outline"
        className={cn(
          BADGE_BASE,
          "border-rose-200 bg-rose-50 text-rose-700"
        )}
      >
        <span
          className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-rose-500"
          aria-hidden="true"
        />
        Pulang Awal
      </Badge>
    );
  }

  if (showOvertime && record.overtimeMinutes > 0) {
    badges.push(
      <Badge
        key="ot"
        variant="outline"
        className={cn(
          BADGE_BASE,
          "border-violet-200 bg-violet-50 text-violet-700"
        )}
      >
        <span
          className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-violet-500"
          aria-hidden="true"
        />
        Lembur {formatMinutes(record.overtimeMinutes)}
      </Badge>
    );
  }

  if (showManual && record.isManualOverride) {
    badges.push(
      <Badge
        key="manual"
        variant="outline"
        className={cn(
          BADGE_BASE,
          "border-slate-200 bg-slate-50 text-slate-700"
        )}
      >
        Override
      </Badge>
    );
  }

  if (badges.length === 0) {
    return <span className="text-xs text-slate-400">{"\u2014"}</span>;
  }

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>{badges}</div>
  );
}
