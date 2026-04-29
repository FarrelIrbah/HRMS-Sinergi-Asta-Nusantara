"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  FileDown,
  Loader2,
  Upload,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { importPayrollAction } from "@/lib/actions/payroll.actions";

const MONTH_LABELS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const YEAR_OPTIONS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

export function ImportPayrollForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  function handleFileSelect(picked: File | undefined) {
    if (!picked) return;
    const ok = [".xlsx", ".xls", ".csv"].some((ext) =>
      picked.name.toLowerCase().endsWith(ext)
    );
    if (!ok) {
      toast.error("Format file harus .xlsx, .xls, atau .csv");
      return;
    }
    setFile(picked);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Pilih file terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("month", String(month));
      fd.set("year", String(year));
      fd.set("file", file);

      const result = await importPayrollAction(fd);
      if (!result.success) {
        toast.error(result.error ?? "Import gagal");
        return;
      }

      toast.success(
        `Import berhasil — ${result.data?.entryCount ?? 0} baris karyawan`
      );
      router.push(`/payroll/${result.data?.payrollRunId}`);
    } catch {
      toast.error("Terjadi kesalahan yang tidak terduga");
    } finally {
      setLoading(false);
    }
  }

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const periodLabel = `${MONTH_LABELS[month - 1]} ${year}`;
  const templateUrl = `/api/payroll/template?month=${month}&year=${year}`;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      aria-label="Form impor penggajian"
    >
      {/* ── Period selector ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label
            htmlFor="payroll-month"
            className="text-xs font-medium text-slate-700"
          >
            Bulan
          </Label>
          <Select
            value={String(month)}
            onValueChange={(v) => setMonth(parseInt(v, 10))}
            disabled={loading}
          >
            <SelectTrigger
              id="payroll-month"
              className="border-slate-200 bg-white"
            >
              <SelectValue placeholder="Pilih bulan" />
            </SelectTrigger>
            <SelectContent>
              {MONTH_LABELS.map((label, idx) => (
                <SelectItem key={idx + 1} value={String(idx + 1)}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="payroll-year"
            className="text-xs font-medium text-slate-700"
          >
            Tahun
          </Label>
          <Select
            value={String(year)}
            onValueChange={(v) => setYear(parseInt(v, 10))}
            disabled={loading}
          >
            <SelectTrigger
              id="payroll-year"
              className="border-slate-200 bg-white"
            >
              <SelectValue placeholder="Pilih tahun" />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <a
            href={templateUrl}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full gap-2 border-slate-200 bg-white"
            )}
            aria-label={`Unduh template Excel periode ${periodLabel}`}
          >
            <FileDown className="h-4 w-4" aria-hidden="true" />
            Unduh Template
          </a>
        </div>
      </div>

      {/* ── Dropzone ────────────────────────────────────────────── */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFileSelect(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          dragOver
            ? "border-emerald-400 bg-emerald-50/40"
            : "border-slate-200 bg-slate-50/40 hover:border-slate-300"
        )}
        role="region"
        aria-label="Area unggah file"
      >
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-slate-900">{file.name}</p>
            <p className="text-xs text-slate-500">
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearFile}
              disabled={loading}
              className="mt-1"
            >
              Ganti file
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              Tarik & lepas file Excel/CSV di sini
            </p>
            <p className="text-xs text-slate-500">atau</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="gap-2"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Pilih file
            </Button>
            <p className="mt-1 text-[11px] text-slate-400">
              Format yang didukung: .xlsx, .xls, .csv
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="sr-only"
          aria-hidden="true"
          onChange={(e) => handleFileSelect(e.target.files?.[0] ?? undefined)}
        />
      </div>

      {/* ── Hint banner ─────────────────────────────────────────── */}
      <div
        className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900"
        role="note"
      >
        <AlertCircle
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
          aria-hidden="true"
        />
        <p className="leading-relaxed">
          Pastikan file menggunakan template resmi (klik <em>Unduh Template</em>{" "}
          di atas). NIK harus sesuai dengan karyawan aktif. Sistem akan memvalidasi
          struktur dan data sebelum disimpan sebagai DRAFT.
        </p>
      </div>

      {/* ── Submit ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          Periode tujuan: <span className="font-medium text-slate-800">{periodLabel}</span>
        </p>
        <Button
          type="submit"
          disabled={loading || !file}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="h-4 w-4" aria-hidden="true" />
          )}
          {loading ? "Mengimpor..." : "Impor Penggajian"}
        </Button>
      </div>
    </form>
  );
}
