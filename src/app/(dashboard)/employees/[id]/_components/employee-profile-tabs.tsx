"use client";

import { useQueryState } from "nuqs";
import {
  Briefcase,
  FileText,
  PhoneCall,
  Receipt,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PersonalInfoTab } from "./personal-info-tab";
import { EmploymentDetailsTab } from "./employment-details-tab";
import { TaxBpjsTab } from "./tax-bpjs-tab";
import { DocumentsTab } from "./documents-tab";
import { EmergencyContactsTab } from "./emergency-contacts-tab";

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

interface EmployeeProfileTabsProps {
  employee: SerializedEmployee;
  mode: "edit" | "readonly";
  departments: Department[];
  positions: Position[];
}

type TabConfig = {
  value: string;
  label: string;
  icon: LucideIcon;
  count?: number;
};

export function EmployeeProfileTabs({
  employee,
  mode,
  departments,
  positions,
}: EmployeeProfileTabsProps) {
  const [tab, setTab] = useQueryState("tab", { defaultValue: "personal" });

  const readOnly = mode === "readonly";

  const tabs: TabConfig[] = [
    { value: "personal", label: "Data Pribadi", icon: UserRound },
    { value: "employment", label: "Detail Pekerjaan", icon: Briefcase },
    { value: "tax-bpjs", label: "Pajak & BPJS", icon: Receipt },
    {
      value: "documents",
      label: "Dokumen",
      icon: FileText,
      count: employee.documents?.length ?? 0,
    },
    {
      value: "emergency",
      label: "Kontak Darurat",
      icon: PhoneCall,
      count: employee.emergencyContacts?.length ?? 0,
    },
  ];

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-4">
      <div className="overflow-x-auto pb-1">
        <TabsList className="inline-flex h-auto w-auto gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.value;
            return (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className={cn(
                  "inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors",
                  "data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none",
                  "hover:bg-slate-50",
                )}
                aria-label={
                  t.count !== undefined
                    ? `${t.label} — ${t.count} item`
                    : t.label
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{t.label}</span>
                {t.count !== undefined && t.count > 0 && (
                  <span
                    className={cn(
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                      isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600",
                    )}
                    aria-hidden="true"
                  >
                    {t.count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      <TabsContent value="personal" className="mt-0">
        <PersonalInfoTab employee={employee} readOnly={readOnly} />
      </TabsContent>

      <TabsContent value="employment" className="mt-0">
        <EmploymentDetailsTab
          employee={employee}
          readOnly={readOnly}
          departments={departments}
          positions={positions}
        />
      </TabsContent>

      <TabsContent value="tax-bpjs" className="mt-0">
        <TaxBpjsTab employee={employee} readOnly={readOnly} />
      </TabsContent>

      <TabsContent value="documents" className="mt-0">
        <DocumentsTab
          employeeId={employee.id}
          documents={employee.documents ?? []}
          readOnly={readOnly}
        />
      </TabsContent>

      <TabsContent value="emergency" className="mt-0">
        <EmergencyContactsTab
          employeeId={employee.id}
          contacts={employee.emergencyContacts ?? []}
          readOnly={readOnly}
        />
      </TabsContent>
    </Tabs>
  );
}
