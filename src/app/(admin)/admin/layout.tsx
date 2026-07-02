import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  // Non-admins get bounced to the normal app.
  if (!session) redirect("/dashboard");

  return <AdminShell name={session.user.name ?? "Admin"}>{children}</AdminShell>;
}
