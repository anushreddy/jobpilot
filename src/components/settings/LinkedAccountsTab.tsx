"use client";

import { useEffect, useState } from "react";
import { Link2, Loader2, Check, X } from "lucide-react";

const PLATFORMS = [
  { platform: "LINKEDIN", name: "LinkedIn", placeholder: "https://www.linkedin.com/in/your-handle", note: "Added to your AI-tailored resumes" },
  { platform: "INDEED", name: "Indeed", placeholder: "Indeed profile URL or username", note: "Used for auto-apply" },
  { platform: "GLASSDOOR", name: "Glassdoor", placeholder: "Glassdoor profile URL or username", note: "Used for auto-apply" },
] as const;

export function LinkedAccountsTab() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/linked-accounts")
      .then((r) => r.json())
      .then((data) => {
        const map: Record<string, string> = {};
        (data.accounts ?? []).forEach((a: { platform: string; username: string | null }) => {
          if (a.username) map[a.platform] = a.username;
        });
        setValues(map);
      });
  }, []);

  async function save(platform: string) {
    setSavingKey(platform);
    await fetch("/api/linked-accounts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, username: values[platform] ?? "" }),
    });
    setSavingKey(null);
    setSavedKey(platform);
    setTimeout(() => setSavedKey(null), 2000);
  }

  async function disconnect(platform: string) {
    await fetch("/api/linked-accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform }),
    });
    setValues((v) => ({ ...v, [platform]: "" }));
  }

  return (
    <div className="space-y-3">
      {PLATFORMS.map((p) => {
        const connected = Boolean(values[p.platform]);
        return (
          <div key={p.platform} className="glass rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Link2 className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  {connected && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                      <Check className="w-2.5 h-2.5" /> Connected
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{p.note}</p>
              </div>
              {connected && (
                <button
                  onClick={() => disconnect(p.platform)}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition"
                  title="Disconnect"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={values[p.platform] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [p.platform]: e.target.value }))}
                placeholder={p.placeholder}
                className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={() => save(p.platform)}
                disabled={savingKey === p.platform}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/80 transition disabled:opacity-50"
              >
                {savingKey === p.platform ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {savedKey === p.platform ? "Saved" : "Save"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
