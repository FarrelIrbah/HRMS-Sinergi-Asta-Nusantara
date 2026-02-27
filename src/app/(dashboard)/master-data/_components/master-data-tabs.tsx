"use client";

import { useQueryState } from "nuqs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DepartmentTab } from "./department-tab";
import { PositionTab } from "./position-tab";

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

      {/* ===== OFFICE LOCATION TAB (to be replaced by Plan 07) ===== */}
      <TabsContent value="office-locations">
        <div className="rounded-lg border bg-card p-6 text-card-foreground">
          <p className="text-sm text-muted-foreground">
            Lokasi Kantor akan ditambahkan
          </p>
        </div>
      </TabsContent>

      {/* ===== LEAVE TYPE TAB (to be replaced by Plan 07) ===== */}
      <TabsContent value="leave-types">
        <div className="rounded-lg border bg-card p-6 text-card-foreground">
          <p className="text-sm text-muted-foreground">
            Jenis Cuti akan ditambahkan
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
