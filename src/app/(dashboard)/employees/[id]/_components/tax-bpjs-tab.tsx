"use client";

import type { SerializedEmployee } from "./employee-profile-tabs";

interface TaxBpjsTabProps {
  employee: SerializedEmployee;
  readOnly: boolean;
}

export function TaxBpjsTab({ employee, readOnly }: TaxBpjsTabProps) {
  return (
    <div className="rounded-lg border p-8 text-center text-muted-foreground">
      Pajak & BPJS - {employee.namaLengkap} {readOnly ? "(read-only)" : ""}
    </div>
  );
}
