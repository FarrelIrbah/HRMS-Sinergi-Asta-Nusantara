"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

const STAGE_ORDER = Object.keys(STAGE_LABELS) as string[];

// --- CandidateCard ---
function CandidateCard({
  candidate,
  isDragging,
}: {
  candidate: Candidate;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: candidate.id,
      data: { stage: candidate.stage },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border rounded-md p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <a
        href={`/recruitment/candidates/${candidate.id}`}
        className="block font-medium text-sm hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {candidate.name}
      </a>
      <p className="text-xs text-muted-foreground mt-1">{candidate.email}</p>
    </div>
  );
}

// --- KanbanColumn ---
function KanbanColumn({
  stage,
  candidates,
}: {
  stage: string;
  candidates: Candidate[];
}) {
  return (
    <div className="flex flex-col gap-2 min-w-[180px] flex-1">
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-semibold">{STAGE_LABELS[stage]}</span>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {candidates.length}
        </span>
      </div>
      <div className="bg-muted/40 rounded-lg p-2 min-h-[200px] space-y-2">
        <SortableContext
          items={candidates.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {candidates.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

// --- KanbanBoard ---
interface KanbanBoardProps {
  initialCandidates: Candidate[];
  vacancyId: string;
}

export function KanbanBoard({
  initialCandidates,
  vacancyId: _vacancyId,
}: KanbanBoardProps) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const byStage = (stage: string) =>
    candidates.filter((c) => c.stage === stage);

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

    // Determine target stage:
    // over.id could be a candidate id (dropped on a card) or a stage string (dropped on column droppable)
    const targetCandidate = candidates.find((c) => c.id === over.id);
    const overId = over.id as string;
    const newStage: string = targetCandidate
      ? targetCandidate.stage
      : STAGE_ORDER.includes(overId)
      ? overId
      : dragged.stage;

    if (newStage === dragged.stage) return;

    // Optimistic update
    const prevCandidates = candidates;
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === active.id ? { ...c, stage: newStage as Candidate["stage"] } : c
      )
    );

    startTransition(async () => {
      const result = await updateCandidateStageAction(active.id as string, {
        stage: newStage,
      });
      if (result.error) {
        // Rollback on error
        setCandidates(prevCandidates);
      }
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGE_ORDER.map((stage) => (
          <KanbanColumn key={stage} stage={stage} candidates={byStage(stage)} />
        ))}
      </div>
      <DragOverlay>
        {activeCandidate && (
          <CandidateCard candidate={activeCandidate} isDragging />
        )}
      </DragOverlay>
    </DndContext>
  );
}
