"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Trash2, Loader2, ChevronLeft, ChevronRight, X, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  plan: string;
  role: string;
  emailVerified: string | null;
  createdAt: string;
  _count: { applications: number };
  resume: { id: string } | null;
}

export function AdminUsersClient() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (planFilter) params.set("plan", planFilter);
    if (roleFilter) params.set("role", roleFilter);
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.users ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [page, search, planFilter, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function deleteUser(id: string, email: string) {
    if (!confirm(`Delete ${email}? This removes all their data.`)) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setTotal((t) => t - 1);
    } else {
      const d = await res.json();
      alert(d.error ?? "Failed to delete");
    }
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
            placeholder="Search name or email..."
            className="w-full bg-slate-50 dark:bg-secondary/50 border border-slate-200 dark:border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
          className="bg-slate-50 dark:bg-secondary/50 border border-slate-200 dark:border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All plans</option>
          <option value="FREE">Free</option>
          <option value="PRO">Pro</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="bg-slate-50 dark:bg-secondary/50 border border-slate-200 dark:border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All roles</option>
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-slate-50 dark:bg-secondary/40">
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Verified</th>
              <th className="px-4 py-3 font-medium">Apps</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-border/50">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-slate-100 dark:bg-secondary rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">No users found.</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 dark:border-border/50 hover:bg-slate-50 dark:hover:bg-secondary/30 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-300">
                          {(u.name ?? u.email)[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-slate-700 dark:text-foreground">{u.name ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      u.plan === "FREE" ? "bg-slate-100 text-slate-600 dark:bg-secondary dark:text-muted-foreground" :
                      "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300"
                    )}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      u.role === "ADMIN" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" :
                      "bg-slate-100 text-slate-600 dark:bg-secondary dark:text-muted-foreground"
                    )}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.emailVerified ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-muted-foreground">{u._count.applications}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteUser(u.id, u.email)}
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
            {total} user{total !== 1 ? "s" : ""} · page {page} of {pages}
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
        <AddUserModal
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); setPage(1); fetchUsers(); }}
        />
      )}
    </div>
  );
}

function AddUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", plan: "FREE", role: "USER" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-card rounded-xl w-full max-w-md p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-foreground">Add User</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Full name"
            required
            className="w-full bg-slate-50 dark:bg-secondary/50 border border-slate-200 dark:border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          />
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Email"
            required
            className="w-full bg-slate-50 dark:bg-secondary/50 border border-slate-200 dark:border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Password (min 8 chars)"
            required
            minLength={8}
            className="w-full bg-slate-50 dark:bg-secondary/50 border border-slate-200 dark:border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.plan}
              onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
              className="bg-slate-50 dark:bg-secondary/50 border border-slate-200 dark:border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="FREE">Free</option>
              <option value="PRO">Pro</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="bg-slate-50 dark:bg-secondary/50 border border-slate-200 dark:border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Create User
          </button>
        </form>
      </div>
    </div>
  );
}
