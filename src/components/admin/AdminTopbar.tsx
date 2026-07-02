"use client";

import { signOut } from "next-auth/react";
import { LogOut, Menu } from "lucide-react";

export function AdminTopbar({ name, onMenuClick }: { name: string; onMenuClick?: () => void }) {
  return (
    <header className="h-14 flex items-center justify-between px-4 sm:px-6 bg-white dark:bg-card border-b border-slate-200 dark:border-border">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-secondary transition text-slate-600 dark:text-foreground"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-foreground">Admin Panel</h2>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="text-sm text-slate-500 dark:text-muted-foreground hidden sm:inline">{name}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-muted-foreground hover:text-red-500 transition"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </header>
  );
}
