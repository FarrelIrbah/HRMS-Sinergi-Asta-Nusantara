import { redirect } from "next/navigation";
import {
  ScrollText,
  Activity,
  PlusCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import { auth } from "@/lib/auth";
import {
  getAuditLogs,
  getAuditLogUsers,
  getAuditLogModules,
} from "@/lib/services/audit.service";
import { SummaryTile } from "@/components/shared/summary-tile";
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

  const createCount = rows.filter((r) => r.action === "CREATE").length;
  const updateCount = rows.filter((r) => r.action === "UPDATE").length;
  const deleteCount = rows.filter((r) => r.action === "DELETE").length;

  return (
    <div
      className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
      aria-label="Halaman log audit"
    >
      <header>
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
            aria-hidden="true"
          >
            <ScrollText className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Log Audit
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Riwayat seluruh tindakan sistem oleh pengguna — dapat ditelusuri dan
          difilter per periode
        </p>
      </header>

      <section
        aria-label="Ringkasan log audit"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <SummaryTile
          icon={Activity}
          label="Total Entri"
          value={logsResult.total}
          tone="emerald"
        />
        <SummaryTile
          icon={PlusCircle}
          label="Aksi Buat"
          value={createCount}
          tone="sky"
        />
        <SummaryTile
          icon={Pencil}
          label="Aksi Ubah"
          value={updateCount}
          tone="violet"
        />
        <SummaryTile
          icon={Trash2}
          label="Aksi Hapus"
          value={deleteCount}
          tone={deleteCount > 0 ? "rose" : "slate"}
        />
      </section>

      <AuditLogFilters users={users} modules={modules} />

      <AuditLogTable data={rows} total={logsResult.total} />
    </div>
  );
}
