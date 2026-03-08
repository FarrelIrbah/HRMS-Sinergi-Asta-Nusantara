import { getVacancyById } from "@/lib/services/recruitment.service";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { KanbanBoard } from "./_components/kanban-board";
import { AddCandidateDialogWrapper } from "./_components/add-candidate-wrapper";

interface Props {
  params: Promise<{ vacancyId: string }>;
}

export default async function VacancyDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  if (role !== "HR_ADMIN" && role !== "SUPER_ADMIN") redirect("/dashboard");

  const { vacancyId } = await params;
  const vacancy = await getVacancyById(vacancyId);
  if (!vacancy) notFound();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <a href="/recruitment" className="hover:underline">
              Rekrutmen
            </a>
            <span>›</span>
            <span>{vacancy.title}</span>
          </div>
          <h1 className="text-2xl font-bold">{vacancy.title}</h1>
          <p className="text-muted-foreground text-sm">
            {vacancy.department.name} ·{" "}
            {vacancy.status === "OPEN" ? "Terbuka" : "Ditutup"}
          </p>
        </div>
        <AddCandidateDialogWrapper vacancyId={vacancyId} />
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Dibuka:</span>{" "}
          {new Date(vacancy.openDate).toLocaleDateString("id-ID")}
        </div>
        {vacancy.closeDate && (
          <div>
            <span className="text-muted-foreground">Ditutup:</span>{" "}
            {new Date(vacancy.closeDate).toLocaleDateString("id-ID")}
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Total Kandidat:</span>{" "}
          {vacancy.candidates.length}
        </div>
      </div>

      <KanbanBoard
        initialCandidates={vacancy.candidates}
        vacancyId={vacancyId}
      />
    </div>
  );
}
