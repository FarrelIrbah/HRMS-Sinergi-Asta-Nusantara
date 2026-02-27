import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { getAuditLogById } from "@/lib/services/audit.service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AUDIT_ACTIONS } from "@/lib/constants";
import type { AuditAction } from "@/generated/prisma/client";

const actionColorMap: Record<AuditAction, string> = {
  CREATE: "bg-green-100 text-green-800 border-green-200",
  UPDATE: "bg-blue-100 text-blue-800 border-blue-200",
  DELETE: "bg-red-100 text-red-800 border-red-200",
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

interface DiffViewProps {
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  action: AuditAction;
}

function DiffView({ oldData, newData, action }: DiffViewProps) {
  const allKeys = new Set<string>([
    ...Object.keys(oldData ?? {}),
    ...Object.keys(newData ?? {}),
  ]);

  const getChangedKeys = (): Set<string> => {
    if (action !== "UPDATE" || !oldData || !newData) return new Set();
    const changed = new Set<string>();
    allKeys.forEach((key) => {
      const oldVal = JSON.stringify(oldData[key] ?? null);
      const newVal = JSON.stringify(newData[key] ?? null);
      if (oldVal !== newVal) changed.add(key);
    });
    return changed;
  };

  const changedKeys = getChangedKeys();

  const renderValue = (value: unknown): string => {
    if (value === null || value === undefined) return "null";
    if (typeof value === "string") return `"${value}"`;
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  if (!oldData && !newData) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Tidak ada nilai yang dicatat.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Old Value */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            Nilai Sebelum
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!oldData ? (
            <p className="text-sm italic text-muted-foreground">
              — (tidak ada data sebelumnya)
            </p>
          ) : (
            <div className="space-y-1">
              {Array.from(allKeys).map((key) => {
                const isChanged = changedKeys.has(key);
                const value = oldData[key];
                const isPresent = key in oldData;
                return (
                  <div
                    key={key}
                    className={`rounded px-2 py-1 font-mono text-xs ${
                      isChanged
                        ? "bg-yellow-100 text-yellow-900"
                        : "text-foreground"
                    } ${!isPresent ? "opacity-40" : ""}`}
                  >
                    <span className="font-semibold">{key}</span>
                    <span className="text-muted-foreground">: </span>
                    <span>{isPresent ? renderValue(value) : "—"}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Value */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            Nilai Sesudah
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!newData ? (
            <p className="text-sm italic text-muted-foreground">
              — (tidak ada data sesudahnya)
            </p>
          ) : (
            <div className="space-y-1">
              {Array.from(allKeys).map((key) => {
                const isChanged = changedKeys.has(key);
                const value = newData[key];
                const isPresent = key in newData;
                return (
                  <div
                    key={key}
                    className={`rounded px-2 py-1 font-mono text-xs ${
                      isChanged
                        ? "bg-yellow-100 text-yellow-900"
                        : "text-foreground"
                    } ${!isPresent ? "opacity-40" : ""}`}
                  >
                    <span className="font-semibold">{key}</span>
                    <span className="text-muted-foreground">: </span>
                    <span>{isPresent ? renderValue(value) : "—"}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/audit-log"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Log Audit
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Detail Log Audit</h1>
        <p className="text-muted-foreground">
          Informasi lengkap dan perubahan data untuk entri ini.
        </p>
      </div>

      {/* Header card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi Entri</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Aksi
              </dt>
              <dd>
                <Badge
                  variant="outline"
                  className={actionColorMap[entry.action]}
                >
                  {AUDIT_ACTIONS[entry.action]}
                </Badge>
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Modul
              </dt>
              <dd className="text-sm font-medium">{entry.module}</dd>
            </div>

            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Target ID
              </dt>
              <dd className="font-mono text-sm text-muted-foreground">
                {entry.targetId}
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Pengguna
              </dt>
              <dd>
                <p className="text-sm font-medium">{entry.user?.name ?? "-"}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.user?.email ?? ""}
                </p>
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Waktu
              </dt>
              <dd className="text-sm">
                {format(new Date(entry.createdAt), "dd MMMM yyyy, HH:mm:ss", {
                  locale: id,
                })}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Before/After diff */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Perubahan Data</h2>
        <DiffView
          oldData={oldData}
          newData={newData}
          action={entry.action}
        />
      </div>
    </div>
  );
}
