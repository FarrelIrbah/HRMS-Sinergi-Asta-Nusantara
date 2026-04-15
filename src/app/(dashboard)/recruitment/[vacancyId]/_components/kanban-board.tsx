"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarClock,
  ChevronDown,
  Flag,
  FileText,
  GripVertical,
  Mail,
  Phone,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { updateCandidateStageAction } from "@/lib/actions/recruitment.actions";
import type { VacancyDetail } from "@/lib/services/recruitment.service";

type Candidate = VacancyDetail["candidates"][number];

const STAGE_LABELS: Record<string, string> = {
  MELAMAR: "Melamar",
  SELEKSI_BERKAS: "Seleksi Berkas",
  INTERVIEW: "Interview",
  PENAWARAN: "Penawaran",
  DITERIMA: "Diterima",
  DITOLAK: "Ditolak",
};

const ACTIVE_STAGES = [
  "MELAMAR",
  "SELEKSI_BERKAS",
  "INTERVIEW",
  "PENAWARAN",
] as const;

const TERMINAL_STAGES = ["DITERIMA", "DITOLAK"] as const;

const ALL_STAGES: string[] = [...ACTIVE_STAGES, ...TERMINAL_STAGES];

interface StageTone {
  header: string;
  dot: string;
  count: string;
  columnBg: string;
  columnBorder: string;
  columnOver: string;
  avatarBg: string;
  avatarText: string;
  accentText: string;
}

const STAGE_TONES: Record<string, StageTone> = {
  MELAMAR: {
    header: "bg-slate-50 border-slate-200",
    dot: "bg-slate-400",
    count: "bg-slate-200/70 text-slate-700",
    columnBg: "bg-slate-50/60",
    columnBorder: "border-slate-200",
    columnOver: "bg-slate-100 ring-2 ring-slate-300",
    avatarBg: "bg-slate-100",
    avatarText: "text-slate-700",
    accentText: "text-slate-700",
  },
  SELEKSI_BERKAS: {
    header: "bg-sky-50 border-sky-200",
    dot: "bg-sky-500",
    count: "bg-sky-100 text-sky-700",
    columnBg: "bg-sky-50/40",
    columnBorder: "border-sky-200",
    columnOver: "bg-sky-100/70 ring-2 ring-sky-300",
    avatarBg: "bg-sky-100",
    avatarText: "text-sky-700",
    accentText: "text-sky-700",
  },
  INTERVIEW: {
    header: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
    count: "bg-amber-100 text-amber-700",
    columnBg: "bg-amber-50/40",
    columnBorder: "border-amber-200",
    columnOver: "bg-amber-100/70 ring-2 ring-amber-300",
    avatarBg: "bg-amber-100",
    avatarText: "text-amber-800",
    accentText: "text-amber-700",
  },
  PENAWARAN: {
    header: "bg-violet-50 border-violet-200",
    dot: "bg-violet-500",
    count: "bg-violet-100 text-violet-700",
    columnBg: "bg-violet-50/40",
    columnBorder: "border-violet-200",
    columnOver: "bg-violet-100/70 ring-2 ring-violet-300",
    avatarBg: "bg-violet-100",
    avatarText: "text-violet-800",
    accentText: "text-violet-700",
  },
  DITERIMA: {
    header: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
    count: "bg-emerald-100 text-emerald-700",
    columnBg: "bg-emerald-50/40",
    columnBorder: "border-emerald-200",
    columnOver: "bg-emerald-100/70 ring-2 ring-emerald-300",
    avatarBg: "bg-emerald-100",
    avatarText: "text-emerald-800",
    accentText: "text-emerald-700",
  },
  DITOLAK: {
    header: "bg-rose-50 border-rose-200",
    dot: "bg-rose-500",
    count: "bg-rose-100 text-rose-700",
    columnBg: "bg-rose-50/40",
    columnBorder: "border-rose-200",
    columnOver: "bg-rose-100/70 ring-2 ring-rose-300",
    avatarBg: "bg-rose-100",
    avatarText: "text-rose-800",
    accentText: "text-rose-700",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getNextInterview(candidate: Candidate): Date | null {
  const now = Date.now();
  const upcoming = candidate.interviews
    .map((i) => new Date(i.scheduledAt))
    .filter((d) => d.getTime() >= now)
    .sort((a, b) => a.getTime() - b.getTime());
  return upcoming[0] ?? null;
}

// ─── CandidateCard ────────────────────────────────────────────────────────

function CandidateCard({
  candidate,
  tone,
  isOverlay = false,
}: {
  candidate: Candidate;
  tone: StageTone;
  isOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: candidate.id,
    data: { stage: candidate.stage },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const initials = getInitials(candidate.name);
  const nextInterview = getNextInterview(candidate);
  const interviewCount = candidate.interviews.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-lg border bg-white shadow-sm transition-all",
        "hover:shadow-md hover:border-slate-300",
        isOverlay
          ? "cursor-grabbing border-slate-300 shadow-lg ring-2 ring-emerald-200"
          : "border-slate-200",
        isDragging && !isOverlay && "opacity-40",
      )}
      aria-label={`Kandidat ${candidate.name}, tahap ${STAGE_LABELS[candidate.stage]}`}
    >
      {/* Drag handle row */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-2.5 py-1.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:cursor-grabbing"
          aria-label={`Seret kartu ${candidate.name}`}
        >
          <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
            tone.count,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
          {STAGE_LABELS[candidate.stage]}
        </span>
      </div>

      {/* Body */}
      <Link
        href={`/recruitment/candidates/${candidate.id}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="block space-y-2 rounded-b-lg p-3 hover:bg-slate-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <div className="flex items-start gap-2.5">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback
              className={cn(
                "text-xs font-semibold",
                tone.avatarBg,
                tone.avatarText,
              )}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {candidate.name}
            </p>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
              <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{candidate.email}</span>
            </p>
          </div>
        </div>

        {candidate.phone && (
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="font-mono tabular-nums">{candidate.phone}</span>
          </p>
        )}

        {/* Meta chips */}
        {(candidate.cvPath || interviewCount > 0 || nextInterview) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {candidate.cvPath && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
                <FileText className="h-2.5 w-2.5" aria-hidden="true" />
                CV
              </span>
            )}
            {interviewCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-100">
                <Users className="h-2.5 w-2.5" aria-hidden="true" />
                {interviewCount}× wawancara
              </span>
            )}
            {nextInterview && (
              <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 ring-1 ring-inset ring-sky-100">
                <CalendarClock className="h-2.5 w-2.5" aria-hidden="true" />
                {formatDistanceToNow(nextInterview, {
                  addSuffix: true,
                  locale: idLocale,
                })}
              </span>
            )}
          </div>
        )}
      </Link>
    </div>
  );
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────

function KanbanColumn({
  stage,
  candidates,
  variant = "active",
}: {
  stage: string;
  candidates: Candidate[];
  variant?: "active" | "terminal";
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const tone = STAGE_TONES[stage];
  const minHeight = variant === "terminal" ? "min-h-[200px]" : "min-h-[340px]";

  return (
    <section
      className="flex min-w-0 flex-col"
      aria-label={`Kolom ${STAGE_LABELS[stage]}`}
    >
      {/* Column Header */}
      <header
        className={cn(
          "flex items-center gap-2 rounded-t-lg border border-b-0 px-3 py-2.5",
          tone.header,
        )}
      >
        <span
          className={cn("h-2 w-2 rounded-full", tone.dot)}
          aria-hidden="true"
        />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
          {STAGE_LABELS[stage]}
        </h3>
        <span
          className={cn(
            "ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
            tone.count,
          )}
          aria-label={`${candidates.length} kandidat`}
        >
          {candidates.length}
        </span>
      </header>

      {/* Column Body */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 rounded-b-lg border px-2 py-2.5 transition-colors",
          tone.columnBg,
          tone.columnBorder,
          isOver && tone.columnOver,
          minHeight,
        )}
        aria-dropeffect="move"
      >
        <SortableContext
          items={candidates.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              tone={tone}
            />
          ))}
        </SortableContext>

        {candidates.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-slate-200 bg-white/40 px-3 py-6 text-center">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400"
              aria-hidden="true"
            >
              <UserPlus className="h-3.5 w-3.5" />
            </div>
            <p className="text-[11px] font-medium text-slate-500">Kosong</p>
            <p className="max-w-[180px] text-[10px] leading-relaxed text-slate-400">
              Tarik kartu ke sini untuk memindahkan kandidat.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── TerminalPreviewStack ─────────────────────────────────────────────────

function TerminalPreviewStack({
  candidates,
  tone,
}: {
  candidates: Candidate[];
  tone: StageTone;
}) {
  const visible = candidates.slice(0, 3);
  const remaining = candidates.length - visible.length;

  if (candidates.length === 0) return null;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((c) => (
        <Avatar
          key={c.id}
          className="h-6 w-6 border-2 border-white shadow-sm"
        >
          <AvatarFallback
            className={cn("text-[10px] font-semibold", tone.avatarBg, tone.avatarText)}
          >
            {getInitials(c.name)}
          </AvatarFallback>
        </Avatar>
      ))}
      {remaining > 0 && (
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-slate-200 px-1.5 text-[10px] font-semibold text-slate-600 shadow-sm">
          +{remaining}
        </span>
      )}
    </div>
  );
}

// ─── KanbanBoard ──────────────────────────────────────────────────────────

interface KanbanBoardProps {
  initialCandidates: Candidate[];
  vacancyId: string;
}

export function KanbanBoard({
  initialCandidates,
  vacancyId: _vacancyId,
}: KanbanBoardProps) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(
    null,
  );
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const byStage = (stage: string) =>
    candidates.filter((c) => c.stage === stage);

  const diterimaList = byStage("DITERIMA");
  const ditolakList = byStage("DITOLAK");
  const terminalCount = diterimaList.length + ditolakList.length;

  // Auto-expand terminal section while dragging so terminal drop zones are reachable
  const isDragging = !!activeCandidate;
  const effectiveOpen = terminalOpen || isDragging;

  useEffect(() => {
    if (isDragging && !terminalOpen) setTerminalOpen(true);
  }, [isDragging, terminalOpen]);

  const handleDragStart = (event: DragStartEvent) => {
    const found = candidates.find((c) => c.id === event.active.id);
    setActiveCandidate(found ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCandidate(null);
    const { active, over } = event;
    if (!over) return;

    const dragged = candidates.find((c) => c.id === active.id);
    if (!dragged) return;

    const targetCandidate = candidates.find((c) => c.id === over.id);
    const overId = over.id as string;
    const newStage: string = targetCandidate
      ? targetCandidate.stage
      : ALL_STAGES.includes(overId)
        ? overId
        : dragged.stage;

    if (newStage === dragged.stage) return;

    const prevCandidates = candidates;
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === active.id
          ? { ...c, stage: newStage as Candidate["stage"] }
          : c,
      ),
    );

    startTransition(async () => {
      const result = await updateCandidateStageAction(active.id as string, {
        stage: newStage,
      });
      if (!result.success) {
        setCandidates(prevCandidates);
        toast.error(result.error ?? "Gagal memindahkan kandidat");
        return;
      }
      toast.success(
        `Kandidat dipindahkan ke ${STAGE_LABELS[newStage] ?? newStage}`,
      );
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* ─── Active Pipeline (4 columns, auto-fit viewport) ─── */}
      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        role="region"
        aria-label="Pipeline aktif — tahap rekrutmen berjalan"
      >
        {ACTIVE_STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            candidates={byStage(stage)}
            variant="active"
          />
        ))}
      </div>

      {/* ─── Terminal Outcomes (collapsible) ─── */}
      <Collapsible
        open={effectiveOpen}
        onOpenChange={setTerminalOpen}
        className="mt-5"
      >
        <CollapsibleTrigger
          asChild
          aria-label="Toggle bagian hasil akhir"
        >
          <button
            type="button"
            className={cn(
              "group flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-colors",
              "hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
            )}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 ring-1 ring-slate-200"
              aria-hidden="true"
            >
              <Flag className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  Hasil Akhir
                </h3>
                <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-slate-100 px-1.5 text-[11px] font-semibold tabular-nums text-slate-600">
                  {terminalCount}
                </span>
              </div>
              <p className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="tabular-nums font-medium text-emerald-700">
                    {diterimaList.length}
                  </span>
                  diterima
                </span>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  <span className="tabular-nums font-medium text-rose-700">
                    {ditolakList.length}
                  </span>
                  ditolak
                </span>
              </p>
            </div>

            {/* Avatar preview stack — visible only when collapsed & has candidates */}
            {!effectiveOpen && terminalCount > 0 && (
              <div className="hidden shrink-0 items-center gap-3 md:flex">
                {diterimaList.length > 0 && (
                  <TerminalPreviewStack
                    candidates={diterimaList}
                    tone={STAGE_TONES.DITERIMA}
                  />
                )}
                {ditolakList.length > 0 && (
                  <TerminalPreviewStack
                    candidates={ditolakList}
                    tone={STAGE_TONES.DITOLAK}
                  />
                )}
              </div>
            )}

            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                effectiveOpen && "rotate-180",
              )}
              aria-hidden="true"
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden">
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {TERMINAL_STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                candidates={byStage(stage)}
                variant="terminal"
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <DragOverlay>
        {activeCandidate && (
          <CandidateCard
            candidate={activeCandidate}
            tone={STAGE_TONES[activeCandidate.stage]}
            isOverlay
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
