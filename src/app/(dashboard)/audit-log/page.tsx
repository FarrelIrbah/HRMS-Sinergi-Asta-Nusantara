import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getAuditLogs,
  getAuditLogUsers,
  getAuditLogModules,
} from "@/lib/services/audit.service";
import { AuditLogFilters } from "./_components/audit-log-filters";
import { AuditLogTable } from "./_components/audit-log-table";
import type { AuditLogRow } from "./_components/audit-log-columns";

interface AuditLogPageProps {
  searchParams: Promise<{
    userId?: string;
    module?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
    pageSize?: string;
  }>;
}

export default async function AuditLogPage({ searchParams }: AuditLogPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const params = await searchParams;

  const page = params.page ? parseInt(params.page, 10) : 1;
  const pageSize = params.pageSize ? parseInt(params.pageSize, 10) : 25;

  const filters = {
    userId: params.userId || undefined,
    module: params.module || undefined,
    dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
    dateTo: params.dateTo
      ? new Date(new Date(params.dateTo).setHours(23, 59, 59, 999))
      : undefined,
    page,
    pageSize,
  };

  const [logsResult, users, modules] = await Promise.all([
    getAuditLogs(filters),
    getAuditLogUsers(),
    getAuditLogModules(),
  ]);

  const rows: AuditLogRow[] = logsResult.data.map((log) => ({
    id: log.id,
    action: log.action,
    module: log.module,
    targetId: log.targetId,
    oldValue: log.oldValue,
    newValue: log.newValue,
    createdAt: log.createdAt,
    user: {
      name: log.user?.name ?? "",
      email: log.user?.email ?? "",
    },
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Log Audit</h1>
        <p className="text-muted-foreground">
          Riwayat seluruh tindakan sistem oleh pengguna.
        </p>
      </div>

      <AuditLogFilters users={users} modules={modules} />

      <AuditLogTable data={rows} total={logsResult.total} />
    </div>
  );
}
