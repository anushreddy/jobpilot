"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export function AdminShell({ name, children }: { name: string; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#f4f6f9] dark:bg-background text-slate-800 dark:text-foreground">
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar name={name} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
        <footer className="px-4 sm:px-6 py-3 text-xs text-slate-400 border-t border-slate-200 dark:border-border">
          Intervo Admin · v1.0
        </footer>
      </div>
    </div>
  );
}
