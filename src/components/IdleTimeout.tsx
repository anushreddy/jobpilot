"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";

// Sign the user out after this much inactivity.
const IDLE_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Watches for user activity and signs out (→ /login) after a period of
 * inactivity. Only active while authenticated.
 */
export function IdleTimeout() {
  const { status } = useSession();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        signOut({ callbackUrl: "/login?expired=1" });
      }, IDLE_MS);
    };

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (timer.current) clearTimeout(timer.current);
    };
  }, [status]);

  return null;
}
