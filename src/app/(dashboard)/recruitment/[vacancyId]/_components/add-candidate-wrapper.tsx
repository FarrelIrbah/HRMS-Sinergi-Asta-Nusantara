"use client";

import { useRouter } from "next/navigation";
import { AddCandidateDialog } from "./add-candidate-dialog";

interface AddCandidateDialogWrapperProps {
  vacancyId: string;
}

export function AddCandidateDialogWrapper({
  vacancyId,
}: AddCandidateDialogWrapperProps) {
  const router = useRouter();
  return (
    <AddCandidateDialog
      vacancyId={vacancyId}
      onSuccess={() => router.refresh()}
    />
  );
}
