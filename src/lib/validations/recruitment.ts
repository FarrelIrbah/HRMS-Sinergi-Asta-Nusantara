import { z } from "zod";

// Vacancy schemas
export const createVacancySchema = z.object({
  title: z.string().min(1, "Judul posisi wajib diisi"),
  departmentId: z.string().min(1, "Departemen wajib dipilih"),
  description: z.string().min(1, "Deskripsi pekerjaan wajib diisi"),
  requirements: z.string().min(1, "Persyaratan wajib diisi"),
  openDate: z.coerce.date(),
  closeDate: z.coerce.date().optional(),
});
export type CreateVacancyInput = z.infer<typeof createVacancySchema>;

export const updateVacancySchema = createVacancySchema.partial();
export type UpdateVacancyInput = z.infer<typeof updateVacancySchema>;

// Candidate schemas
export const createCandidateSchema = z.object({
  name: z.string().min(1, "Nama kandidat wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  phone: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;

export const updateCandidateStageSchema = z.object({
  stage: z.enum([
    "MELAMAR",
    "SELEKSI_BERKAS",
    "INTERVIEW",
    "PENAWARAN",
    "DITERIMA",
    "DITOLAK",
  ]),
});
export type UpdateCandidateStageInput = z.infer<
  typeof updateCandidateStageSchema
>;

export const updateOfferSchema = z.object({
  offerSalary: z.coerce.number().positive().optional(),
  offerNotes: z.string().optional(),
});
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;

// Interview schema
export const createInterviewSchema = z.object({
  scheduledAt: z.coerce.date(),
  interviewerName: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;
