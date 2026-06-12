"use client";

import { useState, useEffect } from "react";
import { Upload, FileText, Save, Loader2, Lock } from "lucide-react";
import { useSession } from "next-auth/react";

export default function ResumePage() {
  const { data: session } = useSession();
  const isPro = session?.user.plan !== "FREE";
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("my_resume.txt");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/resume")
      .then((r) => r.json())
      .then((data) => {
        if (data?.content) {
          setContent(data.content);
          setFileName(data.fileName);
        }
        setLoading(false);
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    await fetch("/api/resume", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName, content }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setContent(ev.target?.result as string);
    reader.readAsText(file);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Resume</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Upload and manage your resume</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-4 py-2 glass rounded-lg text-sm font-medium text-foreground hover:bg-secondary/50 transition cursor-pointer">
            <Upload className="w-4 h-4" />
            Upload Resume
            <input type="file" accept=".txt,.pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} />
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/80 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

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
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-4 bg-secondary rounded mb-2" style={{ width: `${60 + Math.random() * 40}%` }} />
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

      {/* Pro AI Tailor section */}
      <div className={`glass rounded-xl p-5 ${!isPro ? "opacity-80" : ""}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-sm font-semibold text-white">AI Resume Tailoring</h2>
              {!isPro && (
                <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  <Lock className="w-2.5 h-2.5" /> Pro
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              AI automatically tailors your resume for each job application to maximize match score.
            </p>
          </div>
        </div>
        {!isPro && (
          <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Upgrade to Pro to enable AI-powered resume tailoring and auto-apply features.
            </p>
            <a
              href="/settings?tab=billing"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white text-sm font-medium rounded-lg hover:from-purple-500 hover:to-violet-500 transition"
            >
              Upgrade to Pro
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
