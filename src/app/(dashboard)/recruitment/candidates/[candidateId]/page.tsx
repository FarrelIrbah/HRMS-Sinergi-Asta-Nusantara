import { getCandidateById } from "@/lib/services/recruitment.service";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { CandidateDetailClient } from "./_components/candidate-detail-client";

interface Props {
  params: Promise<{ candidateId: string }>;
}

export default async function CandidateDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  if (role !== "HR_ADMIN" && role !== "SUPER_ADMIN") redirect("/dashboard");

  const { candidateId } = await params;
  const candidate = await getCandidateById(candidateId);
  if (!candidate) notFound();

  // Serialize dates for client
  const serialized = {
    ...candidate,
    createdAt: candidate.createdAt.toISOString(),
    updatedAt: candidate.updatedAt.toISOString(),
    hiredAt: candidate.hiredAt?.toISOString() ?? null,
    offerSalary: candidate.offerSalary?.toString() ?? null,
    interviews: candidate.interviews.map((i) => ({
      ...i,
      scheduledAt: i.scheduledAt.toISOString(),
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    })),
    vacancy: {
      ...candidate.vacancy,
      openDate: candidate.vacancy.openDate.toISOString(),
      closeDate: candidate.vacancy.closeDate?.toISOString() ?? null,
      createdAt: candidate.vacancy.createdAt.toISOString(),
      updatedAt: candidate.vacancy.updatedAt.toISOString(),
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground sm:text-sm">
        <a href="/recruitment" className="hover:underline">Rekrutmen</a>
        <span aria-hidden="true">›</span>
        <a href={`/recruitment/${candidate.vacancyId}`} className="truncate hover:underline">
          {candidate.vacancy.title}
        </a>
        <span aria-hidden="true">›</span>
        <span className="truncate">{candidate.name}</span>
      </div>
      <CandidateDetailClient candidate={serialized} />
    </div>
  );
}
