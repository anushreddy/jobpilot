"use client";

import { useState } from "react";
import { Bell, Plus, X } from "lucide-react";

interface Alert {
  id: string;
  keywords: string;
  location: string;
  frequency: string;
  active: boolean;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: "1", keywords: "Frontend Engineer", location: "New York, NY", frequency: "Daily", active: true },
    { id: "2", keywords: "React TypeScript", location: "Remote", frequency: "Instant", active: true },
  ]);
  const [form, setForm] = useState({ keywords: "", location: "", frequency: "Daily" });

  function addAlert() {
    if (!form.keywords) return;
    setAlerts((prev) => [
      ...prev,
      { id: Date.now().toString(), ...form, active: true },
    ]);
    setForm({ keywords: "", location: "", frequency: "Daily" });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Job Alerts</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Get notified when new matching jobs are posted</p>
      </div>

      {/* Create alert */}
      <div className="glass rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Create New Alert</h2>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <input
            value={form.keywords}
            onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
            placeholder="Job title or keywords"
            className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder="Location (or Remote)"
            className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <select
            value={form.frequency}
            onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
            className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option>Instant</option>
            <option>Daily</option>
            <option>Weekly</option>
          </select>
        </div>
        <button
          onClick={addAlert}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/80 transition"
        >
          <Plus className="w-4 h-4" /> Create Alert
        </button>
      </div>

      {/* Alerts list */}
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div key={alert.id} className="glass rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Bell className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{alert.keywords}</p>
                <p className="text-xs text-muted-foreground">{alert.location} · {alert.frequency}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                Active
              </span>
              <button
                onClick={() => setAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
