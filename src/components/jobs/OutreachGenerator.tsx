"use client";

import { useState } from "react";
import { Mail, Linkedin, FileText, Loader2, Copy, Check, Download, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "cover" | "linkedin" | "email";

const TABS: { kind: Kind; label: string; icon: typeof Mail }[] = [
  { kind: "cover", label: "Cover Letter", icon: FileText },
  { kind: "linkedin", label: "LinkedIn", icon: Linkedin },
  { kind: "email", label: "Email", icon: Mail },
];

export function OutreachGenerator({ jobId, hasResume }: { jobId: string; hasResume: boolean }) {
  const [kind, setKind] = useState<Kind>("cover");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    setCopied(false);
    setSubject("");
    setBody("");
    try {
      const res = await fetch(`/api/jobs/${jobId}/outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Generation failed");
        return;
      }
      setSubject(data.subject ?? "");
      setBody(data.body ?? "");
    } catch {
      setError("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    const text = subject ? `Subject: ${subject}\n\n${body}` : body;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadDoc() {
    const text = subject ? `Subject: ${subject}\n\n${body}` : body;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Calibri,Arial,sans-serif;font-size:11pt;white-space:pre-wrap;line-height:1.5;">${text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")}</body></html>`;
    const blob = new Blob(["﻿", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cover-letter.doc";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!hasResume) {
    return (
      <div className="glass rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-1">Cover letter & outreach</h2>
        <p className="text-xs text-muted-foreground">Upload a resume to generate a cover letter and outreach messages.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Cover letter & outreach</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card rounded-lg p-1 border border-border">
        {TABS.map((t) => (
          <button
            key={t.kind}
            onClick={() => { setKind(t.kind); setBody(""); setSubject(""); setError(""); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition",
              kind === t.kind ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={generate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg text-sm font-medium hover:from-purple-500 hover:to-violet-500 transition disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {loading ? "Generating..." : body ? "Regenerate" : `Generate ${TABS.find((t) => t.kind === kind)?.label}`}
      </button>

      {body && (
        <div className="space-y-2">
          {subject && (
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          )}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full h-56 bg-secondary/40 border border-border rounded-lg p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y leading-relaxed"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={copy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            {kind === "cover" && (
              <button
                onClick={downloadDoc}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition"
              >
                <Download className="w-3.5 h-3.5" /> DOC
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
