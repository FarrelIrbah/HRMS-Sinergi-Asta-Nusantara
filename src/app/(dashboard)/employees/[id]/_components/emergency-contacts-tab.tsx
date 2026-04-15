"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  MapPin,
  Pencil,
  Phone,
  PhoneCall,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  emergencyContactSchema,
  type EmergencyContactInput,
} from "@/lib/validations/employee";
import {
  createEmergencyContactAction,
  updateEmergencyContactAction,
  deleteEmergencyContactAction,
} from "@/lib/actions/employee-document.actions";

interface SerializedContact {
  id: string;
  employeeId: string;
  name: string;
  relationship: string;
  phone: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EmergencyContactsTabProps {
  employeeId: string;
  contacts: SerializedContact[];
  readOnly: boolean;
}

export function EmergencyContactsTab({
  employeeId,
  contacts,
  readOnly,
}: EmergencyContactsTabProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] =
    useState<SerializedContact | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SerializedContact | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const isFormOpen = showForm || !!editingContact;

  function handleAddClick() {
    setEditingContact(null);
    setShowForm(true);
  }

  function handleEditClick(contact: SerializedContact) {
    setShowForm(false);
    setEditingContact(contact);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingContact(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const result = await deleteEmergencyContactAction(
        deleteTarget.id,
        employeeId
      );

      if (!result.success) {
        toast.error(result.error ?? "Gagal menghapus kontak darurat");
        return;
      }

      toast.success("Kontak darurat berhasil dihapus");
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan saat menghapus kontak darurat");
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700 ring-1 ring-rose-100"
            aria-hidden="true"
          >
            <PhoneCall className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Kontak Darurat
            </CardTitle>
            <CardDescription className="mt-0.5 text-sm text-slate-500">
              Pihak yang dapat dihubungi dalam keadaan darurat. Maksimal 3
              kontak.
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {readOnly ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
              <Eye className="h-3 w-3" aria-hidden="true" />
              Baca
            </span>
          ) : (
            contacts.length < 3 &&
            !isFormOpen && (
              <Button
                size="sm"
                onClick={handleAddClick}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Tambah Kontak
              </Button>
            )
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5 md:p-6">
        {/* Add/Edit Form */}
        {isFormOpen && (
          <EmergencyContactForm
            employeeId={employeeId}
            contact={editingContact}
            onClose={handleCloseForm}
          />
        )}

        {/* Contact Cards */}
        {contacts.length === 0 && !isFormOpen ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/40 px-4 py-10 text-center">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-500"
              aria-hidden="true"
            >
              <Users className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              Belum ada kontak darurat
            </p>
            <p className="max-w-xs text-xs text-slate-500">
              {readOnly
                ? "Karyawan ini belum mendaftarkan kontak darurat."
                : "Tambahkan hingga 3 kontak yang dapat dihubungi dalam keadaan darurat."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="group relative flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-semibold text-slate-900">
                      {contact.name}
                    </h4>
                    <p className="mt-0.5 inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-rose-100">
                      {contact.relationship}
                    </p>
                  </div>
                  {!readOnly && (
                    <div className="flex shrink-0 gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        onClick={() => handleEditClick(contact)}
                        aria-label={`Edit kontak ${contact.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => setDeleteTarget(contact)}
                        aria-label={`Hapus kontak ${contact.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 border-t border-slate-100 pt-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone
                      className="h-3.5 w-3.5 text-slate-400"
                      aria-hidden="true"
                    />
                    <a
                      href={`tel:${contact.phone}`}
                      className="font-mono tabular-nums hover:text-emerald-700 hover:underline"
                    >
                      {contact.phone}
                    </a>
                  </div>
                  {contact.address && (
                    <div className="flex items-start gap-2 text-slate-600">
                      <MapPin
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400"
                        aria-hidden="true"
                      />
                      <span className="text-xs leading-relaxed">
                        {contact.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Hapus Kontak Darurat"
          description={`Apakah Anda yakin ingin menghapus kontak darurat "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={handleDelete}
          confirmText="Hapus"
          variant="destructive"
          loading={deleting}
        />
      </CardContent>
    </Card>
  );
}

// ─── Inline Form Component ──────────────────────────────────────────

interface EmergencyContactFormProps {
  employeeId: string;
  contact: SerializedContact | null;
  onClose: () => void;
}

function EmergencyContactForm({
  employeeId,
  contact,
  onClose,
}: EmergencyContactFormProps) {
  const router = useRouter();
  const isEdit = !!contact;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmergencyContactInput>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: contact
      ? {
          name: contact.name,
          relationship: contact.relationship,
          phone: contact.phone,
          address: contact.address ?? "",
        }
      : {
          name: "",
          relationship: "",
          phone: "",
          address: "",
        },
  });

  async function onSubmit(data: EmergencyContactInput) {
    try {
      const result = isEdit
        ? await updateEmergencyContactAction(contact.id, employeeId, data)
        : await createEmergencyContactAction(employeeId, data);

      if (!result.success) {
        toast.error(
          result.error ?? "Gagal menyimpan kontak darurat"
        );
        return;
      }

      toast.success(
        isEdit
          ? "Kontak darurat berhasil diperbarui"
          : "Kontak darurat berhasil ditambahkan"
      );
      router.refresh();
      onClose();
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan kontak darurat");
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
          {isEdit ? (
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </span>
        <h4 className="text-sm font-medium text-slate-800">
          {isEdit ? "Edit Kontak Darurat" : "Tambah Kontak Darurat"}
        </h4>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ec-name">Nama *</Label>
            <Input
              id="ec-name"
              {...register("name")}
              placeholder="Nama kontak darurat"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ec-relationship">Hubungan *</Label>
            <Input
              id="ec-relationship"
              {...register("relationship")}
              placeholder="Suami/Istri, Orang Tua, Saudara"
            />
            {errors.relationship && (
              <p className="text-sm text-red-500">
                {errors.relationship.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ec-phone">Nomor Telepon *</Label>
            <Input
              id="ec-phone"
              {...register("phone")}
              placeholder="08xxxxxxxxxx"
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ec-address">Alamat</Label>
            <Textarea
              id="ec-address"
              {...register("address")}
              placeholder="Alamat (opsional)"
              rows={2}
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address.message}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {isSubmitting
              ? "Menyimpan..."
              : isEdit
                ? "Simpan Perubahan"
                : "Tambah Kontak"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </Button>
        </div>
      </form>
    </div>
  );
}
