"use client";

import type { SerializedEmployee } from "./employee-profile-tabs";

interface PersonalInfoTabProps {
  employee: SerializedEmployee;
  readOnly: boolean;
}

export function PersonalInfoTab({ employee, readOnly }: PersonalInfoTabProps) {
  return (
    <div className="rounded-lg border p-8 text-center text-muted-foreground">
      Data pribadi - {employee.namaLengkap} {readOnly ? "(read-only)" : ""}
    </div>
  );
}
