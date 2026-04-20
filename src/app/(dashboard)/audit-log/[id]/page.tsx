import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  ArrowLeft,
  ScrollText,
  PlusCircle,
  Pencil,
  Trash2,
  Minus,
  Plus,
  Equal,
  FileText,
  User as UserIcon,
  Clock,
  Package,
  Hash,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getAuditLogById } from "@/lib/services/audit.service";
import { Card, CardContent } from "@/components/ui/card";
import { AUDIT_ACTIONS } from "@/lib/constants";
import type { AuditAction } from "@/types/enums";

const actionStyleMap: Record<
  AuditAction,
  { icon: LucideIcon; badge: string; chip: string }
> = {
  CREATE: {
    icon: PlusCircle,
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    chip: "bg-emerald-600",
  },
  UPDATE: {
    icon: Pencil,
    badge: "bg-sky-50 text-sky-700 ring-sky-200",
    chip: "bg-sky-600",
  },
  DELETE: {
    icon: Trash2,
    badge: "bg-rose-50 text-rose-700 ring-rose-200",
    chip: "bg-rose-600",
  },
};

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

function parseJsonValue(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

interface DiffViewProps {
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  action: AuditAction;
}

function DiffView({ oldData, newData, action }: DiffViewProps) {
  if (!oldData && !newData) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="py-10 text-center">
          <FileText
            className="mx-auto h-8 w-8 text-slate-300"
            aria-hidden="true"
          />
          <p className="mt-2 text-sm text-slate-500">
            Tidak ada nilai yang dicatat untuk entri ini.
          </p>
        </CardContent>
      </Card>
    );
  }

  const allKeys = Array.from(
    new Set<string>([
      ...Object.keys(oldData ?? {}),
      ...Object.keys(newData ?? {}),
    ])
  );

  const getStatus = (
    key: string
  ): "added" | "removed" | "changed" | "unchanged" => {
    const inOld = oldData && key in oldData;
    const inNew = newData && key in newData;
    if (!inOld && inNew) return "added";
    if (inOld && !inNew) return "removed";
    const oldVal = JSON.stringify(oldData?.[key] ?? null);
    const newVal = JSON.stringify(newData?.[key] ?? null);
    return oldVal === newVal ? "unchanged" : "changed";
  };

  const statusBadge: Record<
    ReturnType<typeof getStatus>,
    { icon: LucideIcon; label: string; className: string }
  > = {
    added: {
      icon: Plus,
      label: "Ditambahkan",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    },
    removed: {
      icon: Minus,
      label: "Dihapus",
      className: "bg-rose-50 text-rose-700 ring-rose-200",
    },
    changed: {
      icon: Pencil,
      label: "Diubah",
      className: "bg-amber-50 text-amber-700 ring-amber-200",
    },
    unchanged: {
      icon: Equal,
      label: "Sama",
      className: "bg-slate-100 text-slate-600 ring-slate-200",
    },
  };

  const hasChanges = allKeys.some((k) => getStatus(k) !== "unchanged");

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600"
              aria-hidden="true"
            >
              <FileText className="h-3.5 w-3.5" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">
              Perbandingan Nilai
            </h2>
          </div>
          {action === "UPDATE" && !hasChanges && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              Tidak ada perubahan
            </span>
          )}
        </div>
        <div className="grid divide-y divide-slate-200 md:grid-cols-2 md:divide-x md:divide-y-0">
          <div className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-6 items-center rounded-full bg-rose-50 px-2 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
                Sebelum
              </span>
              {!oldData && (
                <span className="text-xs italic text-slate-500">
                  tidak ada data sebelumnya
                </span>
              )}
            </div>
            {oldData && (
              <div className="space-y-1">
                {allKeys.map((key) => {
                  const status = getStatus(key);
                  const isPresent = oldData && key in oldData;
                  const highlight =
                    status === "removed" || status === "changed";
                  return (
                    <div
                      key={key}
                      className={`flex items-start gap-2 rounded-md px-2 py-1.5 font-mono text-xs ${
                        highlight
                          ? "bg-rose-50/70 text-rose-900 ring-1 ring-inset ring-rose-100"
                          : "text-slate-700"
                      } ${!isPresent ? "opacity-40" : ""}`}
                    >
                      <span className="font-semibold">{key}:</span>
                      <span className="min-w-0 flex-1 break-all">
                        {isPresent ? renderValue(oldData[key]) : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-6 items-center rounded-full bg-emerald-50 px-2 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                Sesudah
              </span>
              {!newData && (
                <span className="text-xs italic text-slate-500">
                  tidak ada data sesudahnya
                </span>
              )}
            </div>
            {newData && (
              <div className="space-y-1">
                {allKeys.map((key) => {
                  const status = getStatus(key);
                  const isPresent = newData && key in newData;
                  const highlight = status === "added" || status === "changed";
                  const badge = statusBadge[status];
                  const Icon = badge.icon;
                  return (
                    <div
                      key={key}
                      className={`flex items-start gap-2 rounded-md px-2 py-1.5 font-mono text-xs ${
                        highlight
                          ? "bg-emerald-50/70 text-emerald-900 ring-1 ring-inset ring-emerald-100"
                          : "text-slate-700"
                      } ${!isPresent ? "opacity-40" : ""}`}
                    >
                      <span className="font-semibold">{key}:</span>
                      <span className="min-w-0 flex-1 break-all">
                        {isPresent ? renderValue(newData[key]) : "—"}
                      </span>
                      {status !== "unchanged" && (
                        <span
                          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${badge.className}`}
                          title={badge.label}
                        >
                          <Icon className="h-2.5 w-2.5" aria-hidden="true" />
                          {badge.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

export default async function AuditLogDetailPage({ params }: DetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const { id: entryId } = await params;
  const entry = await getAuditLogById(entryId);

  if (!entry) {
    notFound();
  }

  const oldData = parseJsonValue(entry.oldValue);
  const newData = parseJsonValue(entry.newValue);
  const style = actionStyleMap[entry.action];
  const ActionIcon = style.icon;

  return (
    <div
      className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
      aria-label="Detail log audit"
    >
      <nav aria-label="Navigasi kembali">
        <Link
          href="/audit-log"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke Log Audit
        </Link>
      </nav>

      <header>
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
            aria-hidden="true"
          >
            <ScrollText className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Detail Log Audit
          </h1>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style.badge}`}
          >
            <ActionIcon className="h-3 w-3" aria-hidden="true" />
            {AUDIT_ACTIONS[entry.action]}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Informasi lengkap dan perubahan data untuk entri ini
        </p>
      </header>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600"
              aria-hidden="true"
            >
              <FileText className="h-3.5 w-3.5" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">
              Informasi Entri
            </h2>
          </div>
          <dl className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-2.5">
              <div
                className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600"
                aria-hidden="true"
              >
                <ActionIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Aksi
                </dt>
                <dd className="mt-0.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style.badge}`}
                  >
                    {AUDIT_ACTIONS[entry.action]}
                  </span>
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div
                className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600"
                aria-hidden="true"
              >
                <Package className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Modul
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-900">
                  {entry.module}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div
                className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600"
                aria-hidden="true"
              >
                <Hash className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Target ID
                </dt>
                <dd className="mt-0.5">
                  <span className="inline-flex items-center rounded-md bg-slate-50 px-1.5 py-0.5 font-mono text-xs text-slate-700 ring-1 ring-inset ring-slate-200 break-all">
                    {entry.targetId || "-"}
                  </span>
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div
                className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200"
                aria-hidden="true"
              >
                {getInitials(entry.user?.name ?? "?")}
              </div>
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Pengguna
                </dt>
                <dd className="mt-0.5">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {entry.user?.name ?? "-"}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {entry.user?.email ?? ""}
                  </p>
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div
                className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600"
                aria-hidden="true"
              >
                <Clock className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Waktu
                </dt>
                <dd className="mt-0.5 text-sm tabular-nums text-slate-900">
                  {format(new Date(entry.createdAt), "dd MMMM yyyy, HH:mm:ss", {
                    locale: id,
                  })}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div
                className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600"
                aria-hidden="true"
              >
                <UserIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Entry ID
                </dt>
                <dd className="mt-0.5">
                  <span className="inline-flex items-center rounded-md bg-slate-50 px-1.5 py-0.5 font-mono text-xs text-slate-700 ring-1 ring-inset ring-slate-200 break-all">
                    {entry.id}
                  </span>
                </dd>
              </div>
            </div>
          </dl>
        </CardContent>
      </Card>

      <DiffView oldData={oldData} newData={newData} action={entry.action} />
    </div>
  );
}
