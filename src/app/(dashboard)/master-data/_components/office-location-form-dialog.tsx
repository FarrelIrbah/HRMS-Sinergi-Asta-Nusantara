"use client";

import { useEffect, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import {
  Plus,
  X,
  MapPin,
  Globe,
  Navigation,
  Loader2,
  Save,
} from "lucide-react";
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
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 ring-1 ring-violet-100"
              aria-hidden="true"
            >
              <MapPin className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-slate-900">
                {isEditing ? "Edit Lokasi Kantor" : "Tambah Lokasi Kantor"}
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                {isEditing
                  ? "Perbarui informasi lokasi, rentang IP, dan koordinat GPS."
                  : "Tambahkan lokasi kantor baru dengan validasi IP dan GPS."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5"
            aria-label="Form lokasi kantor"
          >
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Nama lokasi wajib diisi" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-slate-700">Nama</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nama lokasi kantor"
                      className="border-slate-200 bg-white"
                      {...field}
                    />
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
                  <FormLabel className="text-sm text-slate-700">
                    Alamat (opsional)
                  </FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Alamat lengkap lokasi kantor"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* IP Range Section */}
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-50 text-sky-600"
                    aria-hidden="true"
                  >
                    <Globe className="h-3.5 w-3.5" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    Rentang IP
                  </h4>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-slate-200 bg-white"
                  onClick={() => append({ value: "" })}
                >
                  <Plus className="mr-1 h-3 w-3" aria-hidden="true" />
                  Tambah
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Alamat IP atau rentang CIDR yang diizinkan untuk clock-in.
                Opsional.
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
                            className="border-slate-200 bg-white font-mono text-xs"
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
                      aria-label={`Hapus IP ke-${index + 1}`}
                      className="text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* GPS Section */}
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600"
                  aria-hidden="true"
                >
                  <Navigation className="h-3.5 w-3.5" />
                </div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Koordinat GPS
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                Lokasi dan radius untuk validasi clock-in berbasis GPS.
                Opsional.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-700">
                        Latitude
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="-6.2088"
                          className="border-slate-200 bg-white"
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
                      <FormLabel className="text-sm text-slate-700">
                        Longitude
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="106.8456"
                          className="border-slate-200 bg-white"
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
                    <FormLabel className="text-sm text-slate-700">
                      Radius (meter)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={50}
                        placeholder="100"
                        className="border-slate-200 bg-white"
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
                className="border-slate-200"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="h-4 w-4" aria-hidden="true" />
                )}
                {isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
