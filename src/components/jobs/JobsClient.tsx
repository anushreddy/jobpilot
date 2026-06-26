"use client";

import { useState, useCallback } from "react";
import { JobCard } from "./JobCard";
import { JobFilters } from "./JobFilters";
import { LayoutGrid, List, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Job } from "@/types";

const PAGE_SIZE = 20;

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
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(Math.max(1, Math.ceil(total / PAGE_SIZE)));
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  // Runs a query for a given filter set + page, and keeps everything in sync.
  const runQuery = useCallback(async (filters: Record<string, string>, nextPage: number) => {
    setLoading(true);
    const params = new URLSearchParams({ ...filters, page: String(nextPage) });
    const res = await fetch(`/api/jobs?${params}`);
    const data = await res.json();
    setJobs(data.jobs);
    setCount(data.total);
    setPages(Math.max(1, data.pages ?? 1));
    setPage(data.page ?? nextPage);
    setActiveFilters(filters);
    setLoading(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Filters/search reset to page 1.
  const fetchJobs = useCallback((filters: Record<string, string>) => runQuery(filters, 1), [runQuery]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    runQuery({ ...activeFilters, search }, 1);
  }

  function goToPage(p: number) {
    if (p < 1 || p > pages || p === page) return;
    runQuery(activeFilters, p);
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
            <p className="text-sm font-medium text-foreground mb-1">No results found</p>
            <p className="text-xs text-muted-foreground">
              {search
                ? `No jobs match "${search}". Try a different title or keyword.`
                : "Try adjusting your filters."}
            </p>
          </div>
        ) : (
          <div className={cn("gap-3", view === "grid" ? "grid grid-cols-2" : "flex flex-col")}>
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} isPro={isPro} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && jobs.length > 0 && pages > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, count)} of {count.toLocaleString()}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-secondary transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <span className="text-xs text-muted-foreground px-2">Page {page} of {pages}</span>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= pages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-secondary transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
