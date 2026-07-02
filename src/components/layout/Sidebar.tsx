"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  BarChart3,
  Bell,
  MessageSquare,
  Settings,
  Mail,
  Zap,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/my-jobs", icon: FileText, label: "My Applications" },
  { href: "/resume", icon: FileText, label: "Resume" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/alerts", icon: Bell, label: "Alerts" },
  { href: "/messages", icon: MessageSquare, label: "Messages" },
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/contact", icon: Mail, label: "Contact Us" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isPro = session?.user.plan === "PRO" || session?.user.plan === "ENTERPRISE";

  return (
    <aside className="w-[220px] min-h-screen flex flex-col bg-card border-r border-border">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-foreground text-lg">Intervo</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade banner (free users) */}
      {!isPro && (
        <div className="mx-3 mb-4 p-3 rounded-xl bg-gradient-to-br from-purple-600/20 to-violet-600/10 border border-purple-500/20">
          <p className="text-xs font-semibold text-foreground mb-0.5">Upgrade Pro</p>
          <p className="text-xs text-muted-foreground mb-2.5">Unlock advanced analytics, AI insights, and more.</p>
          <Link
            href="/settings?tab=billing"
            className="block w-full text-center text-xs font-semibold bg-gradient-to-r from-purple-600 to-violet-600 text-white py-1.5 rounded-lg hover:from-purple-500 hover:to-violet-500 transition-all"
          >
            Upgrade Now
          </Link>
        </div>
      )}

      {/* User */}
      <div className="px-3 pb-4">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-secondary transition cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {session?.user.image ? (
              <Image src={session.user.image} alt="" width={32} height={32} className="rounded-full" />
            ) : (
              <span className="text-xs font-bold text-white">
                {session?.user.name?.[0]?.toUpperCase() ?? "U"}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{session?.user.name ?? "User"}</p>
            <p className="text-[10px] text-muted-foreground">{isPro ? "Pro Plan" : "Free Plan"}</p>
          </div>
          <ChevronUp className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>
    </aside>
  );
}
