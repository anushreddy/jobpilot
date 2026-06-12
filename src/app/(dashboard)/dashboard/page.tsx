import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ApplyVelocityGauge } from "@/components/dashboard/ApplyVelocityGauge";
import { RecentApplications } from "@/components/dashboard/RecentApplications";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { NextActions } from "@/components/dashboard/NextActions";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

async function getDashboardData(userId: string) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [total, thisWeek, lastWeek, interviews, weeklyInterviews, weeklyResponses, offers, prefs, recent] =
    await Promise.all([
      db.application.count({ where: { userId } }),
      db.application.count({ where: { userId, appliedAt: { gte: weekAgo } } }),
      db.application.count({ where: { userId, appliedAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
      db.application.count({ where: { userId, status: { in: ["INTERVIEW", "OFFER"] } } }),
      db.application.count({ where: { userId, status: "INTERVIEW", updatedAt: { gte: weekAgo } } }),
      db.application.count({ where: { userId, status: { not: "APPLIED" }, updatedAt: { gte: weekAgo } } }),
      db.application.count({ where: { userId, status: "OFFER" } }),
      db.userPreferences.findUnique({ where: { userId } }),
      db.application.findMany({
        where: { userId },
        include: { job: true },
        orderBy: { appliedAt: "desc" },
        take: 5,
      }),
    ]);

  const matchedJobs = await db.job.count({
    where: {
      isActive: true,
      ...(prefs?.skills?.length ? { skills: { hasSome: prefs.skills } } : {}),
    },
  });

  const appChange = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;
  const interviewRate = total > 0 ? Math.round((interviews / total) * 100) : 0;
  const responseRate = thisWeek > 0 ? Math.round((weeklyResponses / thisWeek) * 100) : 0;
  const velocityScore = Math.min(99, Math.round((thisWeek / 15) * 100));

  return {
    matchedJobs,
    total,
    appChange,
    interviewRate,
    responseRate,
    thisWeek,
    weeklyInterviews,
    weeklyResponses,
    offers,
    velocityScore,
    // Serialize dates for client components
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentSerialized: recent.map((a: any) => ({
    ...a,
    appliedAt: a.appliedAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    job: { ...a.job, postedAt: a.job.postedAt.toISOString(), createdAt: a.job.createdAt.toISOString() },
  })),
    prefs,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const data = await getDashboardData(session!.user.id);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Apply Velocity */}
        <div className="glass rounded-xl p-5 col-span-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-foreground/80">APPLY VELOCITY</p>
          </div>
          <ApplyVelocityGauge score={data.velocityScore} />
          <p className="text-center text-xs text-muted-foreground mt-2">
            You&apos;re applying <span className="text-white font-semibold">2.3x faster</span> than your peers this week.
          </p>
          <div className="mt-3 flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
            <Zap className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              You&apos;re in the top <span className="text-white font-medium">12%</span> of active candidates.
            </p>
            <Link href="/analytics" className="ml-auto text-xs text-primary font-medium whitespace-nowrap flex items-center gap-1">
              View Analytics <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* This week stats */}
        <div className="glass rounded-xl p-5 col-span-1">
          <p className="text-sm font-semibold text-foreground/80 mb-4">THIS WEEK</p>
          <div className="space-y-4">
            {[
              { label: "Applications", value: data.thisWeek, change: 28 },
              { label: "Interviews", value: data.weeklyInterviews, change: 50 },
              { label: "Responses", value: data.weeklyResponses, change: 25 },
              { label: "Offers", value: data.offers, change: 100 },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-white">{item.value}</p>
                  <span className="text-xs text-green-400 font-medium">↑ {item.change}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <AIInsights userId={session!.user.id} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="MATCHED JOBS" value={data.matchedJobs} change={16} />
        <StatsCard label="APPLICATIONS" value={data.total} change={data.appChange} />
        <StatsCard label="INTERVIEW RATE" value={data.interviewRate} suffix="%" change={6} />
        <StatsCard label="RESPONSE RATE" value={data.responseRate} suffix="%" change={10} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <RecentApplications applications={data.recentSerialized} />
        </div>
        <div className="lg:col-span-2">
          <NextActions matchedJobs={data.matchedJobs} />
        </div>
      </div>
    </div>
  );
}
