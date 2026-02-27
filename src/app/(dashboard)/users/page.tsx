import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUsers } from "@/lib/services/user.service";
import { UserTable } from "./_components/user-table";
import { UserPageHeader } from "./_components/user-page-header";

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const { data: users, total } = await getUsers();

  return (
    <div className="space-y-6">
      <UserPageHeader />
      <UserTable data={users} total={total} />
    </div>
  );
}
