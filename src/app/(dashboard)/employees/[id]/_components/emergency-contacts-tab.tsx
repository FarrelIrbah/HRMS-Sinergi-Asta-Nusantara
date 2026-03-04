"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Phone, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Kontak Darurat
          </CardTitle>
          {!readOnly && contacts.length < 3 && !isFormOpen && (
            <Button size="sm" onClick={handleAddClick}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Kontak Darurat
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            Belum ada kontak darurat. Tambahkan kontak darurat karyawan.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="rounded-lg border bg-card p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{contact.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {contact.relationship}
                    </p>
                  </div>
                  {!readOnly && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditClick(contact)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => setDeleteTarget(contact)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{contact.phone}</span>
                  </div>
                  {contact.address && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{contact.address}</span>
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
    <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
      <h4 className="text-sm font-medium">
        {isEdit ? "Edit Kontak Darurat" : "Tambah Kontak Darurat"}
      </h4>
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
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isSubmitting}>
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
