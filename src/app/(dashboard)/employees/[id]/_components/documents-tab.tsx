"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Eye,
  FileText,
  Loader2,
  Trash2,
  Upload,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants";
import type { DocumentType } from "@/types/enums";

interface SerializedDocument {
  id: string;
  employeeId: string;
  documentType: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
}

interface DocumentsTabProps {
  employeeId: string;
  documents: SerializedDocument[];
  readOnly: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsTab({
  employeeId,
  documents,
  readOnly,
}: DocumentsTabProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SerializedDocument | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Pilih file terlebih dahulu");
      return;
    }
    if (!selectedType) {
      toast.error("Pilih tipe dokumen terlebih dahulu");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", selectedType);

      const response = await fetch(
        `/api/employees/${employeeId}/documents`,
        { method: "POST", body: formData }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.error ?? "Gagal mengunggah dokumen");
        return;
      }

      toast.success("Dokumen berhasil diunggah");
      router.refresh();

      // Reset inputs
      setSelectedType("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengunggah dokumen");
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(doc: SerializedDocument) {
    setDownloadingId(doc.id);
    try {
      const response = await fetch(
        `/api/employees/${employeeId}/documents/${doc.id}`
      );

      if (!response.ok) {
        toast.error("Gagal mengunduh dokumen");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Terjadi kesalahan saat mengunduh dokumen");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/employees/${employeeId}/documents/${deleteTarget.id}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.error ?? "Gagal menghapus dokumen");
        return;
      }

      toast.success("Dokumen berhasil dihapus");
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan saat menghapus dokumen");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/50 py-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-100"
            aria-hidden="true"
          >
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Dokumen Karyawan
            </CardTitle>
            <CardDescription className="mt-0.5 text-sm text-slate-500">
              KTP, KK, ijazah, kontrak kerja, dan dokumen pendukung lainnya.
            </CardDescription>
          </div>
        </div>
        {readOnly && (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
            <Eye className="h-3 w-3" aria-hidden="true" />
            Baca
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-5 p-5 md:p-6">
        {/* Upload Section */}
        {!readOnly && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-4">
            <div className="mb-3 flex items-center gap-2">
              <UploadCloud
                className="h-4 w-4 text-emerald-600"
                aria-hidden="true"
              />
              <h4 className="text-sm font-medium text-slate-800">
                Unggah Dokumen Baru
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="documentType"
                  className="text-xs font-medium text-slate-600"
                >
                  Tipe Dokumen
                </Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger id="documentType" className="bg-white">
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOCUMENT_TYPE_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="file"
                  className="text-xs font-medium text-slate-600"
                >
                  File (PDF, JPG, PNG, maks 5MB)
                </Label>
                <Input
                  id="file"
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="bg-white"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Upload className="h-4 w-4" aria-hidden="true" />
                  )}
                  {uploading ? "Mengunggah..." : "Unggah Dokumen"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Document List */}
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/40 px-4 py-10 text-center">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400"
              aria-hidden="true"
            >
              <FileText className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              Belum ada dokumen
            </p>
            <p className="max-w-xs text-xs text-slate-500">
              {readOnly
                ? "Belum ada dokumen yang diunggah untuk karyawan ini."
                : "Gunakan form di atas untuk mengunggah dokumen pertama."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Tipe Dokumen
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Nama File
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Ukuran
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Tanggal Upload
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-slate-50/60">
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
                        {DOCUMENT_TYPE_LABELS[
                          doc.documentType as DocumentType
                        ] ?? doc.documentType}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-medium text-slate-800">
                      {doc.fileName}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-slate-600">
                      {formatFileSize(doc.fileSize)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {format(new Date(doc.createdAt), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          onClick={() => handleDownload(doc)}
                          disabled={downloadingId === doc.id}
                          aria-label={`Unduh ${doc.fileName}`}
                        >
                          {downloadingId === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => setDeleteTarget(doc)}
                            aria-label={`Hapus ${doc.fileName}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Hapus Dokumen"
          description={`Apakah Anda yakin ingin menghapus dokumen "${deleteTarget?.fileName}"? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={handleDelete}
          confirmText="Hapus"
          variant="destructive"
          loading={deleting}
        />
      </CardContent>
    </Card>
  );
}
