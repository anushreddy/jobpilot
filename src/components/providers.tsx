"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { IdleTimeout } from "@/components/IdleTimeout";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      themes={["light", "dark"]}
    >
      <SessionProvider refetchOnWindowFocus>
        <IdleTimeout />
        {children}
        <Toaster />
      </SessionProvider>
    </ThemeProvider>
  );
}
