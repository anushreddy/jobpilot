"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ExternalLink, Trash2, FileText } from "lucide-react";
import { cn, statusColor, statusLabel, timeAgo, formatSalary } from "@/lib/utils";
import { AtsPie } from "@/components/jobs/AtsPie";
import type { Application } from "@/types";

const STATUS_OPTIONS = ["All", "SAVED", "APPLIED", "UNDER_REVIEW", "INTERVIEW", "OFFER", "REJECTED"];

export default function MyJobsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [hasResume, setHasResume] = useState(true);

  async function fetchApplications(status?: string, q?: string) {
    setLoading(true);
    const params = new URLSearchParams();
    if (status && status !== "All") params.set("status", status);
    if (q) params.set("search", q);
    const res = await fetch(`/api/applications?${params}`);
    const data = await res.json();
    setApplications(data.applications ?? []);
    setTotal(data.total ?? 0);
    setHasResume(Boolean(data.hasResume));
    setLoading(false);
  }

  useEffect(() => { fetchApplications(); }, []);

  function handleStatusFilter(status: string) {
    setActiveStatus(status);
    fetchApplications(status, search);
  }

  async function deleteApplication(id: string) {
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
    setApplications((prev) => prev.filter((a) => a.id !== id));
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const updated = await res.json();
    setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">My Applications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} total applications</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchApplications(activeStatus, search)}
              placeholder="Search company or role..."
              className="bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
            />
          </div>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-card rounded-xl p-1 border border-border overflow-x-auto scrollbar-hide">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            onClick={() => handleStatusFilter(status)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition",
              activeStatus === status
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {status === "All" ? "All" : statusLabel(status)}
          </button>
        ))}
      </div>

      {/* Resume prompt — ATS scores need a resume on file */}
      {!loading && !hasResume && (
        <div className="glass rounded-xl p-4 flex items-center gap-3 border-primary/20">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Upload your resume to see ATS scores</p>
            <p className="text-xs text-muted-foreground">
              Each application will show how well your resume matches that job.
            </p>
          </div>
          <Link
            href="/resume"
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/80 transition whitespace-nowrap"
          >
            Upload Resume
          </Link>
        </div>
      )}

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Company</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Location</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Salary</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">ATS</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Applied</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-secondary rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">
                  No applications found.{" "}
                  <a href="/jobs" className="text-primary hover:underline">Browse jobs →</a>
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app.id} className="border-b border-border/50 last:border-0 hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-primary">{app.job.company[0]}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{app.job.company}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{app.job.title}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{app.job.location}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatSalary(app.job.salaryMin, app.job.salaryMax)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {app.atsScore != null ? (
                      <div className="flex justify-center">
                        <AtsPie score={app.atsScore} />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{timeAgo(app.appliedAt)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={app.status}
                      onChange={(e) => updateStatus(app.id, e.target.value)}
                      className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full border-0 focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer",
                        statusColor(app.status)
                      )}
                    >
                      {STATUS_OPTIONS.slice(1).map((s) => (
                        <option key={s} value={s}>{statusLabel(s)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <a
                        href={app.job.platformUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => deleteApplication(app.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
