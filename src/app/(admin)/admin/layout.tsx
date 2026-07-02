import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  // Non-admins get bounced to the normal app.
  if (!session) redirect("/dashboard");

  return (
    <div className="min-h-screen flex bg-[#f4f6f9] dark:bg-background text-slate-800 dark:text-foreground">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar name={session.user.name ?? "Admin"} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
        <footer className="px-6 py-3 text-xs text-slate-400 border-t border-slate-200 dark:border-border">
          Intervo Admin · v1.0
        </footer>
      </div>
    </div>
  );
}
