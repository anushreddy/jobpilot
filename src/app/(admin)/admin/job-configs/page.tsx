import { AdminJobConfigsClient } from "@/components/admin/AdminJobConfigsClient";

export default function AdminJobConfigsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-foreground">Job Search Roles</h1>
        <p className="text-sm text-slate-500 dark:text-muted-foreground">
          Roles and locations the sync pipeline fetches jobs for
        </p>
      </div>
      <AdminJobConfigsClient />
    </div>
  );
}
