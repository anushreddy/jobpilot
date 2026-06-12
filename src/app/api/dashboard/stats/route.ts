import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [total, thisWeek, lastWeek, interviews, offers, prefs, recent] = await Promise.all([
    db.application.count({ where: { userId } }),
    db.application.count({ where: { userId, appliedAt: { gte: weekAgo } } }),
    db.application.count({ where: { userId, appliedAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
    db.application.count({ where: { userId, status: { in: ["INTERVIEW", "OFFER"] } } }),
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

  const weeklyInterviews = await db.application.count({
    where: { userId, status: "INTERVIEW", updatedAt: { gte: weekAgo } },
  });
  const weeklyResponses = await db.application.count({
    where: { userId, status: { not: "APPLIED" }, updatedAt: { gte: weekAgo } },
  });

  const interviewRate = total > 0 ? Math.round((interviews / total) * 100) : 0;
  const responseRate = total > 0 ? Math.round((weeklyResponses / Math.max(thisWeek, 1)) * 100) : 0;
  const appChange = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;
  const velocityScore = Math.min(99, Math.round((thisWeek / 15) * 100));

  return NextResponse.json({
    matchedJobs,
    matchedJobsChange: 16,
    applications: total,
    applicationsChange: appChange,
    interviewRate,
    interviewRateChange: 6,
    responseRate,
    responseRateChange: 10,
    weeklyApplications: thisWeek,
    weeklyInterviews,
    weeklyResponses,
    weeklyOffers: offers,
    applyVelocityScore: velocityScore,
    recentApplications: recent,
  });
}
