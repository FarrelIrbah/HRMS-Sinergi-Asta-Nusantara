"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useQueryState } from "nuqs";
import { Building2, Briefcase, MapPin, CalendarDays } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DepartmentTab } from "./department-tab";
import { PositionTab } from "./position-tab";
import { OfficeLocationTab } from "./office-location-tab";
import { LeaveTypeTab } from "./leave-type-tab";

function PersistentTabContent({
  value,
  activeValue,
  children,
}: {
  value: string;
  activeValue: string;
  children: ReactNode;
}) {
  const [hasMounted, setHasMounted] = useState(value === activeValue);

  useEffect(() => {
    if (value === activeValue && !hasMounted) {
      setHasMounted(true);
    }
  }, [value, activeValue, hasMounted]);

  return (
    <TabsContent value={value} forceMount className="mt-0 data-[state=inactive]:hidden">
      {hasMounted ? children : null}
    </TabsContent>
  );
}

export function MasterDataTabs() {
  const [tab, setTab] = useQueryState("tab", { defaultValue: "departments" });

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-4">
      <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-white p-1 shadow-sm ring-1 ring-slate-200 sm:w-fit">
        <TabsTrigger
          value="departments"
          className="gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
        >
          <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
          Departemen
        </TabsTrigger>
        <TabsTrigger
          value="positions"
          className="gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
        >
          <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
          Jabatan
        </TabsTrigger>
        <TabsTrigger
          value="office-locations"
          className="gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
        >
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          Lokasi Kantor
        </TabsTrigger>
        <TabsTrigger
          value="leave-types"
          className="gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
        >
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          Jenis Cuti
        </TabsTrigger>
      </TabsList>

      <PersistentTabContent value="departments" activeValue={tab}>
        <DepartmentTab />
      </PersistentTabContent>

      <PersistentTabContent value="positions" activeValue={tab}>
        <PositionTab />
      </PersistentTabContent>

      <PersistentTabContent value="office-locations" activeValue={tab}>
        <OfficeLocationTab />
      </PersistentTabContent>

      <PersistentTabContent value="leave-types" activeValue={tab}>
        <LeaveTypeTab />
      </PersistentTabContent>
    </Tabs>
  );
}
