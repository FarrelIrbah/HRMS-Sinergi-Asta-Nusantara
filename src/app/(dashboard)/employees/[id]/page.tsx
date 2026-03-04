import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import {
  getEmployeeById,
  getEmployeeByUserId,
  canManagerAccessEmployee,
} from "@/lib/services/employee.service";
import {
  getAllDepartments,
  getAllPositions,
} from "@/lib/services/master-data.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmployeeProfileTabs } from "./_components/employee-profile-tabs";
import type { Role } from "@/types/enums";

interface EmployeeDetailPageProps {
  params: Promise<{ id: string }>;
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

  // EMPLOYEE role: can only view own profile
  if (role === "EMPLOYEE") {
    const ownEmployee = await getEmployeeByUserId(session.user.id);
    if (!ownEmployee || ownEmployee.id !== id) {
      redirect("/dashboard");
    }
    mode = "readonly";
  }

  // MANAGER role: can only view employees in own department
  if (role === "MANAGER") {
    const canAccess = await canManagerAccessEmployee(session.user.id, id);
    if (!canAccess) {
      redirect("/employees");
    }
    mode = "readonly";
  }

  // HR_ADMIN / SUPER_ADMIN: can edit
  if (role === "HR_ADMIN" || role === "SUPER_ADMIN") {
    mode = "edit";
  }

  const employee = await getEmployeeById(id);

  if (!employee) {
    return notFound();
  }

  // Fetch dropdown data for edit mode
  const [departments, positions] = await Promise.all([
    getAllDepartments(),
    getAllPositions(),
  ]);

  // Serialize employee for client components (dates -> strings)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/employees">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {employee.namaLengkap}
            </h1>
            <Badge variant={employee.isActive ? "default" : "destructive"}>
              {employee.isActive ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
          <p className="text-muted-foreground">{employee.nik}</p>
        </div>
      </div>

      {/* Tabs */}
      <EmployeeProfileTabs
        employee={serializedEmployee}
        mode={mode}
        departments={departments}
        positions={positions}
      />
    </div>
  );
}
