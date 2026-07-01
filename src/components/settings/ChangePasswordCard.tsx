"use client";

import { useState } from "react";
import { Loader2, Lock, Check } from "lucide-react";

export function ChangePasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (next.length < 8) return setError("New password must be at least 8 characters");
    if (next !== confirm) return setError("New passwords do not match");
    setSaving(true);
    const res = await fetch("/api/user/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error ?? "Failed to change password");
    setDone(true);
    setCurrent(""); setNext(""); setConfirm("");
    setTimeout(() => setDone(false), 2500);
  }

  const cls =
    "w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Change Password</h2>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Current password</label>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required className={cls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">New password</label>
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} className={cls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Confirm new password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className={cls} />
          </div>
        </div>
        {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/80 transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : done ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          {done ? "Password changed" : "Update password"}
        </button>
      </form>
    </div>
  );
}
