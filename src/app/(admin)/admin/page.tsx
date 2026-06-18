import { db } from "@/lib/db";
import { Users, FileText, Briefcase, Send, TrendingUp, TrendingDown } from "lucide-react";
import { AdminUserGrowthChart } from "@/components/admin/AdminUserGrowthChart";

async function getStats() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [totalUsers, totalResumes, totalJobs, totalApplications, usersThisWeek, usersLastWeek, usersThisMonth, usersLastMonth, recentUsers] =
    await Promise.all([
      db.user.count(),
      db.resume.count(),
      db.job.count(),
      db.application.count(),
      db.user.count({ where: { createdAt: { gte: weekAgo } } }),
      db.user.count({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
      db.user.count({ where: { createdAt: { gte: monthAgo } } }),
      db.user.count({ where: { createdAt: { gte: twoMonthsAgo, lt: monthAgo } } }),
      db.user.findMany({
        where: { createdAt: { gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) } },
        select: { createdAt: true },
      }),
    ]);

  const pct = (cur: number, prev: number) =>
    prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

  const series: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = day.toISOString().slice(0, 10);
    series.push({
      date: day.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count: recentUsers.filter((u) => u.createdAt.toISOString().slice(0, 10) === key).length,
    });
  }

  return {
    totalUsers,
    totalResumes,
    totalJobs,
    totalApplications,
    usersThisWeek,
    usersWeekChange: pct(usersThisWeek, usersLastWeek),
    usersThisMonth,
    usersMonthChange: pct(usersThisMonth, usersLastMonth),
    series,
  };
}

const CARDS = [
  { key: "totalUsers", label: "Total Users", icon: Users, color: "bg-purple-500" },
  { key: "totalResumes", label: "Resumes Uploaded", icon: FileText, color: "bg-blue-500" },
  { key: "totalJobs", label: "Total Jobs", icon: Briefcase, color: "bg-emerald-500" },
  { key: "totalApplications", label: "Applications", icon: Send, color: "bg-amber-500" },
] as const;

export default async function AdminDashboardPage() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-foreground">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-muted-foreground">Platform overview</p>
      </div>

      {/* Stat cards (AdminLTE small-box style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map((card) => (
          <div
            key={card.key}
            className={`${card.color} rounded-lg text-white p-5 relative overflow-hidden shadow-sm`}
          >
            <p className="text-3xl font-bold">{(stats[card.key] as number).toLocaleString()}</p>
            <p className="text-sm opacity-90 mt-1">{card.label}</p>
            <card.icon className="absolute right-3 top-3 w-12 h-12 opacity-25" />
          </div>
        ))}
      </div>

      {/* Growth widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GrowthCard
          label="New Users — This Week"
          value={stats.usersThisWeek}
          change={stats.usersWeekChange}
          sub="vs previous week"
        />
        <GrowthCard
          label="New Users — This Month"
          value={stats.usersThisMonth}
          change={stats.usersMonthChange}
          sub="vs previous month"
        />
        <div className="bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-border p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-600 dark:text-muted-foreground mb-1">Conversion</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-foreground">
            {stats.totalUsers > 0 ? Math.round((stats.totalResumes / stats.totalUsers) * 100) : 0}%
          </p>
          <p className="text-xs text-slate-400 mt-1">users with a resume uploaded</p>
        </div>
      </div>

      {/* User growth chart */}
      <div className="bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-border p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-foreground mb-4">
          New Users — Last 14 Days
        </h3>
        <AdminUserGrowthChart data={stats.series} />
      </div>
    </div>
  );
}

function GrowthCard({ label, value, change, sub }: { label: string; value: number; change: number; sub: string }) {
  const up = change >= 0;
  return (
    <div className="bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-border p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-600 dark:text-muted-foreground mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-slate-800 dark:text-foreground">{value.toLocaleString()}</p>
        <span className={`flex items-center gap-1 text-sm font-medium ${up ? "text-emerald-500" : "text-red-500"}`}>
          {up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {up ? "+" : ""}{change}%
        </span>
      </div>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}
