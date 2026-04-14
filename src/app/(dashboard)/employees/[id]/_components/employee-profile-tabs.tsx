"use client";

import { useQueryState } from "nuqs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalInfoTab } from "./personal-info-tab";
import { EmploymentDetailsTab } from "./employment-details-tab";
import { TaxBpjsTab } from "./tax-bpjs-tab";
import { DocumentsTab } from "./documents-tab";
import { EmergencyContactsTab } from "./emergency-contacts-tab";
import { SalaryTab } from "./salary-tab";

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
  isTaxBorneByCompany: boolean;
  officeLocationId: string | null;
  terminationDate: string | null;
  terminationReason: string | null;
  department: { id: string; name: string } | null;
  position: { id: string; name: string } | null;
  documents: {
    id: string;
    employeeId: string;
    documentType: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    createdAt: string;
    updatedAt: string;
  }[];
  emergencyContacts: {
    id: string;
    employeeId: string;
    name: string;
    relationship: string;
    phone: string;
    address: string | null;
    createdAt: string;
    updatedAt: string;
  }[];
}

interface SalaryData {
  baseSalary: number;
  allowances: { id: string; name: string; amount: number; isFixed: boolean }[];
}

interface EmployeeProfileTabsProps {
  employee: SerializedEmployee;
  mode: "edit" | "readonly";
  departments: Department[];
  positions: Position[];
  salaryData?: SalaryData;
}

export function EmployeeProfileTabs({
  employee,
  mode,
  departments,
  positions,
  salaryData,
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
        {salaryData && (
          <TabsTrigger value="salary">Gaji & Tunjangan</TabsTrigger>
        )}
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
        <DocumentsTab
          employeeId={employee.id}
          documents={employee.documents ?? []}
          readOnly={readOnly}
        />
      </TabsContent>

      <TabsContent value="emergency">
        <EmergencyContactsTab
          employeeId={employee.id}
          contacts={employee.emergencyContacts ?? []}
          readOnly={readOnly}
        />
      </TabsContent>

      {salaryData && (
        <TabsContent value="salary">
          <SalaryTab
            employeeId={employee.id}
            baseSalary={salaryData.baseSalary}
            allowances={salaryData.allowances}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}
