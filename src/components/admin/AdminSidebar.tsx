"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Briefcase, FileText, ArrowLeft, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/users", icon: Users, label: "Users" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen flex flex-col bg-[#343a40] text-slate-300 flex-shrink-0">
      {/* Brand */}
      <div className="h-14 flex items-center gap-2 px-4 border-b border-white/10">
        <ShieldCheck className="w-6 h-6 text-purple-400" />
        <span className="font-semibold text-white tracking-wide">JobPilot Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Management
        </p>
        {nav.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded text-sm transition",
                active ? "bg-purple-600 text-white" : "hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Back to app */}
      <div className="p-2 border-t border-white/10">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded text-sm hover:bg-white/5 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to app
        </Link>
      </div>
    </aside>
  );
}
