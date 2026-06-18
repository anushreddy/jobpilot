"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function AdminTopbar({ name }: { name: string }) {
  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white dark:bg-card border-b border-slate-200 dark:border-border">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-foreground">Admin Panel</h2>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500 dark:text-muted-foreground">{name}</span>
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
