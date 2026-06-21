"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, FileText, Sparkles } from "lucide-react";
import { JdTailor } from "@/components/resume/JdTailor";
import { resumeDocToText, type TailoredResumeDoc } from "@/types/resume";

interface Props {
  jobId: string;
  hasResume: boolean;
  alreadyApplied: boolean;
  jobTitle: string;
  company: string;
  jobDescription: string;
  skills: string[];
}

export function JobDetailTailor({
  jobId,
  hasResume,
  alreadyApplied,
  jobTitle,
  company,
  jobDescription,
  skills,
}: Props) {
  const router = useRouter();
  const [tailoredDoc, setTailoredDoc] = useState<TailoredResumeDoc | null>(null);
  const [applied, setApplied] = useState(alreadyApplied);
  const [applying, setApplying] = useState<"regular" | "tailored" | null>(null);

  // Compose a rich JD so the AI and ATS scoring see the title + key skills.
  const presetJd = [
    `Job Title: ${jobTitle}`,
    `Company: ${company}`,
    skills.length ? `Key Skills: ${skills.join(", ")}` : "",
    "",
    jobDescription,
  ]
    .filter(Boolean)
    .join("\n");

  async function apply(tailored: boolean) {
    setApplying(tailored ? "tailored" : "regular");
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          tailored,
          tailoredContent: tailored && tailoredDoc ? resumeDocToText(tailoredDoc) : undefined,
        }),
      });
      if (res.ok || res.status === 409) {
        setApplied(true);
        router.refresh();
      }
    } finally {
      setApplying(null);
    }
  }

  return (
    <div className="space-y-4">
      <JdTailor
        hasResume={hasResume}
        presetJd={presetJd}
        compact
        jobSkills={skills}
        jobTitle={jobTitle}
        onSaved={() => router.refresh()}
        onDocChange={setTailoredDoc}
      />

      {/* Apply controls */}
      <div className="glass rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Mark as applied</h2>
        {applied ? (
          <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2.5">
            <Check className="w-4 h-4" /> Applied — see it in My Applications
          </div>
        ) : !hasResume ? (
          <p className="text-xs text-muted-foreground">Upload a resume to mark this job as applied.</p>
        ) : (
          <>
            <button
              onClick={() => apply(true)}
              disabled={!tailoredDoc || applying !== null}
              title={!tailoredDoc ? "Generate a tailored resume first" : ""}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg text-sm font-medium hover:from-purple-500 hover:to-violet-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {applying === "tailored" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Apply with tailored resume
            </button>
            <button
              onClick={() => apply(false)}
              disabled={applying !== null}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-secondary transition disabled:opacity-50"
            >
              {applying === "regular" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Apply with current resume
            </button>
            <p className="text-[11px] text-muted-foreground">
              Applying with the tailored resume records its higher match score on the application.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
