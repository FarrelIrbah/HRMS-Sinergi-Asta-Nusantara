"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import {
  createInterviewAction,
  updateOfferAction,
  convertCandidateToEmployeeAction,
} from "@/lib/actions/recruitment.actions";
import {
  createInterviewSchema,
  type CreateInterviewInput,
  updateOfferSchema,
  type UpdateOfferInput,
} from "@/lib/validations/recruitment";
import { CandidateStage } from "@/types/enums";

// Type for serialized candidate (dates as ISO strings, offerSalary as string | null)
interface SerializedInterview {
  id: string;
  scheduledAt: string;
  interviewerName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  candidateId: string;
}

interface SerializedCandidate {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  stage: string;
  cvPath: string | null;
  notes: string | null;
  offerSalary: string | null;
  offerNotes: string | null;
  hiredAt: string | null;
  vacancyId: string;
  vacancy: {
    id: string;
    title: string;
    department: { name: string };
  };
  interviews: SerializedInterview[];
  createdAt: string;
  updatedAt: string;
}

const STAGE_LABELS: Record<string, string> = {
  MELAMAR: "Melamar",
  SELEKSI_BERKAS: "Seleksi Berkas",
  INTERVIEW: "Interview",
  PENAWARAN: "Penawaran",
  DITERIMA: "Diterima",
  DITOLAK: "Ditolak",
};

interface Props {
  candidate: SerializedCandidate;
}

export function CandidateDetailClient({ candidate }: Props) {
  const router = useRouter();
  const [cvUploading, setCvUploading] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);
  const [interviewError, setInterviewError] = useState<string | null>(null);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Interview form
  const interviewForm = useForm<CreateInterviewInput>({
    resolver: zodResolver(createInterviewSchema) as Resolver<CreateInterviewInput>,
    defaultValues: { interviewerName: "", notes: "" },
  });

  // Offer form
  const offerForm = useForm<UpdateOfferInput>({
    resolver: zodResolver(updateOfferSchema) as Resolver<UpdateOfferInput>,
    defaultValues: {
      offerSalary: candidate.offerSalary ? parseFloat(candidate.offerSalary) : undefined,
      offerNotes: candidate.offerNotes ?? "",
    },
  });

  // CV Upload
  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCvError(null);
    setCvUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("candidateId", candidate.id);
      const res = await fetch("/api/recruitment/cv", { method: "POST", body: formData });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) setCvError(data.error ?? "Upload gagal");
      else router.refresh();
    } catch {
      setCvError("Upload gagal");
    } finally {
      setCvUploading(false);
    }
  };

  // Interview submit
  const onInterviewSubmit = (data: CreateInterviewInput) => {
    setInterviewError(null);
    startTransition(async () => {
      const result = await createInterviewAction(candidate.id, data);
      if (result.error) setInterviewError(result.error);
      else {
        interviewForm.reset();
        router.refresh();
      }
    });
  };

  // Offer submit
  const onOfferSubmit = (data: UpdateOfferInput) => {
    setOfferError(null);
    startTransition(async () => {
      const result = await updateOfferAction(candidate.id, data);
      if (result.error) setOfferError(result.error);
      else router.refresh();
    });
  };

  // Convert to employee
  const handleConvert = () => {
    startTransition(async () => {
      const result = await convertCandidateToEmployeeAction(candidate.id);
      if (!result.success) {
        alert(result.error);
      } else {
        const params = new URLSearchParams({
          fullName: result.prefill.fullName,
          email: result.prefill.email,
          phone: result.prefill.phone ?? "",
          departmentId: result.prefill.departmentId,
          candidateId: result.prefill.candidateId,
        });
        router.push(`/employees/new?${params.toString()}`);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{candidate.name}</h1>
          <p className="text-muted-foreground">{candidate.email}</p>
          {candidate.phone && <p className="text-sm text-muted-foreground">{candidate.phone}</p>}
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
              {STAGE_LABELS[candidate.stage] ?? candidate.stage}
            </span>
            <span className="text-sm text-muted-foreground">
              {candidate.vacancy.title} · {candidate.vacancy.department.name}
            </span>
          </div>
        </div>
        {candidate.stage === CandidateStage.DITERIMA && !candidate.hiredAt && (
          <button
            onClick={handleConvert}
            disabled={isPending}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isPending ? "Memproses..." : "Konversi ke Karyawan"}
          </button>
        )}
      </div>

      {/* Notes */}
      {candidate.notes && (
        <div>
          <h2 className="text-base font-semibold mb-2">Catatan</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{candidate.notes}</p>
        </div>
      )}

      {/* CV Upload */}
      <div>
        <h2 className="text-base font-semibold mb-2">CV / Dokumen</h2>
        {candidate.cvPath ? (
          <div className="flex items-center gap-3">
            <a
              href={candidate.cvPath}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Lihat CV
            </a>
            <span className="text-muted-foreground text-sm">·</span>
            <label className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Ganti CV
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleCvUpload} />
            </label>
          </div>
        ) : (
          <label className="cursor-pointer inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
            {cvUploading ? "Mengunggah..." : "Upload CV"}
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleCvUpload}
              disabled={cvUploading}
            />
          </label>
        )}
        {cvError && <p className="text-sm text-red-500 mt-1">{cvError}</p>}
      </div>

      {/* Interviews */}
      <div>
        <h2 className="text-base font-semibold mb-3">Jadwal Wawancara</h2>
        {candidate.interviews.length > 0 ? (
          <div className="space-y-2 mb-4">
            {candidate.interviews.map((interview) => (
              <div key={interview.id} className="rounded-md border p-3 text-sm">
                <div className="font-medium">
                  {new Date(interview.scheduledAt).toLocaleString("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
                {interview.interviewerName && (
                  <div className="text-muted-foreground">Pewawancara: {interview.interviewerName}</div>
                )}
                {interview.notes && <div className="text-muted-foreground mt-1">{interview.notes}</div>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">Belum ada jadwal wawancara</p>
        )}

        {/* Add interview form */}
        <form onSubmit={interviewForm.handleSubmit(onInterviewSubmit)} className="space-y-3 max-w-sm">
          <h3 className="text-sm font-medium">Tambah Jadwal</h3>
          <div>
            <label className="text-xs text-muted-foreground">Tanggal &amp; Waktu</label>
            <input
              type="datetime-local"
              {...interviewForm.register("scheduledAt")}
              className="mt-1 block w-full rounded-md border px-3 py-1.5 text-sm"
            />
            {interviewForm.formState.errors.scheduledAt && (
              <p className="text-xs text-red-500">{interviewForm.formState.errors.scheduledAt.message}</p>
            )}
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Pewawancara (opsional)</label>
            <input
              type="text"
              {...interviewForm.register("interviewerName")}
              className="mt-1 block w-full rounded-md border px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Catatan (opsional)</label>
            <textarea
              {...interviewForm.register("notes")}
              rows={2}
              className="mt-1 block w-full rounded-md border px-3 py-1.5 text-sm"
            />
          </div>
          {interviewError && <p className="text-xs text-red-500">{interviewError}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {isPending ? "Menyimpan..." : "Simpan Jadwal"}
          </button>
        </form>
      </div>

      {/* Offer Fields (only shown for PENAWARAN or DITERIMA stage) */}
      {(candidate.stage === CandidateStage.PENAWARAN || candidate.stage === CandidateStage.DITERIMA) && (
        <div>
          <h2 className="text-base font-semibold mb-3">Penawaran</h2>
          <form onSubmit={offerForm.handleSubmit(onOfferSubmit)} className="space-y-3 max-w-sm">
            <div>
              <label className="text-xs text-muted-foreground">Gaji Ditawarkan (opsional)</label>
              <input
                type="number"
                {...offerForm.register("offerSalary")}
                className="mt-1 block w-full rounded-md border px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Catatan Penawaran (opsional)</label>
              <textarea
                {...offerForm.register("offerNotes")}
                rows={3}
                className="mt-1 block w-full rounded-md border px-3 py-1.5 text-sm"
              />
            </div>
            {offerError && <p className="text-xs text-red-500">{offerError}</p>}
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {isPending ? "Menyimpan..." : "Simpan Penawaran"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
