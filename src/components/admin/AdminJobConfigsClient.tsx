"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Plus, Trash2, Loader2, ChevronLeft, ChevronRight, X,
  MapPin, Globe, Power,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JobConfig {
  id: string;
  roleTitle: string;
  roleAliases: string[];
  city: string | null;
  state: string | null;
  country: string;
  isRemoteSearch: boolean;
  isActive: boolean;
  priority: number;
  lastFetchedAt: string | null;
  lastFetchStatus: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  rate_limited: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
};

export function AdminJobConfigsClient() {
  const [configs, setConfigs] = useState<JobConfig[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (countryFilter) params.set("country", countryFilter);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/admin/job-configs?${params}`);
    const data = await res.json();
    setConfigs(data.configs ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [page, search, countryFilter, statusFilter]);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  async function toggleActive(c: JobConfig) {
    // Optimistic flip; revert on failure.
    setConfigs((prev) => prev.map((x) => (x.id === c.id ? { ...x, isActive: !x.isActive } : x)));
    const res = await fetch(`/api/admin/job-configs/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    if (!res.ok) {
      setConfigs((prev) => prev.map((x) => (x.id === c.id ? { ...x, isActive: c.isActive } : x)));
      alert("Failed to update status");
    }
  }

  async function remove(c: JobConfig) {
    if (!confirm(`Delete the "${c.roleTitle}" search config?`)) return;
    const res = await fetch(`/api/admin/job-configs/${c.id}`, { method: "DELETE" });
    if (res.ok) {
      setConfigs((prev) => prev.filter((x) => x.id !== c.id));
      setTotal((t) => t - 1);
    } else {
      const d = await res.json();
      alert(d.error ?? "Failed to delete");
    }
  }

  function locationLabel(c: JobConfig) {
    if (c.isRemoteSearch) return "Remote";
    const parts = [c.city, c.state].filter(Boolean);
    return parts.length ? parts.join(", ") : "Nationwide";
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-border p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search role or city..."
            className="w-full bg-slate-50 dark:bg-secondary/50 border border-slate-200 dark:border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          />
        </div>
        <input
          value={countryFilter}
          onChange={(e) => { setCountryFilter(e.target.value.toUpperCase().slice(0, 2)); setPage(1); }}
          placeholder="Country"
          className="w-24 bg-slate-50 dark:bg-secondary/50 border border-slate-200 dark:border-border rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-purple-500/40"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-slate-50 dark:bg-secondary/50 border border-slate-200 dark:border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition"
        >
          <Plus className="w-4 h-4" /> Add Role
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-secondary/40">
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Country</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Last Fetch</th>
              <th className="px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-border/50">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-slate-100 dark:bg-secondary rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : configs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">
                  No search roles yet. Add one to start the sync pipeline.
                </td>
              </tr>
            ) : (
              configs.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 dark:border-border/50 hover:bg-slate-50 dark:hover:bg-secondary/30 transition">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-700 dark:text-foreground">{c.roleTitle}</div>
                    {c.roleAliases.length > 0 && (
                      <div className="text-xs text-slate-400 mt-0.5">{c.roleAliases.join(" · ")}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      {c.isRemoteSearch ? <Globe className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                      {locationLabel(c)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-muted-foreground">{c.country}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-secondary dark:text-muted-foreground">
                      P{c.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-500 dark:text-muted-foreground">
                      {c.lastFetchedAt ? new Date(c.lastFetchedAt).toLocaleString() : "Never"}
                    </div>
                    {c.lastFetchStatus && (
                      <span className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        STATUS_STYLES[c.lastFetchStatus] ?? "bg-slate-100 text-slate-600 dark:bg-secondary dark:text-muted-foreground"
                      )}>
                        {c.lastFetchStatus}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(c)}
                      className={cn(
                        "inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full transition",
                        c.isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 hover:bg-emerald-200"
                          : "bg-slate-100 text-slate-500 dark:bg-secondary dark:text-muted-foreground hover:bg-slate-200"
                      )}
                    >
                      <Power className="w-3 h-3" />
                      {c.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => remove(c)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-destructive/10 rounded transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-border/50">
          <p className="text-xs text-slate-500 dark:text-muted-foreground">
            {total} role{total !== 1 ? "s" : ""} · page {page} of {pages}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded border border-slate-200 dark:border-border disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-secondary transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="p-1.5 rounded border border-slate-200 dark:border-border disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-secondary transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showAdd && (
        <AddRoleModal
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); setPage(1); fetchConfigs(); }}
        />
      )}
    </div>
  );
}

function AddRoleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    roleTitle: "",
    roleAliases: "",
    city: "",
    state: "",
    country: "US",
    isRemoteSearch: false,
    priority: 5,
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const payload = {
      roleTitle: form.roleTitle,
      roleAliases: form.roleAliases.split(",").map((s) => s.trim()).filter(Boolean),
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      country: form.country,
      isRemoteSearch: form.isRemoteSearch,
      priority: Number(form.priority),
      isActive: form.isActive,
    };
    const res = await fetch("/api/admin/job-configs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    onCreated();
  }

  const inputCls =
    "w-full bg-slate-50 dark:bg-secondary/50 border border-slate-200 dark:border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-card rounded-xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-foreground">Add Search Role</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            value={form.roleTitle}
            onChange={(e) => setForm((f) => ({ ...f, roleTitle: e.target.value }))}
            placeholder="Role title (e.g. Data Engineer)"
            required
            className={inputCls}
          />
          <input
            value={form.roleAliases}
            onChange={(e) => setForm((f) => ({ ...f, roleAliases: e.target.value }))}
            placeholder="Aliases, comma-separated (e.g. DE, ETL Engineer)"
            className={inputCls}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              placeholder="City"
              disabled={form.isRemoteSearch}
              className={cn(inputCls, form.isRemoteSearch && "opacity-50")}
            />
            <input
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
              placeholder="State (e.g. NY)"
              disabled={form.isRemoteSearch}
              className={cn(inputCls, form.isRemoteSearch && "opacity-50")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value.toUpperCase().slice(0, 2) }))}
              placeholder="Country (ISO)"
              maxLength={2}
              required
              className={cn(inputCls, "uppercase")}
            />
            <select
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
              className={inputCls}
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((p) => (
                <option key={p} value={p}>Priority {p}{p === 1 ? " (highest)" : ""}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-muted-foreground">
              <input
                type="checkbox"
                checked={form.isRemoteSearch}
                onChange={(e) => setForm((f) => ({ ...f, isRemoteSearch: e.target.checked }))}
                className="accent-purple-600"
              />
              Remote search
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-muted-foreground">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="accent-purple-600"
              />
              Active
            </label>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Create Role
          </button>
        </form>
      </div>
    </div>
  );
}
