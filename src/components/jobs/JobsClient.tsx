"use client";

import { useState, useCallback } from "react";
import { JobCard } from "./JobCard";
import { JobFilters } from "./JobFilters";
import { LayoutGrid, List, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Job } from "@/types";

interface Props {
  initialJobs: (Job & { matchScore: number | null })[];
  total: number;
  isPro: boolean;
}

export function JobsClient({ initialJobs, total, isPro }: Props) {
  const [jobs, setJobs] = useState(initialJobs);
  const [count, setCount] = useState(total);
  const [view, setView] = useState<"list" | "grid">("list");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState("Best Match");

  const fetchJobs = useCallback(async (filters: Record<string, string>) => {
    setLoading(true);
    const params = new URLSearchParams(filters);
    const res = await fetch(`/api/jobs?${params}`);
    const data = await res.json();
    setJobs(data.jobs);
    setCount(data.total);
    setLoading(false);
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchJobs({ search });
  }

  return (
    <div className="flex gap-4 max-w-[1400px] mx-auto">
      {/* Filters sidebar */}
      <JobFilters onFilter={fetchJobs} />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jobs, companies, skills..."
                className="bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-72"
              />
            </form>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">{count.toLocaleString()}</span> jobs
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option>Best Match</option>
              <option>Most Recent</option>
              <option>Highest Salary</option>
            </select>
            <div className="flex border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setView("list")}
                className={cn("p-2", view === "list" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground")}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("grid")}
                className={cn("p-2", view === "grid" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground")}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Jobs */}
        {loading ? (
          <div className={cn("gap-3", view === "grid" ? "grid grid-cols-2" : "flex flex-col")}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-xl p-4 animate-pulse h-32" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <p className="text-muted-foreground">No jobs found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className={cn("gap-3", view === "grid" ? "grid grid-cols-2" : "flex flex-col")}>
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} isPro={isPro} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
