"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Download, Trash2, FileText, Loader2 } from "lucide-react";
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Dokumen Karyawan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Section */}
        {!readOnly && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
            <h4 className="text-sm font-medium">Unggah Dokumen Baru</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="documentType">Tipe Dokumen</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger id="documentType">
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOCUMENT_TYPE_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">File (PDF, JPG, PNG, maks 5MB)</Label>
                <Input
                  id="file"
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {uploading ? "Mengunggah..." : "Unggah Dokumen"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Document List */}
        {documents.length === 0 ? (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            Belum ada dokumen yang diunggah
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipe Dokumen</TableHead>
                  <TableHead>Nama File</TableHead>
                  <TableHead>Ukuran</TableHead>
                  <TableHead>Tanggal Upload</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      {DOCUMENT_TYPE_LABELS[
                        doc.documentType as DocumentType
                      ] ?? doc.documentType}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {doc.fileName}
                    </TableCell>
                    <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                    <TableCell>
                      {format(new Date(doc.createdAt), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          disabled={downloadingId === doc.id}
                        >
                          {downloadingId === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        {!readOnly && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteTarget(doc)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
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
