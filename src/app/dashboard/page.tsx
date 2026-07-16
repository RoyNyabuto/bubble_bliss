import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

const roleRoutes: Record<string, string> = {
  ADMIN: "/dashboard/owner",
  DRIVER: "/dashboard/driver",
  EMPLOYEE: "/dashboard/employee",
  CUSTOMER: "/dashboard/customer"
};

export default async function DashboardRouter() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;
  redirect(roleRoutes[role] ?? "/dashboard/customer");
}
