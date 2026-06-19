"use client";

import { useState } from "react";
import { Sparkles, Loader2, RefreshCw, Cloud, FileText, FileType, Check } from "lucide-react";
import type { TailoredResumeDoc } from "@/types/resume";

interface Props {
  hasResume: boolean;
}

export function JdTailor({ hasResume }: Props) {
  const [jd, setJd] = useState("");
  const [doc, setDoc] = useState<TailoredResumeDoc | null>(null);
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
      setDoc(data.doc);
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
    if (!doc) return;
    const blob = new Blob(["﻿", buildDocHtml(doc)], { type: "application/msword" });
    triggerDownload(blob, `${slug(doc.name)}-resume.doc`);
  }

  async function downloadPdf() {
    if (!doc) return;
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    renderPdf(doc, jsPDF, autoTable);
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
        {generating ? "Generating..." : doc ? "Generate again" : "Generate tailored resume"}
      </button>

      {doc && (
        <div className="space-y-3 pt-2 border-t border-border">
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

          {/* Formatted preview */}
          <ResumePreview doc={doc} />
        </div>
      )}
    </div>
  );
}

function ResumePreview({ doc }: { doc: TailoredResumeDoc }) {
  return (
    <div className="bg-white text-slate-800 rounded-lg border border-border p-6 max-h-[560px] overflow-auto">
      <h3 className="text-lg font-bold">{doc.name}</h3>
      <p className="text-sm text-purple-700 font-medium">{doc.title}</p>
      <p className="text-xs text-slate-500 mb-4">{doc.contact}</p>

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

/* ---------- DOC (Word HTML) ---------- */
function buildDocHtml(doc: TailoredResumeDoc): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const li = (arr: string[]) => arr.map((b) => `<li>${esc(b)}</li>`).join("");

  const skillsRows = doc.skills
    .map(
      (s) =>
        `<tr><td style="padding:4px 8px;border:1px solid #ddd;font-weight:bold;width:30%;">${esc(
          s.category
        )}</td><td style="padding:4px 8px;border:1px solid #ddd;">${esc(s.items.join(", "))}</td></tr>`
    )
    .join("");

  const expBlocks = doc.experience
    .map(
      (e) => `
      <p style="margin:8px 0 2px;"><b>${esc(e.role)} · ${esc(e.company)}</b>
        <span style="float:right;color:#666;">${esc(e.period)}</span></p>
      ${e.location ? `<p style="margin:0;color:#888;font-size:10pt;">${esc(e.location)}</p>` : ""}
      <ul style="margin:2px 0 8px;">${li(e.bullets)}</ul>`
    )
    .join("");

  const eduBlocks = doc.education
    .map((ed) => `<p style="margin:2px 0;">${esc(ed.degree)}, ${esc(ed.school)} <span style="color:#666;">(${esc(ed.period)})</span></p>`)
    .join("");

  const heading = (t: string) =>
    `<h3 style="border-bottom:1px solid #999;text-transform:uppercase;font-size:11pt;color:#444;margin:14px 0 6px;">${t}</h3>`;

  return `<!DOCTYPE html><html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head>
  <body style="font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#222;">
    <h1 style="margin:0;font-size:18pt;">${esc(doc.name)}</h1>
    <p style="margin:0;color:#6b21a8;font-weight:bold;">${esc(doc.title)}</p>
    <p style="margin:0 0 6px;color:#666;font-size:10pt;">${esc(doc.contact)}</p>
    ${doc.summary.length ? heading("Summary") + `<ul>${li(doc.summary)}</ul>` : ""}
    ${doc.skills.length ? heading("Skills") + `<table style="border-collapse:collapse;width:100%;">${skillsRows}</table>` : ""}
    ${doc.experience.length ? heading("Experience") + expBlocks : ""}
    ${doc.education.length ? heading("Education") + eduBlocks : ""}
  </body></html>`;
}

/* ---------- PDF (jsPDF + autotable) ---------- */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderPdf(doc: TailoredResumeDoc, JsPDF: any, autoTable: any) {
  const pdf = new JsPDF({ unit: "pt", format: "letter" });
  const margin = 48;
  const width = pdf.internal.pageSize.getWidth() - margin * 2;
  const pageH = pdf.internal.pageSize.getHeight();
  let y = margin;

  const ensure = (h: number) => {
    if (y + h > pageH - margin) { pdf.addPage(); y = margin; }
  };
  const heading = (t: string) => {
    ensure(24);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(80);
    pdf.text(t.toUpperCase(), margin, y);
    pdf.setDrawColor(180);
    pdf.line(margin, y + 3, margin + width, y + 3);
    y += 16;
    pdf.setTextColor(34);
  };
  const bullets = (arr: string[]) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    arr.forEach((b) => {
      const lines = pdf.splitTextToSize(b, width - 14) as string[];
      ensure(lines.length * 13);
      pdf.text("•", margin, y);
      pdf.text(lines, margin + 12, y);
      y += lines.length * 13;
    });
    y += 4;
  };

  // Header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(doc.name || "Resume", margin, y); y += 20;
  pdf.setFontSize(11);
  pdf.setTextColor(107, 33, 168);
  pdf.text(doc.title || "", margin, y); y += 14;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(110);
  pdf.text(doc.contact || "", margin, y); y += 16;
  pdf.setTextColor(34);

  if (doc.summary?.length) { heading("Summary"); bullets(doc.summary); }

  if (doc.skills?.length) {
    heading("Skills");
    autoTable(pdf, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 130 } },
      body: doc.skills.map((s) => [s.category, s.items.join(", ")]),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (pdf as any).lastAutoTable.finalY + 12;
  }

  if (doc.experience?.length) {
    heading("Experience");
    doc.experience.forEach((e) => {
      ensure(20);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10.5);
      pdf.text(`${e.role} · ${e.company}`, margin, y);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(110);
      pdf.text(e.period || "", margin + width, y, { align: "right" });
      pdf.setTextColor(34);
      y += 14;
      bullets(e.bullets);
    });
  }

  if (doc.education?.length) {
    heading("Education");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    doc.education.forEach((ed) => {
      ensure(14);
      pdf.text(`${ed.degree}, ${ed.school}`, margin, y);
      pdf.setTextColor(110);
      pdf.text(ed.period || "", margin + width, y, { align: "right" });
      pdf.setTextColor(34);
      y += 14;
    });
  }

  pdf.save(`${slug(doc.name)}-resume.pdf`);
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
