import { AdminUsersClient } from "@/components/admin/AdminUsersClient";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-foreground">Users</h1>
        <p className="text-sm text-slate-500 dark:text-muted-foreground">Manage platform users</p>
      </div>
      <AdminUsersClient />
    </div>
  );
}
