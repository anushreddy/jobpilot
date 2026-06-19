import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { statusLabel, statusColor, cn } from "@/lib/utils";

async function getAnalytics(userId: string) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [total, thisWeek, lastWeek, byStatus, applications] = await Promise.all([
    db.application.count({ where: { userId } }),
    db.application.count({ where: { userId, appliedAt: { gte: weekAgo } } }),
    db.application.count({ where: { userId, appliedAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
    db.application.groupBy({ by: ["status"], where: { userId }, _count: true }),
    db.application.findMany({ where: { userId }, select: { status: true, appliedAt: true } }),
  ]);

  const count = (s: string) => byStatus.find((b) => b.status === s)?._count ?? 0;
  const responded = total - count("APPLIED") - count("SAVED");
  const interviews = count("INTERVIEW") + count("OFFER");
  const offers = count("OFFER");

  const rate = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);
  const appChange = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : thisWeek > 0 ? 100 : 0;

  // Applications per week for the last 8 weeks.
  const weekly: { label: string; count: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    weekly.push({
      label: end.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count: applications.filter((a) => a.appliedAt >= start && a.appliedAt < end).length,
    });
  }

  return {
    total,
    thisWeek,
    appChange,
    responseRate: rate(responded, total),
    interviewRate: rate(interviews, total),
    offerRate: rate(offers, total),
    byStatus: byStatus.map((b) => ({ status: b.status, count: b._count })).sort((a, b) => b.count - a.count),
    weekly,
    maxWeekly: Math.max(1, ...weekly.map((w) => w.count)),
  };
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  const a = await getAnalytics(session!.user.id);

  const cards = [
    { label: "Total Applications", value: a.total, change: a.appChange, suffix: "" },
    { label: "Response Rate", value: a.responseRate, suffix: "%" },
    { label: "Interview Rate", value: a.interviewRate, suffix: "%" },
    { label: "Offer Rate", value: a.offerRate, suffix: "%" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your real job-search performance</p>
      </div>

      {a.total === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No data yet</p>
          <p className="text-xs text-muted-foreground">
            Apply to jobs and your analytics will populate here.{" "}
            <a href="/jobs" className="text-primary hover:underline">Browse jobs →</a>
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((c) => (
              <div key={c.label} className="glass rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
                <p className="text-2xl font-bold text-foreground">
                  {c.value}{c.suffix}
                </p>
                {c.change !== undefined && (
                  <p className={cn("flex items-center gap-1 text-xs font-medium mt-1", c.change >= 0 ? "text-green-400" : "text-red-400")}>
                    {c.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {c.change >= 0 ? "+" : ""}{c.change}% vs last week
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Applications over time */}
            <div className="glass rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Applications — Last 8 Weeks</h3>
              <div className="flex items-end justify-between gap-2 h-40">
                {a.weekly.map((w, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full flex items-end justify-center" style={{ height: "120px" }}>
                      <div
                        className="w-full max-w-[28px] rounded-t bg-gradient-to-t from-purple-600 to-violet-400 transition-all"
                        style={{ height: `${(w.count / a.maxWeekly) * 100}%`, minHeight: w.count > 0 ? "4px" : "0" }}
                        title={`${w.count} applications`}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground">{w.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status breakdown */}
            <div className="glass rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Applications by Status</h3>
              <div className="space-y-3">
                {a.byStatus.map((s) => (
                  <div key={s.status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", statusColor(s.status))}>
                        {statusLabel(s.status)}
                      </span>
                      <span className="text-xs font-medium text-foreground">{s.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-400"
                        style={{ width: `${(s.count / a.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
