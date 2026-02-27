"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Role } from "@/generated/prisma/client";
import { ROLES } from "@/lib/constants";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/validations/user";
import {
  createUserAction,
  updateUserAction,
} from "@/lib/actions/user.actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { UserRow } from "./user-columns";

interface UserFormDialogProps {
  mode: "create" | "edit";
  user?: UserRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const roleOptions = Object.entries(ROLES) as [Role, string][];

export function UserFormDialog({
  mode,
  user,
  open,
  onOpenChange,
  onSuccess,
}: UserFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const isCreate = mode === "create";

  const createForm = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "EMPLOYEE" as Role,
    },
  });

  const editForm = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "EMPLOYEE" as Role,
    },
  });

  // Reset form when dialog opens/closes or user changes
  useEffect(() => {
    if (open) {
      if (isCreate) {
        createForm.reset({
          name: "",
          email: "",
          password: "",
          role: "EMPLOYEE" as Role,
        });
      } else if (user) {
        editForm.reset({
          name: user.name,
          email: user.email,
          role: user.role,
        });
      }
    }
  }, [open, isCreate, user, createForm, editForm]);

  const handleCreateSubmit = async (data: CreateUserInput) => {
    setLoading(true);
    try {
      const result = await createUserAction(data);
      if (result.success) {
        toast.success("Pengguna berhasil dibuat");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error ?? "Gagal membuat pengguna");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (data: UpdateUserInput) => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await updateUserAction(user.id, data);
      if (result.success) {
        toast.success("Pengguna berhasil diperbarui");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error ?? "Gagal memperbarui pengguna");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isCreate ? "Tambah Pengguna" : "Edit Pengguna"}
          </DialogTitle>
        </DialogHeader>

        {isCreate ? (
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(handleCreateSubmit)}
              className="space-y-4"
            >
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama lengkap" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@perusahaan.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Minimal 8 karakter"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peran</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih peran" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleOptions.map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleEditSubmit)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama lengkap" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@perusahaan.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peran</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih peran" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleOptions.map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
