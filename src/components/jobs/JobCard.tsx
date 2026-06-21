"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, ExternalLink, Zap, MapPin, Building2 } from "lucide-react";
import { cn, platformColor, formatSalary, timeAgo } from "@/lib/utils";
import { AtsPie } from "./AtsPie";
import type { Job } from "@/types";

interface Props {
  job: Job & { matchScore?: number | null };
  isPro: boolean;
}

const PLATFORM_LABEL: Record<string, string> = {
  LINKEDIN: "LinkedIn",
  INDEED: "Indeed",
  GLASSDOOR: "Glassdoor",
  WELLFOUND: "Wellfound",
  LEVER: "Lever",
  GREENHOUSE: "Greenhouse",
  WORKDAY: "Workday",
  OTHER: "Other",
};

export function JobCard({ job, isPro }: Props) {
  const router = useRouter();
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleApply() {
    if (applied) return;
    setApplying(true);
    try {
      await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });
      setApplied(true);
    } finally {
      setApplying(false);
    }
  }

  const matchScore = job.matchScore;
  const matchColor =
    !matchScore ? "text-muted-foreground" :
    matchScore >= 80 ? "text-green-400" :
    matchScore >= 60 ? "text-blue-400" :
    "text-yellow-400";

  return (
    <div
      onClick={() => router.push(`/jobs/${job.id}`)}
      className="glass rounded-xl p-4 hover:border-primary/30 transition-all group cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {/* Company logo */}
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-violet-600/10 border border-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {job.companyLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.companyLogo} alt={job.company} className="w-8 h-8 object-contain" />
          ) : (
            <Building2 className="w-5 h-5 text-primary/60" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">{job.company}</p>
              <h3 className="text-sm font-semibold text-foreground mt-0.5 leading-tight">{job.title}</h3>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {job.atsScore != null && (
                <div className="flex flex-col items-center">
                  <AtsPie score={job.atsScore} size={40} />
                  <p className="text-[10px] text-muted-foreground mt-0.5">ATS</p>
                </div>
              )}
              {matchScore != null && (
                <div className="text-right">
                  <p className={cn("text-lg font-bold", matchColor)}>{matchScore}%</p>
                  <p className="text-[10px] text-muted-foreground -mt-0.5">Match</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" /> {job.location}
            </span>
            <span className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded-full border",
              job.locationType === "remote" ? "text-green-400 bg-green-400/10 border-green-400/20" :
              job.locationType === "hybrid" ? "text-blue-400 bg-blue-400/10 border-blue-400/20" :
              "text-muted-foreground bg-muted border-border"
            )}>
              {job.locationType}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatSalary(job.salaryMin, job.salaryMax)}
            </span>
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {job.skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-secondary text-muted-foreground border border-border"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-between mt-3 pt-3 border-t border-border/50"
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: platformColor(job.platform) + "33", color: platformColor(job.platform) }}
          >
            {PLATFORM_LABEL[job.platform]}
          </span>
          <span className="text-[10px] text-muted-foreground">{timeAgo(job.postedAt)}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSaved(!saved)}
            className={cn("p-1.5 rounded-lg transition", saved ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary")}
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>

          <a
            href={job.platformUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => router.push(`/jobs/${job.id}`)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-foreground border border-border hover:bg-secondary transition"
          >
            Details
          </button>

          {isPro ? (
            <button
              onClick={handleApply}
              disabled={applying || applied}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition",
                applied
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-primary text-white hover:bg-primary/80"
              )}
            >
              {applied ? "Applied" : applying ? "Applying..." : (
                <><Zap className="w-3 h-3" /> Auto Apply</>
              )}
            </button>
          ) : (
            <button
              onClick={handleApply}
              disabled={applying || applied}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition",
                applied
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-secondary hover:bg-secondary/70 text-foreground border border-border"
              )}
            >
              {applied ? "Applied" : applying ? "..." : "Mark Applied"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
