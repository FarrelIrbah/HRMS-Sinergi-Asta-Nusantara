"use client";

import { useEffect, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  officeLocationSchema,
  type OfficeLocationInput,
} from "@/lib/validations/master-data";
import {
  createOfficeLocationAction,
  updateOfficeLocationAction,
} from "@/lib/actions/master-data.actions";

interface OfficeLocation {
  id: string;
  name: string;
  address: string | null;
  allowedIPs: string[];
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number | null;
}

interface OfficeLocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: OfficeLocation | null;
  onSuccess: () => void;
}

// Internal form type with array-of-objects for useFieldArray
interface FormValues {
  name: string;
  address: string;
  ipList: { value: string }[];
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number | null;
}

export function OfficeLocationFormDialog({
  open,
  onOpenChange,
  location,
  onSuccess,
}: OfficeLocationFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!location;

  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      address: "",
      ipList: [{ value: "" }],
      latitude: null,
      longitude: null,
      radiusMeters: null,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ipList",
  });

  useEffect(() => {
    if (open) {
      if (location) {
        form.reset({
          name: location.name,
          address: location.address || "",
          ipList:
            location.allowedIPs.length > 0
              ? location.allowedIPs.map((ip) => ({ value: ip }))
              : [{ value: "" }],
          latitude: location.latitude,
          longitude: location.longitude,
          radiusMeters: location.radiusMeters,
        });
      } else {
        form.reset({
          name: "",
          address: "",
          ipList: [{ value: "" }],
          latitude: null,
          longitude: null,
          radiusMeters: null,
        });
      }
    }
  }, [open, location, form]);

  const onSubmit = (formValues: FormValues) => {
    // Transform to schema shape
    const data: OfficeLocationInput = {
      name: formValues.name,
      address: formValues.address || undefined,
      allowedIPs: formValues.ipList
        .map((ip) => ip.value.trim())
        .filter((v) => v.length > 0),
      latitude: formValues.latitude,
      longitude: formValues.longitude,
      radiusMeters: formValues.radiusMeters,
    };

    // Validate with Zod
    const result = officeLocationSchema.safeParse(data);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message || "Data tidak valid");
      return;
    }

    startTransition(async () => {
      const actionResult = isEditing
        ? await updateOfficeLocationAction(location.id, data)
        : await createOfficeLocationAction(data);

      if (actionResult.success) {
        toast.success(
          isEditing
            ? "Lokasi kantor berhasil diubah"
            : "Lokasi kantor berhasil dibuat"
        );
        onSuccess();
      } else {
        toast.error(actionResult.error || "Terjadi kesalahan");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Lokasi Kantor" : "Tambah Lokasi Kantor"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Ubah informasi lokasi kantor."
              : "Tambahkan lokasi kantor baru ke sistem."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Nama lokasi wajib diisi" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama lokasi kantor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat (opsional)</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Alamat lengkap lokasi kantor"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* IP Range Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Rentang IP</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ value: "" })}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Tambah IP
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Masukkan alamat IP atau rentang CIDR yang diizinkan. Opsional.
              </p>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`ipList.${index}.value`}
                    render={({ field: inputField }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="192.168.1.0/24"
                            {...inputField}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Separator />

            {/* GPS Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Koordinat GPS</h4>
              <p className="text-xs text-muted-foreground">
                Masukkan koordinat GPS dan radius untuk validasi lokasi.
                Opsional.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="-6.2088"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? null
                                : parseFloat(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="106.8456"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? null
                                : parseFloat(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="radiusMeters"
                rules={{
                  validate: (value) =>
                    value === null ||
                    value === undefined ||
                    value >= 50 ||
                    "Radius minimal 50 meter",
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Radius (meter)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={50}
                        placeholder="100"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? null
                              : parseInt(e.target.value, 10)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
