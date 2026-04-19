"use client";

import { useQueryState } from "nuqs";
import { CalendarRange } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1];

export function AttendanceFilters() {
  const [month, setMonth] = useQueryState("month", {
    defaultValue: String(new Date().getMonth() + 1),
  });
  const [year, setYear] = useQueryState("year", {
    defaultValue: String(currentYear),
  });

  return (
    <div className="flex items-center gap-2">
      <CalendarRange
        className="hidden h-4 w-4 text-slate-400 sm:block"
        aria-hidden="true"
      />
      <Select value={month} onValueChange={setMonth}>
        <SelectTrigger className="w-[130px] border-slate-200 bg-white text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((name, idx) => (
            <SelectItem key={idx + 1} value={String(idx + 1)}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={year} onValueChange={(v) => setYear(v)}>
        <SelectTrigger className="w-[90px] border-slate-200 bg-white text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {YEARS.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
