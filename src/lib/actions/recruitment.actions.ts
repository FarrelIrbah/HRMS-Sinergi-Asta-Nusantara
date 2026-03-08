"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma, createAuditLog } from "@/lib/prisma";
import { CandidateStage, VacancyStatus } from "@/generated/prisma/client";
import {
  createVacancySchema,
  updateVacancySchema,
  createCandidateSchema,
  updateCandidateStageSchema,
  updateOfferSchema,
  createInterviewSchema,
} from "@/lib/validations/recruitment";

type ActionResult<T = undefined> = T extends undefined
  ? { success: boolean; error?: string }
  : { success: true; data: T } | { success: false; error: string };

// ─── Auth Helper ───────────────────────────────────────────────────────

async function requireHRAdmin(): Promise<
  { success: true; userId: string } | { success: false; error: string }
> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Sesi tidak valid" };
  const role = session.user.role;
  if (role !== "HR_ADMIN" && role !== "SUPER_ADMIN") {
    return { success: false, error: "Akses ditolak" };
  }
  return { success: true, userId: session.user.id };
}

// ─── Vacancy Actions ───────────────────────────────────────────────────

export async function createVacancyAction(
  data: unknown
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireHRAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const parsed = createVacancySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validasi gagal" };
  }

  try {
    const vacancy = await prisma.vacancy.create({ data: parsed.data });
    await createAuditLog({
      userId: auth.userId,
      action: "CREATE",
      module: "Lowongan",
      targetId: vacancy.id,
      newValue: { title: parsed.data.title, departmentId: parsed.data.departmentId },
    });
    revalidatePath("/recruitment");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal membuat lowongan" };
  }
}

export async function updateVacancyAction(
  id: string,
  data: unknown
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireHRAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const parsed = updateVacancySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validasi gagal" };
  }

  try {
    await prisma.vacancy.update({ where: { id }, data: parsed.data });
    await createAuditLog({
      userId: auth.userId,
      action: "UPDATE",
      module: "Lowongan",
      targetId: id,
      newValue: parsed.data as Record<string, unknown>,
    });
    revalidatePath("/recruitment");
    revalidatePath(`/recruitment/${id}`);
    return { success: true };
  } catch {
    return { success: false, error: "Gagal memperbarui lowongan" };
  }
}

export async function toggleVacancyStatusAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireHRAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  try {
    const vacancy = await prisma.vacancy.findUniqueOrThrow({ where: { id } });
    const newStatus: VacancyStatus = vacancy.status === "OPEN" ? "CLOSED" : "OPEN";
    await prisma.vacancy.update({ where: { id }, data: { status: newStatus } });
    await createAuditLog({
      userId: auth.userId,
      action: "UPDATE",
      module: "Lowongan",
      targetId: id,
      newValue: { status: newStatus },
    });
    revalidatePath("/recruitment");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal mengubah status lowongan" };
  }
}

// ─── Candidate Actions ─────────────────────────────────────────────────

export async function createCandidateAction(
  vacancyId: string,
  data: unknown
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireHRAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const parsed = createCandidateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validasi gagal" };
  }

  try {
    const candidate = await prisma.candidate.create({
      data: { ...parsed.data, vacancyId },
    });
    await createAuditLog({
      userId: auth.userId,
      action: "CREATE",
      module: "Kandidat",
      targetId: candidate.id,
      newValue: { ...parsed.data, vacancyId } as Record<string, unknown>,
    });
    revalidatePath(`/recruitment/${vacancyId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menambah kandidat" };
  }
}

export async function updateCandidateStageAction(
  candidateId: string,
  data: unknown
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireHRAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const parsed = updateCandidateStageSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validasi gagal" };
  }

  try {
    const candidate = await prisma.candidate.update({
      where: { id: candidateId },
      data: { stage: parsed.data.stage as CandidateStage },
    });
    await createAuditLog({
      userId: auth.userId,
      action: "UPDATE",
      module: "Kandidat",
      targetId: candidateId,
      newValue: { stage: parsed.data.stage },
    });
    revalidatePath(`/recruitment/${candidate.vacancyId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Gagal memperbarui tahap kandidat" };
  }
}

export async function updateOfferAction(
  candidateId: string,
  data: unknown
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireHRAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const parsed = updateOfferSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validasi gagal" };
  }

  try {
    await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        offerSalary: parsed.data.offerSalary ?? null,
        offerNotes: parsed.data.offerNotes ?? null,
      },
    });
    revalidatePath(`/recruitment/candidates/${candidateId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menyimpan data penawaran" };
  }
}

// ─── Interview Actions ─────────────────────────────────────────────────

export async function createInterviewAction(
  candidateId: string,
  data: unknown
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireHRAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const parsed = createInterviewSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validasi gagal" };
  }

  try {
    await prisma.interview.create({
      data: { ...parsed.data, candidateId },
    });
    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    revalidatePath(`/recruitment/candidates/${candidateId}`);
    if (candidate) revalidatePath(`/recruitment/${candidate.vacancyId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menjadwalkan wawancara" };
  }
}

// ─── Conversion Action ─────────────────────────────────────────────────

export async function convertCandidateToEmployeeAction(
  candidateId: string
): Promise<
  | { success: true; prefill: { fullName: string; email: string; phone: string; departmentId: string; cvPath: string | null; candidateId: string } }
  | { success: false; error: string }
> {
  const auth = await requireHRAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  try {
    const candidate = await prisma.candidate.findUniqueOrThrow({
      where: { id: candidateId },
      include: { vacancy: { include: { department: true } } },
    });

    if (candidate.stage !== "DITERIMA") {
      return { success: false, error: "Hanya kandidat dengan status Diterima yang dapat dikonversi" };
    }

    await prisma.candidate.update({
      where: { id: candidateId },
      data: { hiredAt: new Date() },
    });

    await createAuditLog({
      userId: auth.userId,
      action: "UPDATE",
      module: "Kandidat",
      targetId: candidateId,
      newValue: { hiredAt: new Date().toISOString(), converted: true },
    });

    const prefill = {
      fullName: candidate.name,
      email: candidate.email,
      phone: candidate.phone ?? "",
      departmentId: candidate.vacancy.departmentId,
      cvPath: candidate.cvPath,
      candidateId: candidate.id,
    };

    return { success: true, prefill };
  } catch {
    return { success: false, error: "Gagal memproses konversi kandidat" };
  }
}
