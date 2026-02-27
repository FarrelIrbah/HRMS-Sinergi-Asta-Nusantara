"use client";

import type { UserRow } from "./user-columns";

interface UserFormDialogProps {
  mode: "create" | "edit";
  user?: UserRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Placeholder - will be fully implemented in Task 3
export function UserFormDialog({
  open,
  onOpenChange,
}: UserFormDialogProps) {
  if (!open) return null;
  return null;
}
