"use client";

import { useState } from "react";
import { X, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onFilter: (filters: Record<string, string>) => void;
}

const EXPERIENCE_LEVELS = ["Entry Level", "Mid Level", "Senior Level", "Director", "Executive"];
const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const PLATFORMS = ["LINKEDIN", "INDEED", "GLASSDOOR", "WELLFOUND"];

export function JobFilters({ onFilter }: Props) {
  const [location, setLocation] = useState("New York, NY");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [salaryMin, setSalaryMin] = useState(80000);
  const [salaryMax, setSalaryMax] = useState(200000);
  const [experienceLevels, setExperienceLevels] = useState<string[]>(["Mid Level", "Senior Level"]);
  const [jobTypes, setJobTypes] = useState<string[]>(["Full-time"]);
  const [skills, setSkills] = useState<string[]>(["React", "TypeScript", "Next.js", "Tailwind CSS"]);
  const [skillInput, setSkillInput] = useState("");

  function toggleItem<T>(arr: T[], item: T, setter: (v: T[]) => void) {
    setter(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  }

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills([...skills, s]);
    setSkillInput("");
  }

  function applyFilters() {
    onFilter({
      location,
      remote: remoteOnly ? "true" : "",
      salaryMin: salaryMin.toString(),
      salaryMax: salaryMax.toString(),
      skills: skills.join(","),
    });
  }

  return (
    <div className="w-60 flex-shrink-0">
      <div className="glass rounded-xl p-4 sticky top-20 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground/80">FILTERS</p>
          <button
            onClick={() => {
              setLocation("");
              setRemoteOnly(false);
              setExperienceLevels([]);
              setJobTypes([]);
              setSkills([]);
              onFilter({});
            }}
            className="text-xs text-primary hover:text-primary/80 transition"
          >
            Reset
          </button>
        </div>

        {/* Search */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Search</p>
          <input
            type="text"
            placeholder="Job title, keyword, or company"
            className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        {/* Location */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Location</p>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-lg pl-7 pr-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <div
              onClick={() => setRemoteOnly(!remoteOnly)}
              className={cn(
                "w-4 h-4 rounded border flex items-center justify-center transition",
                remoteOnly ? "bg-primary border-primary" : "border-border"
              )}
            >
              {remoteOnly && <span className="text-white text-[10px] leading-none">✓</span>}
            </div>
            <span className="text-xs text-muted-foreground">Remote only</span>
          </label>
        </div>

        {/* Experience */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Experience Level</p>
          <div className="space-y-1.5">
            {EXPERIENCE_LEVELS.map((level) => (
              <label key={level} className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => toggleItem(experienceLevels, level, setExperienceLevels)}
                  className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition",
                    experienceLevels.includes(level) ? "bg-primary border-primary" : "border-border"
                  )}
                >
                  {experienceLevels.includes(level) && <span className="text-white text-[10px] leading-none">✓</span>}
                </div>
                <span className="text-xs text-muted-foreground">{level}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Job Type */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Job Type</p>
          <div className="space-y-1.5">
            {JOB_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => toggleItem(jobTypes, type, setJobTypes)}
                  className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition",
                    jobTypes.includes(type) ? "bg-primary border-primary" : "border-border"
                  )}
                >
                  {jobTypes.includes(type) && <span className="text-white text-[10px] leading-none">✓</span>}
                </div>
                <span className="text-xs text-muted-foreground">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Salary */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Salary Range</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>${(salaryMin / 1000).toFixed(0)}K</span>
            <span>${salaryMax >= 200000 ? "200K+" : (salaryMax / 1000).toFixed(0) + "K"}</span>
          </div>
          <input
            type="range"
            min={40000}
            max={250000}
            step={10000}
            value={salaryMin}
            onChange={(e) => setSalaryMin(Number(e.target.value))}
            className="w-full accent-purple-500"
          />
        </div>

        {/* Skills */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Skills</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20"
              >
                {skill}
                <button onClick={() => setSkills(skills.filter((s) => s !== skill))}>
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSkill()}
              placeholder="Add skill..."
              className="flex-1 bg-secondary/50 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <button
              onClick={addSkill}
              className="px-2 py-1.5 bg-primary/20 text-primary rounded-lg text-xs hover:bg-primary/30 transition"
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={applyFilters}
          className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white font-medium py-2 rounded-lg text-sm hover:from-purple-500 hover:to-violet-500 transition-all"
        >
          Apply Filters
        </button>

        <button className="w-full border border-border text-muted-foreground hover:text-foreground py-2 rounded-lg text-xs transition">
          Save Search
        </button>
      </div>
    </div>
  );
}
