"use client";

import { useMemo } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { useRouter } from "next/navigation";
import { Filter, RotateCcw, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

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
    parseAsString.withDefault(""),
  );
  const [departmentId, setDepartmentId] = useQueryState(
    "departmentId",
    parseAsString.withDefault(""),
  );
  const [positionId, setPositionId] = useQueryState(
    "positionId",
    parseAsString.withDefault(""),
  );
  const [isActive, setIsActive] = useQueryState(
    "isActive",
    parseAsString.withDefault(""),
  );
  const [contractType, setContractType] = useQueryState(
    "contractType",
    parseAsString.withDefault(""),
  );

  const filteredPositions = useMemo(
    () =>
      departmentId
        ? positions.filter((p) => p.departmentId === departmentId)
        : positions,
    [departmentId, positions],
  );

  const deptName = useMemo(
    () => departments.find((d) => d.id === departmentId)?.name ?? "",
    [departments, departmentId],
  );
  const posName = useMemo(
    () => positions.find((p) => p.id === positionId)?.name ?? "",
    [positions, positionId],
  );

  const appliedChips: Array<{ key: string; label: string; clear: () => void }> =
    [];
  if (search)
    appliedChips.push({
      key: "search",
      label: `"${search}"`,
      clear: () => setSearch(""),
    });
  if (deptName)
    appliedChips.push({
      key: "dept",
      label: `Dept: ${deptName}`,
      clear: () => {
        setDepartmentId("");
        setPositionId("");
      },
    });
  if (posName)
    appliedChips.push({
      key: "pos",
      label: `Jabatan: ${posName}`,
      clear: () => setPositionId(""),
    });
  if (isActive === "true")
    appliedChips.push({
      key: "active",
      label: "Status: Aktif",
      clear: () => setIsActive(""),
    });
  if (isActive === "false")
    appliedChips.push({
      key: "inactive",
      label: "Status: Nonaktif",
      clear: () => setIsActive(""),
    });
  if (contractType)
    appliedChips.push({
      key: "contract",
      label: `Kontrak: ${contractType}`,
      clear: () => setContractType(""),
    });

  const hasFilters = appliedChips.length > 0;

  const handleApply = () => router.refresh();
  const handleReset = () => {
    setSearch("");
    setDepartmentId("");
    setPositionId("");
    setIsActive("");
    setContractType("");
    router.refresh();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <Filter
          className="h-3.5 w-3.5 text-slate-400"
          aria-hidden="true"
        />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Filter
        </h2>
      </div>
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Label
              htmlFor="filter-search"
              className="text-xs font-medium text-slate-600"
            >
              Cari Karyawan
            </Label>
            <div className="relative mt-1.5">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                id="filter-search"
                placeholder="Nama, email, atau NIK..."
                className="h-9 pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {!isManager && (
            <div>
              <Label
                htmlFor="filter-department"
                className="text-xs font-medium text-slate-600"
              >
                Departemen
              </Label>
              <Select
                value={departmentId || "_all"}
                onValueChange={(v) => {
                  setDepartmentId(v === "_all" ? "" : v);
                  setPositionId("");
                }}
              >
                <SelectTrigger id="filter-department" className="mt-1.5 h-9">
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

          <div>
            <Label
              htmlFor="filter-position"
              className="text-xs font-medium text-slate-600"
            >
              Jabatan
            </Label>
            <Select
              value={positionId || "_all"}
              onValueChange={(v) => setPositionId(v === "_all" ? "" : v)}
            >
              <SelectTrigger id="filter-position" className="mt-1.5 h-9">
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

          <div>
            <Label
              htmlFor="filter-status"
              className="text-xs font-medium text-slate-600"
            >
              Status
            </Label>
            <Select
              value={isActive || "_all"}
              onValueChange={(v) => setIsActive(v === "_all" ? "" : v)}
            >
              <SelectTrigger id="filter-status" className="mt-1.5 h-9">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Semua</SelectItem>
                <SelectItem value="true">Aktif</SelectItem>
                <SelectItem value="false">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label
              htmlFor="filter-contract"
              className="text-xs font-medium text-slate-600"
            >
              Tipe Kontrak
            </Label>
            <Select
              value={contractType || "_all"}
              onValueChange={(v) => setContractType(v === "_all" ? "" : v)}
            >
              <SelectTrigger id="filter-contract" className="mt-1.5 h-9">
                <SelectValue placeholder="Semua Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Semua</SelectItem>
                <SelectItem value="PKWT">PKWT</SelectItem>
                <SelectItem value="PKWTT">PKWTT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {hasFilters ? (
            <div
              className="flex flex-wrap items-center gap-1.5"
              role="status"
              aria-live="polite"
            >
              <span className="text-xs text-slate-500">Filter aktif:</span>
              {appliedChips.map((chip) => (
                <Badge
                  key={chip.key}
                  variant="outline"
                  className="gap-1 border-emerald-200 bg-emerald-50 pr-1 text-emerald-700"
                >
                  {chip.label}
                  <button
                    type="button"
                    onClick={chip.clear}
                    aria-label={`Hapus filter ${chip.label}`}
                    className="rounded-full p-0.5 transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-xs text-slate-400">Belum ada filter aktif</span>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              disabled={!hasFilters}
              className="h-9 gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset
            </Button>
            <Separator orientation="vertical" className="h-9" />
            <Button
              size="sm"
              onClick={handleApply}
              className="h-9 bg-emerald-600 hover:bg-emerald-700"
            >
              Terapkan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
