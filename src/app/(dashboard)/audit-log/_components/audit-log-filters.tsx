"use client";

import { useQueryState, parseAsString } from "nuqs";
import { Filter, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

interface AuditLogUser {
  id: string;
  name: string;
  email: string;
}

interface AuditLogFiltersProps {
  users: AuditLogUser[];
  modules: string[];
}

export function AuditLogFilters({ users, modules }: AuditLogFiltersProps) {
  const router = useRouter();

  const [userId, setUserId] = useQueryState(
    "userId",
    parseAsString.withDefault("")
  );
  const [module, setModule] = useQueryState(
    "module",
    parseAsString.withDefault("")
  );
  const [dateFrom, setDateFrom] = useQueryState(
    "dateFrom",
    parseAsString.withDefault("")
  );
  const [dateTo, setDateTo] = useQueryState(
    "dateTo",
    parseAsString.withDefault("")
  );

  const handleApply = () => {
    router.refresh();
  };

  const handleReset = () => {
    setUserId("");
    setModule("");
    setDateFrom("");
    setDateTo("");
    router.refresh();
  };

  const hasActiveFilter = !!(userId || module || dateFrom || dateTo);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 pb-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600"
            aria-hidden="true"
          >
            <Filter className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-sm font-semibold text-slate-900">Filter</h2>
          {hasActiveFilter && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              aktif
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-[180px] flex-col gap-1.5">
            <Label htmlFor="filter-user" className="text-xs text-slate-600">
              Pengguna
            </Label>
            <Select
              value={userId || "_all"}
              onValueChange={(v) => setUserId(v === "_all" ? "" : v)}
            >
              <SelectTrigger
                id="filter-user"
                className="h-9 border-slate-200 bg-white"
              >
                <SelectValue placeholder="Semua Pengguna" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Semua Pengguna</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-w-[180px] flex-col gap-1.5">
            <Label htmlFor="filter-module" className="text-xs text-slate-600">
              Modul
            </Label>
            <Select
              value={module || "_all"}
              onValueChange={(v) => setModule(v === "_all" ? "" : v)}
            >
              <SelectTrigger
                id="filter-module"
                className="h-9 border-slate-200 bg-white"
              >
                <SelectValue placeholder="Semua Modul" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Semua Modul</SelectItem>
                {modules.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="filter-date-from"
              className="text-xs text-slate-600"
            >
              Tanggal Dari
            </Label>
            <Input
              id="filter-date-from"
              type="date"
              className="h-9 w-[160px] border-slate-200 bg-white"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-date-to" className="text-xs text-slate-600">
              Tanggal Sampai
            </Label>
            <Input
              id="filter-date-to"
              type="date"
              className="h-9 w-[160px] border-slate-200 bg-white"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleApply}
              className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Terapkan
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="h-9 gap-1.5 border-slate-200"
              disabled={!hasActiveFilter}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
