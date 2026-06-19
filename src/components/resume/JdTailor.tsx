"use client";

import { useState } from "react";
import { Sparkles, Loader2, RefreshCw, Cloud, FileText, FileType, Check } from "lucide-react";

interface Props {
  hasResume: boolean;
}

export function JdTailor({ hasResume }: Props) {
  const [jd, setJd] = useState("");
  const [output, setOutput] = useState("");
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
        body: JSON.stringify({ jobDescription: jd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Generation failed");
        return;
      }
      setOutput(data.content);
    } finally {
      setGenerating(false);
    }
  }

  async function saveToCloud() {
    setSaving(true);
    try {
      const res = await fetch("/api/resume/tailor-jd", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jd, content: output }),
      });
      if (res.ok) {
        setSaved(true);
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
    // Word-compatible HTML document.
    const html = `<!DOCTYPE html><html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head>
      <body><div style="font-family:Calibri,Arial,sans-serif;font-size:11pt;white-space:pre-wrap;line-height:1.4;">${escapeHtml(
        output
      )}</div></body></html>`;
    const blob = new Blob(["﻿", html], { type: "application/msword" });
    triggerDownload(blob, "tailored-resume.doc");
  }

  async function downloadPdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const margin = 48;
    const width = doc.internal.pageSize.getWidth() - margin * 2;
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);

    const lines = doc.splitTextToSize(output, width) as string[];
    let y = margin;
    const lineHeight = 14;
    for (const line of lines) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    }
    doc.save("tailored-resume.pdf");
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
        <h2 className="text-sm font-semibold text-foreground">Tailor resume to a job description</h2>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          Paste the job description
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
        {generating ? "Generating..." : output ? "Generate again" : "Generate tailored resume"}
      </button>

      {output && (
        <div className="space-y-3 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Tailored resume (editable)</p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={generate}
                disabled={generating}
                title="Regenerate"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} /> Regenerate
              </button>
              <button
                onClick={saveToCloud}
                disabled={saving}
                title="Save to cloud (AWS S3)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Cloud className="w-3.5 h-3.5" />}
                {saved ? "Saved" : "Save to cloud"}
              </button>
              <button
                onClick={downloadDoc}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition"
              >
                <FileText className="w-3.5 h-3.5" /> DOC
              </button>
              <button
                onClick={downloadPdf}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition"
              >
                <FileType className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>
          <textarea
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            className="w-full h-[420px] bg-secondary/40 border border-border rounded-lg p-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y font-mono leading-relaxed"
          />
        </div>
      )}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
