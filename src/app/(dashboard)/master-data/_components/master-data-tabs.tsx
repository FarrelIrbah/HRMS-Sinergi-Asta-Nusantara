"use client";

import { useQueryState } from "nuqs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DepartmentTab } from "./department-tab";
import { PositionTab } from "./position-tab";
import { OfficeLocationTab } from "./office-location-tab";
import { LeaveTypeTab } from "./leave-type-tab";

export function MasterDataTabs() {
  const [tab, setTab] = useQueryState("tab", { defaultValue: "departments" });

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="departments">Departemen</TabsTrigger>
        <TabsTrigger value="positions">Jabatan</TabsTrigger>
        <TabsTrigger value="office-locations">Lokasi Kantor</TabsTrigger>
        <TabsTrigger value="leave-types">Jenis Cuti</TabsTrigger>
      </TabsList>

      <TabsContent value="departments">
        <DepartmentTab />
      </TabsContent>

      <TabsContent value="positions">
        <PositionTab />
      </TabsContent>

      <TabsContent value="office-locations">
        <OfficeLocationTab />
      </TabsContent>

      <TabsContent value="leave-types">
        <LeaveTypeTab />
      </TabsContent>
    </Tabs>
  );
}
