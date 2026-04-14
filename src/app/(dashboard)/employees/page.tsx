import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CalendarPlus,
  FileSignature,
  Plus,
  UserCheck,
  UserMinus,
  Users2,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import {
  getEmployees,
  getEmployeeStatsSummary,
  getEmployeesForManager,
  getEmployeeByUserId,
} from "@/lib/services/employee.service";
import {
  getAllDepartments,
  getAllPositions,
} from "@/lib/services/master-data.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { EmployeeTable } from "./_components/employee-table";
import { EmployeeFilters } from "./_components/employee-filters";
import type { Role } from "@/types/enums";

interface EmployeesPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    departmentId?: string;
    positionId?: string;
    isActive?: string;
    contractType?: string;
  }>;
}

export default async function EmployeesPage({
  searchParams,
}: EmployeesPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role as Role;

  if (role === "EMPLOYEE") {
    const employee = await getEmployeeByUserId(session.user.id);
    if (employee) {
      redirect(`/employees/${employee.id}`);
    }
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">
          Profil karyawan tidak ditemukan.
        </p>
      </div>
    );
  }

  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const search = params.search || "";
  const departmentId = params.departmentId || undefined;
  const positionId = params.positionId || undefined;
  const contractType = params.contractType || undefined;
  const isActive =
    params.isActive === "true"
      ? true
      : params.isActive === "false"
        ? false
        : undefined;

  const [employeeResult, stats, departments, positions] = await Promise.all([
    role === "MANAGER"
      ? getEmployeesForManager(session.user.id, {
          page,
          search: search || undefined,
          positionId,
          isActive,
          contractType,
        })
      : getEmployees({
          page,
          search: search || undefined,
          departmentId,
          positionId,
          isActive,
          contractType,
        }),
    getEmployeeStatsSummary(),
    getAllDepartments(),
    getAllPositions(),
  ]);

  const canCreate = role === "HR_ADMIN" || role === "SUPER_ADMIN";

  const serializedEmployees = employeeResult.data.map((emp) => ({
    id: emp.id,
    nik: emp.nik,
    namaLengkap: emp.namaLengkap,
    email: emp.email,
    departmentName: emp.department?.name ?? "-",
    positionName: emp.position?.name ?? "-",
    isActive: emp.isActive,
    contractType: emp.contractType,
    joinDate: emp.joinDate.toISOString(),
  }));

  return (
    <div
      className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-4 md:-m-6 md:p-6"
      aria-label="Halaman karyawan"
    >
      {/* ─── Header ────────────────────────────────── */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
              aria-hidden="true"
            >
              <Users2 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Karyawan
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {role === "MANAGER"
              ? "Daftar karyawan di departemen Anda."
              : "Kelola seluruh data karyawan perusahaan — profil, kontrak, dan status kepegawaian."}
          </p>
        </div>
        {canCreate && (
          <Button
            asChild
            size="default"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Link href="/employees/new" aria-label="Tambah karyawan baru">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Tambah Karyawan
            </Link>
          </Button>
        )}
      </header>

      {/* ─── KPI Summary ──────────────────────────── */}
      <section
        aria-label="Ringkasan statistik karyawan"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        <SummaryTile
          icon={UserCheck}
          label="Aktif"
          value={stats.totalActive}
          tone="emerald"
        />
        <SummaryTile
          icon={FileSignature}
          label="PKWT"
          value={stats.pkwtCount}
          tone="sky"
        />
        <SummaryTile
          icon={FileSignature}
          label="PKWTT"
          value={stats.pkwttCount}
          tone="violet"
        />
        <SummaryTile
          icon={CalendarPlus}
          label="Baru Bulan Ini"
          value={stats.joinedThisMonth}
          tone="amber"
        />
        <SummaryTile
          icon={UserMinus}
          label="Nonaktif"
          value={stats.totalInactive}
          tone="slate"
        />
      </section>

      {/* ─── Filters ──────────────────────────────── */}
      <EmployeeFilters
        departments={departments}
        positions={positions}
        isManager={role === "MANAGER"}
      />

      {/* ─── Table ────────────────────────────────── */}
      <EmployeeTable
        employees={serializedEmployees}
        total={employeeResult.total}
        page={employeeResult.page}
        pageSize={employeeResult.pageSize}
        totalPages={employeeResult.totalPages}
        userRole={role}
      />
    </div>
  );
}

// ─────────────────── Sub-components ───────────────────

type Tone = "emerald" | "sky" | "violet" | "amber" | "slate";

const TONE_MAP: Record<Tone, { bg: string; text: string; ring: string }> = {
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-100",
  },
  sky: { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-100" },
  violet: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    ring: "ring-violet-100",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-100",
  },
  slate: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    ring: "ring-slate-200",
  },
};

function SummaryTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: Tone;
}) {
  const t = TONE_MAP[tone];
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ring-1",
            t.bg,
            t.text,
            t.ring,
          )}
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold tabular-nums leading-tight text-slate-900">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
