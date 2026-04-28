"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApproveRejectDialog } from "./approve-reject-dialog";
import { LEAVE_STATUS_LABELS } from "@/lib/constants";

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  status: string;
  reason: string;
  leaveType: { id: string; name: string };
  employee: {
    id: string;
    nik: string;
    namaLengkap: string;
    department: { name: string };
  };
  managerApprovedAt: string | null;
  managerNotes: string | null;
  managerApprovedBy: { name: string } | null;
  hrApprovedAt: string | null;
  hrNotes: string | null;
  hrApprovedBy: { name: string } | null;
}

interface LeaveApprovalTableProps {
  requests: LeaveRequest[];
  currentStatus: string;
  currentYear: number;
  currentRole: string;
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "APPROVED":
      return "border-emerald-300 bg-emerald-50 text-emerald-700";
    case "REJECTED":
      return "border-red-300 bg-red-50 text-red-700";
    case "CANCELLED":
      return "border-slate-300 bg-slate-50 text-slate-600";
    case "PENDING_HR":
      return "border-sky-300 bg-sky-50 text-sky-700";
    default: // PENDING_MANAGER
      return "border-amber-300 bg-amber-50 text-amber-700";
  }
}

// Whether the current user can act on a given request's current stage.
function canActOnRequest(role: string, status: string): boolean {
  if (role === "MANAGER") return status === "PENDING_MANAGER";
  if (role === "HR_ADMIN" || role === "SUPER_ADMIN")
    return status === "PENDING_HR";
  return false;
}

const YEARS = [
  new Date().getFullYear() - 1,
  new Date().getFullYear(),
  new Date().getFullYear() + 1,
];

export function LeaveApprovalTable({
  requests,
  currentStatus,
  currentYear,
  currentRole,
}: LeaveApprovalTableProps) {
  const router = useRouter();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* ─── Filters ──────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Filter
          className="hidden h-4 w-4 text-slate-400 sm:block"
          aria-hidden="true"
        />
        <Select
          value={currentStatus}
          onValueChange={(v) => updateFilter("status", v)}
        >
          <SelectTrigger className="w-[150px] border-slate-200 bg-white text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING_MANAGER">Menunggu Manager</SelectItem>
            <SelectItem value="PENDING_HR">Menunggu HR</SelectItem>
            <SelectItem value="APPROVED">Disetujui</SelectItem>
            <SelectItem value="REJECTED">Ditolak</SelectItem>
            <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
            <SelectItem value="_all">Semua Status</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={String(currentYear)}
          onValueChange={(v) => updateFilter("year", v)}
        >
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

      {/* ─── Table ────────────────────────────────── */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-500">
                Tidak ada pengajuan cuti untuk filter ini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
                    <TableHead className="text-xs font-semibold text-slate-600">
                      Karyawan
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">
                      Jenis Cuti
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">
                      Periode
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold text-slate-600">
                      Hari
                    </TableHead>
                    <TableHead className="text-center text-xs font-semibold text-slate-600">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">
                      Alasan / Catatan
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">
                      {/* actions */}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <p className="text-sm font-medium text-slate-900">
                          {req.employee.namaLengkap}
                        </p>
                        <p className="text-xs text-slate-500">
                          {req.employee.department.name}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">
                        {req.leaveType.name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-slate-700">
                        {format(new Date(req.startDate), "dd MMM", {
                          locale: localeId,
                        })}
                        {" \u2013 "}
                        {format(new Date(req.endDate), "dd MMM yyyy", {
                          locale: localeId,
                        })}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm text-slate-700">
                        {req.workingDays}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getStatusBadgeClass(req.status)}`}
                        >
                          {LEAVE_STATUS_LABELS[
                            req.status as keyof typeof LEAVE_STATUS_LABELS
                          ] ?? req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[220px] text-sm text-slate-500">
                        <p className="truncate">{req.reason}</p>
                        {req.managerNotes && (
                          <p className="mt-0.5 truncate text-xs italic">
                            Manager: {req.managerNotes}
                            {req.managerApprovedBy &&
                              ` — ${req.managerApprovedBy.name}`}
                          </p>
                        )}
                        {req.hrNotes && (
                          <p className="mt-0.5 truncate text-xs italic">
                            HR: {req.hrNotes}
                            {req.hrApprovedBy &&
                              ` — ${req.hrApprovedBy.name}`}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {canActOnRequest(currentRole, req.status) && (
                          <div className="flex gap-1">
                            <ApproveRejectDialog
                              leaveRequestId={req.id}
                              mode="approve"
                              employeeName={req.employee.namaLengkap}
                            />
                            <ApproveRejectDialog
                              leaveRequestId={req.id}
                              mode="reject"
                              employeeName={req.employee.namaLengkap}
                            />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
