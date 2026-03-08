"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toggleVacancyStatusAction } from "@/lib/actions/recruitment.actions";
import type { VacancyWithCounts } from "@/lib/services/recruitment.service";
import { VacancyStatus } from "@/types/enums";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface Props {
  vacancies: VacancyWithCounts[];
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function VacancyTable({ vacancies }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentStatus = searchParams.get("status") ?? "_all";

  function handleStatusFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "_all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    router.push(`/recruitment?${params.toString()}`);
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      const result = await toggleVacancyStatusAction(id);
      if (result.success) {
        toast.success("Status lowongan diperbarui");
      } else {
        toast.error(result.error ?? "Gagal mengubah status");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Filter Status:</span>
        <Select value={currentStatus} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Semua Status</SelectItem>
            <SelectItem value={VacancyStatus.OPEN}>Dibuka</SelectItem>
            <SelectItem value={VacancyStatus.CLOSED}>Ditutup</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {vacancies.length} lowongan ditemukan
        </span>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Posisi</TableHead>
              <TableHead>Departemen</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal Buka</TableHead>
              <TableHead className="text-right">Kandidat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vacancies.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  Belum ada lowongan pekerjaan
                </TableCell>
              </TableRow>
            ) : (
              vacancies.map((vacancy) => (
                <TableRow key={vacancy.id}>
                  <TableCell className="font-medium">{vacancy.title}</TableCell>
                  <TableCell>{vacancy.department.name}</TableCell>
                  <TableCell>
                    {vacancy.status === VacancyStatus.OPEN ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        Dibuka
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
                        Ditutup
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(vacancy.openDate)}</TableCell>
                  <TableCell className="text-right">
                    {vacancy._count.candidates}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/recruitment/${vacancy.id}`}
                        className="text-sm text-primary underline-offset-4 hover:underline"
                      >
                        Lihat
                      </a>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleToggle(vacancy.id)}
                      >
                        {vacancy.status === VacancyStatus.OPEN
                          ? "Tutup"
                          : "Buka"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
