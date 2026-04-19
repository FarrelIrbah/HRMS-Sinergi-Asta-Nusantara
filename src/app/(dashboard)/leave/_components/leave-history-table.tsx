"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { History, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cancelLeaveAction } from "@/lib/actions/leave.actions";
import { LEAVE_STATUS_LABELS } from "@/lib/constants";

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  status: string;
  reason: string;
  createdAt: string;
  approvedAt: string | null;
  approverNotes: string | null;
  leaveType: { id: string; name: string };
  approvedBy: { name: string } | null;
}

interface LeaveHistoryTableProps {
  requests: LeaveRequest[];
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "APPROVED":
      return "border-emerald-300 bg-emerald-50 text-emerald-700";
    case "REJECTED":
      return "border-red-300 bg-red-50 text-red-700";
    case "CANCELLED":
      return "border-slate-300 bg-slate-50 text-slate-600";
    default:
      return "border-amber-300 bg-amber-50 text-amber-700";
  }
}

function CancelButton({ requestId }: { requestId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelLeaveAction(requestId);
      if (result.success) {
        toast.success("Pengajuan cuti berhasil dibatalkan");
      } else {
        toast.error(result.error ?? "Gagal membatalkan cuti");
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCancel}
      disabled={isPending}
      className="gap-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
      aria-label="Batalkan pengajuan"
    >
      <X className="h-3 w-3" aria-hidden="true" />
      {isPending ? "..." : "Batalkan"}
    </Button>
  );
}

export function LeaveHistoryTable({ requests }: LeaveHistoryTableProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-50 text-violet-600"
            aria-hidden="true"
          >
            <History className="h-3.5 w-3.5" />
          </div>
          Riwayat Pengajuan Cuti
        </CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-slate-500">
              Belum ada pengajuan cuti.
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
                  <TableHead className="text-xs font-semibold text-slate-600">
                    Jenis Cuti
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">
                    Periode
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">
                    Hari Kerja
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">
                    Catatan
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">
                    {/* actions */}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium text-slate-900">
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
                    <TableCell className="tabular-nums text-sm text-slate-700">
                      {req.workingDays} hari
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusBadgeClass(req.status)}`}
                      >
                        {LEAVE_STATUS_LABELS[
                          req.status as keyof typeof LEAVE_STATUS_LABELS
                        ] ?? req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-slate-500">
                      {req.approverNotes ?? "\u2014"}
                    </TableCell>
                    <TableCell>
                      {req.status === "PENDING" && (
                        <CancelButton requestId={req.id} />
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
  );
}
