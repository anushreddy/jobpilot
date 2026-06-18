"use client";

import { useSession, signOut } from "next-auth/react";
import { Bell, LogOut, Settings, User, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import Image from "next/image";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function Header() {
  const { data: session } = useSession();
  const name = session?.user.name?.split(" ")[0] ?? "there";

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          {greeting()}, {name} 👋
        </h1>
        <p className="text-xs text-muted-foreground">Let&apos;s accelerate your next opportunity.</p>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <button className="relative p-2 rounded-lg hover:bg-secondary transition text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary/50 transition">
              {session?.user.image ? (
                <Image src={session.user.image} alt="" width={36} height={36} className="rounded-full" />
              ) : (
                <span className="text-sm font-bold text-white">
                  {session?.user.name?.[0]?.toUpperCase() ?? "U"}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-border">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-foreground">{session?.user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{session?.user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings?tab=profile" className="flex items-center gap-2 cursor-pointer">
                <User className="w-4 h-4" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings className="w-4 h-4" /> Settings
              </Link>
            </DropdownMenuItem>
            {session?.user.role === "ADMIN" && (
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center gap-2 cursor-pointer text-purple-400 focus:text-purple-400">
                  <ShieldCheck className="w-4 h-4" /> Admin Panel
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-destructive focus:text-destructive cursor-pointer flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
