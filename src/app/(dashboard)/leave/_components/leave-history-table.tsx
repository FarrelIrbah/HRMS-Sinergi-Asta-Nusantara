"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
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
    <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isPending}>
      {isPending ? "Membatalkan..." : "Batalkan"}
    </Button>
  );
}

export function LeaveHistoryTable({ requests }: LeaveHistoryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Riwayat Pengajuan Cuti</CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">Belum ada pengajuan cuti.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jenis Cuti</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Hari Kerja</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.leaveType.name}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(req.startDate), "dd MMM", { locale: localeId })}
                    {" \u2013 "}
                    {format(new Date(req.endDate), "dd MMM yyyy", { locale: localeId })}
                  </TableCell>
                  <TableCell>{req.workingDays} hari</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(req.status)}>
                      {LEAVE_STATUS_LABELS[req.status as keyof typeof LEAVE_STATUS_LABELS] ?? req.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {req.approverNotes ?? "\u2014"}
                  </TableCell>
                  <TableCell>
                    {req.status === "PENDING" && <CancelButton requestId={req.id} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
