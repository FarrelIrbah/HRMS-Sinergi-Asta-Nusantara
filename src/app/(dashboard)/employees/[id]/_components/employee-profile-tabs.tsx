"use client";

import { useQueryState } from "nuqs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalInfoTab } from "./personal-info-tab";
import { EmploymentDetailsTab } from "./employment-details-tab";
import { TaxBpjsTab } from "./tax-bpjs-tab";

interface Department {
  id: string;
  name: string;
}

interface Position {
  id: string;
  name: string;
  departmentId: string;
}

export interface SerializedEmployee {
  id: string;
  nik: string;
  userId: string;
  namaLengkap: string;
  email: string;
  nikKtp: string | null;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  jenisKelamin: string | null;
  statusPernikahan: string | null;
  agama: string | null;
  alamat: string | null;
  nomorHp: string | null;
  departmentId: string;
  positionId: string;
  contractType: string;
  joinDate: string;
  isActive: boolean;
  npwp: string | null;
  ptkpStatus: string | null;
  bpjsKesehatanNo: string | null;
  bpjsKetenagakerjaanNo: string | null;
  officeLocationId: string | null;
  terminationDate: string | null;
  terminationReason: string | null;
  department: { id: string; name: string } | null;
  position: { id: string; name: string } | null;
}

interface EmployeeProfileTabsProps {
  employee: SerializedEmployee;
  mode: "edit" | "readonly";
  departments: Department[];
  positions: Position[];
}

export function EmployeeProfileTabs({
  employee,
  mode,
  departments,
  positions,
}: EmployeeProfileTabsProps) {
  const [tab, setTab] = useQueryState("tab", { defaultValue: "personal" });

  const readOnly = mode === "readonly";

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="personal">Data Pribadi</TabsTrigger>
        <TabsTrigger value="employment">Detail Pekerjaan</TabsTrigger>
        <TabsTrigger value="tax-bpjs">Pajak & BPJS</TabsTrigger>
        <TabsTrigger value="documents">Dokumen</TabsTrigger>
        <TabsTrigger value="emergency">Kontak Darurat</TabsTrigger>
      </TabsList>

      <TabsContent value="personal">
        <PersonalInfoTab employee={employee} readOnly={readOnly} />
      </TabsContent>

      <TabsContent value="employment">
        <EmploymentDetailsTab
          employee={employee}
          readOnly={readOnly}
          departments={departments}
          positions={positions}
        />
      </TabsContent>

      <TabsContent value="tax-bpjs">
        <TaxBpjsTab employee={employee} readOnly={readOnly} />
      </TabsContent>

      <TabsContent value="documents">
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          Manajemen dokumen akan tersedia di pembaruan selanjutnya.
        </div>
      </TabsContent>

      <TabsContent value="emergency">
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          Kontak darurat akan tersedia di pembaruan selanjutnya.
        </div>
      </TabsContent>
    </Tabs>
  );
}
