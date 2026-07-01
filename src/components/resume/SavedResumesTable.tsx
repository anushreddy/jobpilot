"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Sparkles, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SavedResume {
  id: string;
  name: string;
  kind: string;
  atsScore: number | null;
  createdAt: string;
  hasFile: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export function SavedResumesTable({ refreshSignal }: { refreshSignal: number }) {
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/resumes")
      .then((r) => r.json())
      .then((data) => setResumes(data.resumes ?? []))
      .finally(() => setLoading(false));
  }, [refreshSignal]);

  async function remove(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This removes the file from storage permanently.`)) return;
    setDeletingId(id);
    const res = await fetch(`/api/resumes/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) setResumes((prev) => prev.filter((r) => r.id !== id));
    else alert("Failed to delete resume");
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">My Resumes</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Uploaded originals and AI-tailored resumes saved to cloud</p>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Saved</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <tr key={i} className="border-b border-border/50">
                {Array.from({ length: 4 }).map((_, j) => (
                  <td key={j} className="px-5 py-3"><div className="h-4 bg-secondary rounded animate-pulse" /></td>
                ))}
              </tr>
            ))
          ) : resumes.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">
                No saved resumes yet. Upload a resume or save a tailored one to the cloud.
              </td>
            </tr>
          ) : (
            resumes.map((r) => (
              <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-white/[0.02] transition">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                      r.kind === "tailored" ? "bg-primary/10 border border-primary/20" : "bg-secondary border border-border"
                    )}>
                      {r.kind === "tailored"
                        ? <Sparkles className="w-3.5 h-3.5 text-primary" />
                        : <FileText className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                    <span className="text-sm font-medium text-foreground">{r.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                    r.kind === "tailored"
                      ? "bg-primary/15 text-primary border-primary/25"
                      : "bg-secondary text-muted-foreground border-border"
                  )}>
                    {r.kind === "tailored" ? "Tailored" : "Original"}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground">{formatDate(r.createdAt)}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    {r.hasFile && (
                      <a
                        href={`/api/resumes/${r.id}/download`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    )}
                    <button
                      onClick={() => remove(r.id, r.name)}
                      disabled={deletingId === r.id}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition disabled:opacity-50"
                      title="Delete resume"
                    >
                      {deletingId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
