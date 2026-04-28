"use client";

import {
  BadgeDollarSign,
  CalendarDays,
  CircleAlert,
  Info,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface LeaveType {
  id: string;
  name: string;
  annualQuota: number;
  isPaid: boolean;
  genderRestriction: string | null;
}

interface Balance {
  leaveTypeId: string;
  allocatedDays: number;
  usedDays: number;
  leaveType: { id: string; name: string };
}

interface LeaveTypeInfoPanelProps {
  leaveTypes: LeaveType[];
  balances: Balance[];
  selectedLeaveTypeId: string;
}

const GENDER_LABEL: Record<string, string> = {
  MALE: "Khusus Pria",
  FEMALE: "Khusus Wanita",
};

export function LeaveTypeInfoPanel({
  leaveTypes,
  balances,
  selectedLeaveTypeId,
}: LeaveTypeInfoPanelProps) {
  const leaveType = leaveTypes.find((lt) => lt.id === selectedLeaveTypeId);
  const balance = balances.find((b) => b.leaveTypeId === selectedLeaveTypeId);

  if (!leaveType) {
    return (
      <Card
        className="h-full border-dashed border-slate-300 bg-slate-50/60 shadow-none"
        aria-live="polite"
      >
        <CardContent className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white ring-1 ring-slate-200"
            aria-hidden="true"
          >
            <Info className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700">
              Belum memilih jenis cuti
            </p>
            <p className="mx-auto max-w-[26ch] text-xs leading-relaxed text-slate-500">
              Pilih jenis cuti pada form di sebelah kiri untuk melihat detail
              kebijakan, saldo, dan alur persetujuan.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const allocated = balance?.allocatedDays ?? leaveType.annualQuota;
  const used = balance?.usedDays ?? 0;
  const remaining = Math.max(0, allocated - used);
  const pct = allocated > 0 ? Math.min(100, (used / allocated) * 100) : 0;
  const remainPct = allocated > 0 ? (remaining / allocated) * 100 : 100;
  const progressTone =
    remainPct > 50
      ? "[&>div]:bg-emerald-500"
      : remainPct > 20
        ? "[&>div]:bg-amber-500"
        : "[&>div]:bg-red-500";

  const isOutOfBalance = remaining <= 0;

  return (
    <Card
      className="h-full border-slate-200 shadow-sm"
      aria-live="polite"
      aria-label={`Detail jenis cuti ${leaveType.name}`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-50 text-sky-600"
            aria-hidden="true"
          >
            <Info className="h-3.5 w-3.5" />
          </div>
          Detail & Kebijakan
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ─── Leave type name ─────────────── */}
        <div className="flex items-start gap-2.5">
          <div
            className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600"
            aria-hidden="true"
          >
            <CalendarDays className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Jenis Cuti
            </p>
            <p className="truncate text-sm font-semibold text-slate-900">
              {leaveType.name}
            </p>
          </div>
        </div>

        {/* ─── Policy badges ───────────────── */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Kebijakan
          </p>
          <div className="flex flex-wrap gap-1.5">
            {leaveType.isPaid ? (
              <Badge
                variant="outline"
                className="gap-1 border-emerald-300 bg-emerald-50 text-xs font-normal text-emerald-700"
              >
                <BadgeDollarSign className="h-3 w-3" aria-hidden="true" />
                Berbayar
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="gap-1 border-slate-300 bg-slate-50 text-xs font-normal text-slate-600"
              >
                <Wallet className="h-3 w-3" aria-hidden="true" />
                Tidak Berbayar
              </Badge>
            )}
            {leaveType.genderRestriction ? (
              <Badge
                variant="outline"
                className={cn(
                  "gap-1 text-xs font-normal",
                  leaveType.genderRestriction === "MALE"
                    ? "border-sky-300 bg-sky-50 text-sky-700"
                    : "border-rose-300 bg-rose-50 text-rose-700"
                )}
              >
                <UserRound className="h-3 w-3" aria-hidden="true" />
                {GENDER_LABEL[leaveType.genderRestriction] ??
                  leaveType.genderRestriction}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="gap-1 border-slate-300 bg-slate-50 text-xs font-normal text-slate-600"
              >
                <Users className="h-3 w-3" aria-hidden="true" />
                Semua Gender
              </Badge>
            )}
            <Badge
              variant="outline"
              className="gap-1 border-violet-300 bg-violet-50 text-xs font-normal text-violet-700"
            >
              <CalendarDays className="h-3 w-3" aria-hidden="true" />
              {leaveType.annualQuota} hari / tahun
            </Badge>
          </div>
        </div>

        <Separator className="bg-slate-200" />

        {/* ─── Saldo breakdown ─────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Saldo {new Date().getFullYear()}
            </p>
            {isOutOfBalance && (
              <span
                className="inline-flex items-center gap-1 text-xs font-medium text-red-600"
                role="status"
              >
                <CircleAlert className="h-3 w-3" aria-hidden="true" />
                Saldo habis
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <BalanceStat label="Alokasi" value={allocated} tone="slate" />
            <BalanceStat label="Terpakai" value={used} tone="sky" />
            <BalanceStat
              label="Sisa"
              value={remaining}
              tone={
                remainPct > 50
                  ? "emerald"
                  : remainPct > 20
                    ? "amber"
                    : "red"
              }
            />
          </div>
          <Progress
            value={pct}
            className={cn("h-1.5 bg-slate-100", progressTone)}
            aria-label={`${used} dari ${allocated} hari terpakai`}
          />
        </div>

        <Separator className="bg-slate-200" />

        {/* ─── Approval flow ───────────────── */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Alur Persetujuan
          </p>
          <ol className="space-y-1.5 text-xs text-slate-600">
            <FlowStep n={1}>
              Isi jenis, rentang tanggal, dan alasan yang jelas
            </FlowStep>
            <FlowStep n={2}>
              Pengajuan ditinjau Manager / HR Admin
            </FlowStep>
            <FlowStep n={3}>
              Status terbaru muncul pada tabel Riwayat Pengajuan
            </FlowStep>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────── Sub-components ───────────────────

type StatTone = "slate" | "sky" | "emerald" | "amber" | "red";

const STAT_TONE: Record<StatTone, string> = {
  slate: "text-slate-900",
  sky: "text-sky-700",
  emerald: "text-emerald-700",
  amber: "text-amber-700",
  red: "text-red-700",
};

function BalanceStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: StatTone;
}) {
  return (
    <div className="rounded-md bg-slate-50 px-2.5 py-2 ring-1 ring-slate-100">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={cn(
          "text-lg font-bold tabular-nums leading-tight",
          STAT_TONE[tone]
        )}
      >
        {value}
      </p>
    </div>
  );
}

function FlowStep({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span
        className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-semibold text-emerald-700"
        aria-hidden="true"
      >
        {n}
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
