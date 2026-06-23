"use client";

import { useState } from "react";
import { Sparkles, Loader2, RefreshCw, Cloud, FileText, FileType, Check } from "lucide-react";
import { AtsPie } from "@/components/jobs/AtsPie";
import { buildResumePdf, buildResumeDocHtml } from "@/lib/resume-pdf";
import type { TailoredResumeDoc } from "@/types/resume";

interface Props {
  hasResume: boolean;
  onSaved?: (storageKey?: string) => void;
  presetJd?: string;       // prefill the JD (e.g. from a job details page)
  compact?: boolean;       // hide the heading/JD box label when embedded
  jobSkills?: string[];    // when tailoring for a specific job: its required skills
  jobTitle?: string;       // and its title — used for job-aware match scoring
  onDocChange?: (doc: TailoredResumeDoc | null) => void; // lift the tailored result
}

export function JdTailor({ hasResume, onSaved, presetJd, compact, jobSkills, jobTitle, onDocChange }: Props) {
  const [jd, setJd] = useState(presetJd ?? "");
  const [doc, setDoc] = useState<TailoredResumeDoc | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    if (jd.trim().length < 30) {
      setError("Paste a fuller job description (at least a few sentences).");
      return;
    }
    setError("");
    setGenerating(true);
    setSaved(false);
    try {
      const res = await fetch("/api/resume/tailor-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jd, jobSkills, jobTitle }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Generation failed");
        return;
      }
      setDoc(data.doc);
      setMatchScore(data.matchScore ?? null);
      onDocChange?.(data.doc);
    } catch {
      setError("Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function saveToCloud() {
    if (!doc) return;
    setSaving(true);
    try {
      const res = await fetch("/api/resume/tailor-jd", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jd, doc }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaved(true);
        // Pass the cloud storage key so callers can link the saved resume.
        onSaved?.(data.storageKey);
        setTimeout(() => setSaved(false), 2500);
      } else {
        const d = await res.json();
        setError(d.error ?? "Save failed");
      }
    } finally {
      setSaving(false);
    }
  }

  function downloadDoc() {
    if (!doc) return;
    const blob = new Blob(["﻿", buildResumeDocHtml(doc)], { type: "application/msword" });
    triggerDownload(blob, `${slug(doc.name)}-resume.doc`);
  }

  async function downloadPdf() {
    if (!doc) return;
    const bytes = await buildResumePdf(doc);
    triggerDownload(new Blob([bytes], { type: "application/pdf" }), `${slug(doc.name)}-resume.pdf`);
  }

  if (!hasResume) {
    return (
      <div className="glass rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-1">Tailor resume to a job description</h2>
        <p className="text-xs text-muted-foreground">
          Upload your resume above first, then paste a JD here to generate a tailored version.
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">
          {compact ? "Tailor your resume to this job" : "Tailor resume to a job description"}
        </h2>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          {compact ? "Job description (editable)" : "Paste the job description"}
        </label>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the full JD — responsibilities, requirements, tech stack..."
          className="w-full h-40 bg-secondary/50 border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={generate}
        disabled={generating}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg text-sm font-medium hover:from-purple-500 hover:to-violet-500 transition disabled:opacity-50"
      >
        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {generating ? "Generating..." : doc ? "Generate again" : "Generate tailored resume"}
      </button>

      {doc && (
        <div className="space-y-3 pt-2 border-t border-border">
          {/* Match score */}
          {matchScore != null && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <AtsPie score={matchScore} size={48} />
              <div>
                <p className="text-sm font-semibold text-foreground">JD Match Score</p>
                <p className="text-xs text-muted-foreground">
                  How well this tailored resume aligns with the pasted job description.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs font-medium text-muted-foreground">Tailored resume</p>
            <div className="flex items-center gap-1.5">
              <button onClick={generate} disabled={generating}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} /> Regenerate
              </button>
              <button onClick={saveToCloud} disabled={saving}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition disabled:opacity-50">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Cloud className="w-3.5 h-3.5" />}
                {saved ? "Saved" : "Save to cloud"}
              </button>
              <button onClick={downloadDoc}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition">
                <FileText className="w-3.5 h-3.5" /> DOC
              </button>
              <button onClick={downloadPdf}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition">
                <FileType className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>

          {/* Formatted preview (hidden in compact / job-detail mode) */}
          {!compact && <ResumePreview doc={doc} />}
        </div>
      )}
    </div>
  );
}

function ResumePreview({ doc }: { doc: TailoredResumeDoc }) {
  return (
    <div className="bg-white text-slate-800 rounded-lg border border-border p-8 max-h-[600px] overflow-auto leading-relaxed">
      <div className="text-center mb-5">
        <h3 className="text-2xl font-bold tracking-tight">{doc.name}</h3>
        {doc.title && <p className="text-sm text-slate-600 mt-0.5">{doc.title}</p>}
        <p className="text-xs text-slate-500 mt-1">{doc.contact}</p>
      </div>

      {doc.summary?.length > 0 && (
        <Section title="Summary">
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {doc.summary.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        </Section>
      )}

      {doc.skills?.length > 0 && (
        <Section title="Skills">
          <table className="w-full text-sm border-collapse">
            <tbody>
              {doc.skills.map((s, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="py-1.5 pr-3 font-semibold text-slate-700 align-top whitespace-nowrap">{s.category}</td>
                  <td className="py-1.5 text-slate-600">{s.items.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {doc.experience?.length > 0 && (
        <Section title="Experience">
          <div className="space-y-3">
            {doc.experience.map((e, i) => (
              <div key={i}>
                <div className="flex justify-between items-baseline">
                  <p className="text-sm font-semibold">{e.role} · {e.company}</p>
                  <p className="text-xs text-slate-500">{e.period}</p>
                </div>
                {e.location && <p className="text-xs text-slate-400">{e.location}</p>}
                <ul className="list-disc pl-5 space-y-0.5 text-sm mt-1">
                  {e.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      {doc.education?.length > 0 && (
        <Section title="Education">
          <div className="space-y-1 text-sm">
            {doc.education.map((ed, i) => (
              <div key={i} className="flex justify-between">
                <span>{ed.degree}, {ed.school}</span>
                <span className="text-xs text-slate-500">{ed.period}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 mb-2">
        {title}
      </h4>
      {children}
    </div>
  );
}


function slug(s: string) {
  return (s || "tailored").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "tailored";
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
