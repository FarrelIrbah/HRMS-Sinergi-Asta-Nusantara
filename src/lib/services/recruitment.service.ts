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

// ─── Type Helpers ──────────────────────────────────────────────────────

export type VacancyWithCounts = Awaited<ReturnType<typeof getVacancies>>[number];
export type VacancyDetail = NonNullable<Awaited<ReturnType<typeof getVacancyById>>>;
export type CandidateDetail = NonNullable<Awaited<ReturnType<typeof getCandidateById>>>;
