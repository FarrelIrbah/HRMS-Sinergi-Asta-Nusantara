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

  const [userId, setUserId] = useQueryState("userId", parseAsString.withDefault(""));
  const [module, setModule] = useQueryState("module", parseAsString.withDefault(""));
  const [dateFrom, setDateFrom] = useQueryState("dateFrom", parseAsString.withDefault(""));
  const [dateTo, setDateTo] = useQueryState("dateTo", parseAsString.withDefault(""));

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

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-[160px] flex-col gap-1.5">
          <Label htmlFor="filter-user" className="text-sm font-medium">
            Pengguna
          </Label>
          <Select
            value={userId || "_all"}
            onValueChange={(v) => setUserId(v === "_all" ? "" : v)}
          >
            <SelectTrigger id="filter-user" className="h-9">
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

        <div className="flex min-w-[160px] flex-col gap-1.5">
          <Label htmlFor="filter-module" className="text-sm font-medium">
            Modul
          </Label>
          <Select
            value={module || "_all"}
            onValueChange={(v) => setModule(v === "_all" ? "" : v)}
          >
            <SelectTrigger id="filter-module" className="h-9">
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
          <Label htmlFor="filter-date-from" className="text-sm font-medium">
            Tanggal Dari
          </Label>
          <Input
            id="filter-date-from"
            type="date"
            className="h-9 w-[160px]"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-date-to" className="text-sm font-medium">
            Tanggal Sampai
          </Label>
          <Input
            id="filter-date-to"
            type="date"
            className="h-9 w-[160px]"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
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
