import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAllDepartments, getAllPositions } from "@/lib/services/master-data.service";
import { CreateEmployeeForm } from "./_components/create-employee-form";

export default async function NewEmployeePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "HR_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    redirect("/employees");
  }

  const [departments, positions] = await Promise.all([
    getAllDepartments(),
    getAllPositions(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tambah Karyawan</h1>
        <p className="text-muted-foreground">
          Isi data karyawan baru untuk mendaftarkan ke sistem.
        </p>
      </div>

      <CreateEmployeeForm departments={departments} positions={positions} />
    </div>
  );
}
