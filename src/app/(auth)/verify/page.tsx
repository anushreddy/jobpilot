"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Zap, MailCheck } from "lucide-react";

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  function setDigit(i: number, val: string) {
    const clean = val.replace(/\D/g, "");
    if (!clean && val !== "") return;
    const next = [...digits];
    next[i] = clean.slice(-1);
    setDigits(next);
    if (clean && i < 5) inputs.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  }

  function onPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length) {
      const next = text.split("");
      while (next.length < 6) next.push("");
      setDigits(next);
      inputs.current[Math.min(text.length, 5)]?.focus();
    }
    e.preventDefault();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Enter all 6 digits");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Verification failed");
      setLoading(false);
      return;
    }

    // Verified — send them to login (Google users never reach here).
    router.push("/login?verified=1");
  }

  async function resend() {
    setResending(true);
    setError("");
    await fetch("/api/auth/resend-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setResending(false);
    setResent(true);
    setTimeout(() => setResent(false), 3000);
  }

  return (
    <div className="glass rounded-2xl p-8 glow-purple">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-foreground">Intervo</span>
      </div>

      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
        <MailCheck className="w-6 h-6 text-primary" />
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-1">Verify your email</h1>
      <p className="text-muted-foreground text-sm mb-8">
        We sent a 6-digit code to{" "}
        <span className="text-foreground font-medium">{email || "your email"}</span>.
      </p>

      <form onSubmit={submit}>
        <div className="flex justify-between gap-2 mb-4" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl font-bold bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition"
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Verify email
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Didn&apos;t get a code?{" "}
        <button
          onClick={resend}
          disabled={resending}
          className="text-primary hover:text-primary/80 font-medium transition disabled:opacity-50"
        >
          {resending ? "Sending..." : resent ? "Code sent!" : "Resend"}
        </button>
      </p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyForm />
    </Suspense>
  );
}
