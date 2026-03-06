"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
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
  approverNotes: string | null;
  leaveType: { id: string; name: string };
  employee: {
    id: string;
    nik: string;
    namaLengkap: string;
    department: { name: string };
  };
  approvedBy: { name: string } | null;
}

interface LeaveApprovalTableProps {
  requests: LeaveRequest[];
  currentStatus: string;
  currentYear: number;
}

function getStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "APPROVED":
      return "default";
    case "REJECTED":
      return "destructive";
    case "CANCELLED":
      return "secondary";
    default:
      return "outline";
  }
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
}: LeaveApprovalTableProps) {
  const router = useRouter();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Select
          value={currentStatus}
          onValueChange={(v) => updateFilter("status", v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Menunggu</SelectItem>
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
          <SelectTrigger className="w-[100px]">
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

      <Card>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Tidak ada pengajuan cuti untuk filter ini.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Karyawan</TableHead>
                  <TableHead>Jenis Cuti</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead className="text-right">Hari</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Alasan / Catatan</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <p className="font-medium text-sm">
                        {req.employee.namaLengkap}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {req.employee.department.name}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {req.leaveType.name}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {format(new Date(req.startDate), "dd MMM", {
                        locale: localeId,
                      })}
                      {" \u2013 "}
                      {format(new Date(req.endDate), "dd MMM yyyy", {
                        locale: localeId,
                      })}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {req.workingDays}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(req.status)}>
                        {LEAVE_STATUS_LABELS[
                          req.status as keyof typeof LEAVE_STATUS_LABELS
                        ] ?? req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[180px]">
                      <p className="truncate">{req.reason}</p>
                      {req.approverNotes && (
                        <p className="text-xs italic truncate mt-0.5">
                          Catatan: {req.approverNotes}
                        </p>
                      )}
                      {req.approvedBy && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          oleh {req.approvedBy.name}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {req.status === "PENDING" && (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
