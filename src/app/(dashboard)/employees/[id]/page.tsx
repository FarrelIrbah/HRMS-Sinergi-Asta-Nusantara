import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  Eye,
  FileSignature,
  Mail,
  Pencil,
  Phone,
  UserCircle,
} from "lucide-react";
import { auth } from "@/lib/auth";
import {
  canManagerAccessEmployee,
  getEmployeeById,
  getEmployeeByUserId,
} from "@/lib/services/employee.service";
import {
  getAllDepartments,
  getAllPositions,
} from "@/lib/services/master-data.service";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CONTRACT_TYPE_LABELS } from "@/lib/constants";
import { EmployeeProfileTabs } from "./_components/employee-profile-tabs";
import { DeactivateEmployeeDialog } from "./_components/deactivate-employee-dialog";
import type { ContractType, Role } from "@/types/enums";

interface EmployeeDetailPageProps {
  params: Promise<{ id: string }>;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function EmployeeDetailPage({
  params,
}: EmployeeDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const role = session.user.role as Role;

  let mode: "edit" | "readonly" = "readonly";

  if (role === "EMPLOYEE") {
    const ownEmployee = await getEmployeeByUserId(session.user.id);
    if (!ownEmployee || ownEmployee.id !== id) {
      redirect("/dashboard");
    }
    mode = "readonly";
  }

  if (role === "MANAGER") {
    const canAccess = await canManagerAccessEmployee(session.user.id, id);
    if (!canAccess) {
      redirect("/employees");
    }
    mode = "readonly";
  }

  if (role === "HR_ADMIN" || role === "SUPER_ADMIN") {
    mode = "edit";
  }

  const employee = await getEmployeeById(id);

  if (!employee) {
    return notFound();
  }

  const [departments, positions] = await Promise.all([
    getAllDepartments(),
    getAllPositions(),
  ]);

  const serializedEmployee = {
    ...employee,
    joinDate: employee.joinDate.toISOString(),
    tanggalLahir: employee.tanggalLahir
      ? employee.tanggalLahir.toISOString()
      : null,
    terminationDate: employee.terminationDate
      ? employee.terminationDate.toISOString()
      : null,
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
    documents: employee.documents.map((doc) => ({
      ...doc,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    })),
    emergencyContacts: employee.emergencyContacts.map((ec) => ({
      ...ec,
      createdAt: ec.createdAt.toISOString(),
      updatedAt: ec.updatedAt.toISOString(),
    })),
  };

  const contractLabel =
    CONTRACT_TYPE_LABELS[employee.contractType as ContractType] ??
    employee.contractType;

  return (
    <div
      className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
      aria-label={`Halaman profil ${employee.namaLengkap}`}
    >
      {/* ─── Breadcrumb ──────────────────────────── */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-sm text-slate-500"
      >
        <Link
          href="/employees"
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-slate-200/60 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Karyawan
        </Link>
        <span aria-hidden="true" className="text-slate-300">
          /
        </span>
        <span className="font-medium text-slate-700">Profil</span>
      </nav>

      {/* ─── Inactive banner ─────────────────────── */}
      {!employee.isActive && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <div>
            <p className="font-medium">Karyawan nonaktif</p>
            <p className="text-rose-700/80">
              Diberhentikan pada{" "}
              {employee.terminationDate
                ? format(employee.terminationDate, "dd MMMM yyyy", {
                    locale: idLocale,
                  })
                : "-"}{" "}
              &mdash; {employee.terminationReason ?? "-"}
            </p>
          </div>
        </div>
      )}

      {/* ─── Profile Hero Card ───────────────────── */}
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            {/* Identity block */}
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 flex-shrink-0 ring-1 ring-emerald-100">
                <AvatarFallback className="bg-emerald-100 text-lg font-semibold text-emerald-700">
                  {initials(employee.namaLengkap)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                    {employee.namaLengkap}
                  </h1>
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1.5",
                      employee.isActive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                        : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        employee.isActive ? "bg-emerald-500" : "bg-slate-400",
                      )}
                    />
                    {employee.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
                <p className="mt-0.5 font-mono text-sm tabular-nums text-slate-500">
                  NIK {employee.nik}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                  {mode === "edit" ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 font-medium text-sky-700 ring-1 ring-sky-100">
                      <Pencil className="h-3 w-3" aria-hidden="true" />
                      Mode Edit
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600 ring-1 ring-slate-200">
                      <Eye className="h-3 w-3" aria-hidden="true" />
                      Mode Baca
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              {mode === "edit" && employee.isActive && (
                <DeactivateEmployeeDialog
                  employeeId={employee.id}
                  employeeName={employee.namaLengkap}
                />
              )}
            </div>
          </div>

          <Separator className="my-5" />

          {/* Meta grid */}
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <MetaItem icon={Mail} label="Email" value={employee.email} />
            <MetaItem
              icon={Phone}
              label="Nomor HP"
              value={employee.nomorHp ?? "—"}
              muted={!employee.nomorHp}
            />
            <MetaItem
              icon={Building2}
              label="Departemen"
              value={employee.department?.name ?? "—"}
              muted={!employee.department}
            />
            <MetaItem
              icon={Briefcase}
              label="Jabatan"
              value={employee.position?.name ?? "—"}
              muted={!employee.position}
            />
            <MetaItem
              icon={FileSignature}
              label="Tipe Kontrak"
              value={contractLabel}
            />
            <MetaItem
              icon={CalendarDays}
              label="Tanggal Bergabung"
              value={format(employee.joinDate, "dd MMM yyyy", {
                locale: idLocale,
              })}
            />
            <MetaItem
              icon={UserCircle}
              label="Terakhir Diperbarui"
              value={format(employee.updatedAt, "dd MMM yyyy", {
                locale: idLocale,
              })}
              muted
            />
          </dl>
        </CardContent>
      </Card>

      {/* ─── Tabs ─────────────────────────────────── */}
      <EmployeeProfileTabs
        employee={serializedEmployee}
        mode={mode}
        departments={departments}
        positions={positions}
      />
    </div>
  );
}

// ─── MetaItem ──────────────────────────────────────────────

function MetaItem({
  icon: Icon,
  label,
  value,
  muted = false,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 ring-1 ring-slate-200"
        aria-hidden="true"
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium text-slate-500">{label}</dt>
        <dd
          className={cn(
            "truncate text-sm",
            muted ? "text-slate-400" : "font-medium text-slate-800",
          )}
          title={value}
        >
          {value}
        </dd>
      </div>
    </div>
  );
}
