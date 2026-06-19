"use client";

import { useState, useEffect } from "react";
import { Upload, FileText, Save, Loader2, Trash2, Clock } from "lucide-react";
import { AtsPie } from "@/components/jobs/AtsPie";
import { JdTailor } from "@/components/resume/JdTailor";

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ResumePage() {
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("my_resume.txt");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [hasResume, setHasResume] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/resume")
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) {
          setContent(data.content ?? "");
          setFileName(data.fileName);
          setAtsScore(data.atsScore ?? null);
          setUpdatedAt(data.updatedAt ?? null);
          setHasResume(true);
        }
        setLoading(false);
      });
  }, []);

  async function handleDelete() {
    if (!confirm("Delete your resume? This also removes the uploaded file.")) return;
    setDeleting(true);
    await fetch("/api/resume", { method: "DELETE" });
    setContent("");
    setFileName("my_resume.txt");
    setAtsScore(null);
    setUpdatedAt(null);
    setSelectedFile(null);
    setHasResume(false);
    setDeleting(false);
  }

  // Save through the upload endpoint so the file lands in the local /uploads folder.
  async function handleSave() {
    setSaving(true);
    const form = new FormData();
    if (selectedFile) form.append("file", selectedFile);
    form.append("fileName", fileName);
    form.append("content", content);

    const res = await fetch("/api/resume/upload", { method: "POST", body: form });
    const data = await res.json();
    if (data?.atsScore != null) setAtsScore(data.atsScore);
    if (data?.updatedAt) setUpdatedAt(data.updatedAt);
    if (data?.fileName) setFileName(data.fileName);
    setHasResume(true);
    setSelectedFile(null);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setSelectedFile(file);
    // Preview text contents for text-based files.
    if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const reader = new FileReader();
      reader.onload = (ev) => setContent(ev.target?.result as string);
      reader.readAsText(file);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {atsScore != null && <AtsPie score={atsScore} size={52} />}
          <div>
            <h1 className="text-xl font-bold text-foreground">Resume</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {atsScore != null ? "ATS readability score" : "Upload and manage your resume"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-4 py-2 glass rounded-lg text-sm font-medium text-foreground hover:bg-secondary/50 transition cursor-pointer">
            <Upload className="w-4 h-4" />
            {hasResume ? "Replace Resume" : "Upload Resume"}
            <input type="file" accept=".txt,.pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} />
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/80 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      {/* Uploaded resume summary */}
      {hasResume && !loading && (
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
            {updatedAt && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" /> Last updated {formatTimestamp(updatedAt)}
              </p>
            )}
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 border border-destructive/20 rounded-lg transition disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Delete
          </button>
        </div>
      )}

      {/* Resume editor */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <FileText className="w-4 h-4 text-primary" />
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="bg-transparent text-sm font-medium text-foreground focus:outline-none flex-1"
          />
        </div>
        {loading ? (
          <div className="p-4 animate-pulse">
            {[88, 72, 95, 64, 80, 90, 68, 84, 76, 92].map((w, i) => (
              <div key={i} className="h-4 bg-secondary rounded mb-2" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your resume content here, or upload a file above..."
            className="w-full h-[500px] bg-transparent p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none font-mono leading-relaxed"
          />
        )}
      </div>

      {/* AI: tailor resume to a pasted JD */}
      <JdTailor hasResume={hasResume} />
    </div>
  );
}
