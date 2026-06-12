import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn, statusColor, statusLabel, timeAgo } from "@/lib/utils";
import type { Application } from "@/types";

interface Props {
  applications: Application[];
}

export function RecentApplications({ applications }: Props) {
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-foreground/80">RECENT APPLICATIONS</p>
        <Link href="/my-jobs" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition">
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No applications yet.</p>
          <Link href="/jobs" className="text-xs text-primary mt-1 inline-block">Browse jobs →</Link>
        </div>
      ) : (
        <div className="space-y-0">
          <div className="grid grid-cols-12 text-[10px] font-medium text-muted-foreground uppercase tracking-wider pb-2 border-b border-border">
            <span className="col-span-3">Company</span>
            <span className="col-span-3">Role</span>
            <span className="col-span-2">Match</span>
            <span className="col-span-2">Applied</span>
            <span className="col-span-2">Status</span>
          </div>
          {applications.map((app) => (
            <div key={app.id} className="grid grid-cols-12 items-center py-3 border-b border-border/50 last:border-0 hover:bg-white/[0.02] transition rounded">
              <div className="col-span-3 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-purple-300">
                    {app.job.company[0]}
                  </span>
                </div>
                <span className="text-xs font-medium text-foreground truncate">{app.job.company}</span>
              </div>
              <span className="col-span-3 text-xs text-muted-foreground truncate">{app.job.title}</span>
              <div className="col-span-2">
                {app.matchScore != null && (
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-400"
                        style={{ width: `${app.matchScore}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{app.matchScore}%</span>
                  </div>
                )}
              </div>
              <span className="col-span-2 text-xs text-muted-foreground">{timeAgo(app.appliedAt)}</span>
              <div className="col-span-2">
                <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", statusColor(app.status))}>
                  {statusLabel(app.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
