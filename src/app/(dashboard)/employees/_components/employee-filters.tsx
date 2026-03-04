"use client";

import { useQueryState, parseAsString } from "nuqs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

interface Department {
  id: string;
  name: string;
}

interface Position {
  id: string;
  name: string;
  departmentId: string;
}

interface EmployeeFiltersProps {
  departments: Department[];
  positions: Position[];
  isManager?: boolean;
}

export function EmployeeFilters({
  departments,
  positions,
  isManager = false,
}: EmployeeFiltersProps) {
  const router = useRouter();

  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault("")
  );
  const [departmentId, setDepartmentId] = useQueryState(
    "departmentId",
    parseAsString.withDefault("")
  );
  const [positionId, setPositionId] = useQueryState(
    "positionId",
    parseAsString.withDefault("")
  );
  const [isActive, setIsActive] = useQueryState(
    "isActive",
    parseAsString.withDefault("")
  );
  const [contractType, setContractType] = useQueryState(
    "contractType",
    parseAsString.withDefault("")
  );

  // Filter positions by selected department
  const filteredPositions = departmentId
    ? positions.filter((p) => p.departmentId === departmentId)
    : positions;

  const handleApply = () => {
    router.refresh();
  };

  const handleReset = () => {
    setSearch("");
    setDepartmentId("");
    setPositionId("");
    setIsActive("");
    setContractType("");
    router.refresh();
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-[200px] flex-col gap-1.5">
          <Label htmlFor="filter-search" className="text-sm font-medium">
            Cari
          </Label>
          <Input
            id="filter-search"
            placeholder="Nama atau NIK..."
            className="h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {!isManager && (
          <div className="flex min-w-[160px] flex-col gap-1.5">
            <Label
              htmlFor="filter-department"
              className="text-sm font-medium"
            >
              Departemen
            </Label>
            <Select
              value={departmentId || "_all"}
              onValueChange={(v) => {
                setDepartmentId(v === "_all" ? "" : v);
                // Reset position when department changes
                setPositionId("");
              }}
            >
              <SelectTrigger id="filter-department" className="h-9">
                <SelectValue placeholder="Semua Departemen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Semua Departemen</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex min-w-[160px] flex-col gap-1.5">
          <Label htmlFor="filter-position" className="text-sm font-medium">
            Jabatan
          </Label>
          <Select
            value={positionId || "_all"}
            onValueChange={(v) => setPositionId(v === "_all" ? "" : v)}
          >
            <SelectTrigger id="filter-position" className="h-9">
              <SelectValue placeholder="Semua Jabatan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Semua Jabatan</SelectItem>
              {filteredPositions.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-[140px] flex-col gap-1.5">
          <Label htmlFor="filter-status" className="text-sm font-medium">
            Status
          </Label>
          <Select
            value={isActive || "_all"}
            onValueChange={(v) => setIsActive(v === "_all" ? "" : v)}
          >
            <SelectTrigger id="filter-status" className="h-9">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Semua</SelectItem>
              <SelectItem value="true">Aktif</SelectItem>
              <SelectItem value="false">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-[140px] flex-col gap-1.5">
          <Label
            htmlFor="filter-contract"
            className="text-sm font-medium"
          >
            Tipe Kontrak
          </Label>
          <Select
            value={contractType || "_all"}
            onValueChange={(v) => setContractType(v === "_all" ? "" : v)}
          >
            <SelectTrigger id="filter-contract" className="h-9">
              <SelectValue placeholder="Semua Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Semua</SelectItem>
              <SelectItem value="PKWT">PKWT</SelectItem>
              <SelectItem value="PKWTT">PKWTT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={handleApply} className="h-9">
            Terapkan
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="h-9"
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
