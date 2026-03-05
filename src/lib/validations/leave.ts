import { z } from "zod";

export const submitLeaveSchema = z
  .object({
    leaveTypeId: z.string().min(1, "Jenis cuti wajib dipilih"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z
      .string()
      .min(1, "Alasan wajib diisi")
      .max(500, "Alasan maksimal 500 karakter"),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "Tanggal akhir harus sama atau setelah tanggal mulai",
    path: ["endDate"],
  });

export type SubmitLeaveInput = z.infer<typeof submitLeaveSchema>;

export const approveLeaveSchema = z.object({
  leaveRequestId: z.string().min(1),
  notes: z.string().optional().or(z.literal("")),
});

export type ApproveLeaveInput = z.infer<typeof approveLeaveSchema>;

export const rejectLeaveSchema = z.object({
  leaveRequestId: z.string().min(1),
  notes: z.string().min(1, "Alasan penolakan wajib diisi"),
});

export type RejectLeaveInput = z.infer<typeof rejectLeaveSchema>;
