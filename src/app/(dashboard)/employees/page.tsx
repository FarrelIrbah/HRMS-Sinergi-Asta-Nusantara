import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import {
  getEmployees,
  getEmployeesForManager,
  getEmployeeByUserId,
} from "@/lib/services/employee.service";
import {
  getAllDepartments,
  getAllPositions,
} from "@/lib/services/master-data.service";
import { Button } from "@/components/ui/button";
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

  // Employee role: redirect to own profile
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

  // Fetch employees based on role
  const employeeResult =
    role === "MANAGER"
      ? await getEmployeesForManager(session.user.id, {
          page,
          search: search || undefined,
          positionId,
          isActive,
          contractType,
        })
      : await getEmployees({
          page,
          search: search || undefined,
          departmentId,
          positionId,
          isActive,
          contractType,
        });

  // Fetch filter options
  const [departments, positions] = await Promise.all([
    getAllDepartments(),
    getAllPositions(),
  ]);

  const canCreate = role === "HR_ADMIN" || role === "SUPER_ADMIN";

  // Serialize dates for client components
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Karyawan</h1>
          <p className="text-muted-foreground">
            {role === "MANAGER"
              ? "Daftar karyawan di departemen Anda"
              : "Kelola data karyawan perusahaan"}
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/employees/new">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Karyawan
            </Link>
          </Button>
        )}
      </div>

      <EmployeeFilters
        departments={departments}
        positions={positions}
        isManager={role === "MANAGER"}
      />

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
