"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-14 h-7" />;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className={`
        relative flex items-center w-14 h-7 rounded-full border transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
        ${isDark
          ? "bg-primary/20 border-primary/30"
          : "bg-amber-100 border-amber-300"
        }
      `}
    >
      {/* Track icons */}
      <Moon
        className={`absolute left-1.5 w-4 h-4 transition-opacity duration-200 ${isDark ? "opacity-100 text-primary" : "opacity-30 text-slate-400"}`}
      />
      <Sun
        className={`absolute right-1.5 w-4 h-4 transition-opacity duration-200 ${!isDark ? "opacity-100 text-amber-500" : "opacity-30 text-slate-500"}`}
      />
      {/* Thumb */}
      <span
        className={`
          absolute top-0.5 w-6 h-6 rounded-full shadow-md transition-all duration-300
          ${isDark
            ? "left-0.5 bg-primary"
            : "left-[calc(100%-1.625rem)] bg-amber-400"
          }
        `}
      />
    </button>
  );
}
