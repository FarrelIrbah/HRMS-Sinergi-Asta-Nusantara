"use client";

import { useTransition } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { Filter, Loader2, RotateCcw, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Department {
  id: string;
  name: string;
}

interface LeaveReportFiltersProps {
  departments: Department[];
  defaultYear: number;
  resultCount: number;
}

export function LeaveReportFilters({
  departments,
  defaultYear,
  resultCount,
}: LeaveReportFiltersProps) {
  const [isPending, startTransition] = useTransition();

  const [year, setYear] = useQueryState(
    "year",
    parseAsString.withDefault(String(defaultYear)).withOptions({
      shallow: false,
      startTransition,
    })
  );
  const [departmentId, setDepartmentId] = useQueryState(
    "departmentId",
    parseAsString.withDefault("_all").withOptions({
      shallow: false,
      startTransition,
    })
  );

  const yearOptions = Array.from({ length: 5 }, (_, i) => defaultYear - 2 + i);

  const isFiltered =
    Number(year) !== defaultYear || (departmentId && departmentId !== "_all");

  const handleReset = () => {
    setYear(String(defaultYear));
    setDepartmentId("_all");
  };

  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-500"
            aria-hidden="true"
          >
            <Filter className="h-3.5 w-3.5" />
          </div>
          <CardTitle className="text-sm font-semibold text-slate-900">
            Filter Laporan
          </CardTitle>
          {isPending && (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              Memperbarui…
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-colors",
              isPending
                ? "bg-slate-50 text-slate-400 ring-slate-200"
                : "bg-slate-100 text-slate-700 ring-slate-200"
            )}
          >
            <Users2 className="h-3 w-3 text-slate-500" aria-hidden="true" />
            {resultCount} karyawan
          </span>
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={isPending}
              className="h-7 gap-1.5 px-2 text-xs text-slate-600 hover:bg-slate-100"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          className={cn(
            "flex flex-wrap gap-3 transition-opacity",
            isPending && "opacity-70"
          )}
        >
          <div className="flex w-full flex-col gap-1.5 sm:w-40">
            <Label
              htmlFor="filter-year"
              className="text-xs font-medium text-slate-500"
            >
              Tahun
            </Label>
            <Select value={year} onValueChange={setYear} disabled={isPending}>
              <SelectTrigger id="filter-year" className="border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex w-full flex-col gap-1.5 sm:w-72">
            <Label
              htmlFor="filter-department"
              className="text-xs font-medium text-slate-500"
            >
              Departemen
            </Label>
            <Select
              value={departmentId ?? "_all"}
              onValueChange={setDepartmentId}
              disabled={isPending}
            >
              <SelectTrigger
                id="filter-department"
                className="border-slate-200"
              >
                <SelectValue placeholder="Semua departemen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Semua departemen</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
