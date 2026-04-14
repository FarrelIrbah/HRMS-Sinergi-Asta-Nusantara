import { prisma } from "@/lib/prisma";
import { VacancyStatus } from "@/generated/prisma/client";

// ─── Vacancy Queries ───────────────────────────────────────────────────

export async function getVacancies(status?: VacancyStatus) {
  return prisma.vacancy.findMany({
    where: status ? { status } : undefined,
    include: { department: true, _count: { select: { candidates: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getVacanciesWithPipeline(status?: VacancyStatus) {
  return prisma.vacancy.findMany({
    where: status ? { status } : undefined,
    include: {
      department: true,
      _count: { select: { candidates: true } },
      candidates: { select: { stage: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getVacancyById(id: string) {
  return prisma.vacancy.findUnique({
    where: { id },
    include: {
      department: true,
      candidates: {
        include: { interviews: { orderBy: { scheduledAt: "desc" } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getOpenVacancyCount() {
  return prisma.vacancy.count({ where: { status: "OPEN" } });
}

// ─── Candidate Queries ─────────────────────────────────────────────────

export async function getCandidateById(id: string) {
  return prisma.candidate.findUnique({
    where: { id },
    include: {
      vacancy: { include: { department: true } },
      interviews: { orderBy: { scheduledAt: "asc" } },
    },
  });
}

// ─── Stats Summary ─────────────────────────────────────────────────────

export interface RecruitmentStatsSummary {
  openVacancies: number;
  closedVacancies: number;
  totalCandidates: number;
  upcomingInterviews: number;
  hiredThisMonth: number;
}

export async function getRecruitmentStatsSummary(): Promise<RecruitmentStatsSummary> {
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );

  const [
    openVacancies,
    closedVacancies,
    totalCandidates,
    upcomingInterviews,
    hiredThisMonth,
  ] = await Promise.all([
    prisma.vacancy.count({ where: { status: "OPEN" } }),
    prisma.vacancy.count({ where: { status: "CLOSED" } }),
    prisma.candidate.count(),
    prisma.interview.count({ where: { scheduledAt: { gte: now } } }),
    prisma.candidate.count({
      where: { stage: "DITERIMA", hiredAt: { gte: monthStart } },
    }),
  ]);

  return {
    openVacancies,
    closedVacancies,
    totalCandidates,
    upcomingInterviews,
    hiredThisMonth,
  };
}

// ─── Type Helpers ──────────────────────────────────────────────────────

export type VacancyWithCounts = Awaited<ReturnType<typeof getVacancies>>[number];
export type VacancyWithPipeline = Awaited<ReturnType<typeof getVacanciesWithPipeline>>[number];
export type VacancyDetail = NonNullable<Awaited<ReturnType<typeof getVacancyById>>>;
export type CandidateDetail = NonNullable<Awaited<ReturnType<typeof getCandidateById>>>;
