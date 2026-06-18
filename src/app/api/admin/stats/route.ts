import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalResumes,
    totalJobs,
    totalApplications,
    proUsers,
    usersThisWeek,
    usersLastWeek,
    usersThisMonth,
    usersLastMonth,
  ] = await Promise.all([
    db.user.count(),
    db.resume.count(),
    db.job.count(),
    db.application.count(),
    db.user.count({ where: { plan: { in: ["PRO", "ENTERPRISE"] } } }),
    db.user.count({ where: { createdAt: { gte: weekAgo } } }),
    db.user.count({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
    db.user.count({ where: { createdAt: { gte: monthAgo } } }),
    db.user.count({ where: { createdAt: { gte: twoMonthsAgo, lt: monthAgo } } }),
  ]);

  const pct = (cur: number, prev: number) =>
    prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

  // Daily new-user counts for the last 14 days (for a sparkline/chart).
  const recentUsers = await db.user.findMany({
    where: { createdAt: { gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) } },
    select: { createdAt: true },
  });
  const dailySeries: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = day.toISOString().slice(0, 10);
    dailySeries.push({
      date: key,
      count: recentUsers.filter((u) => u.createdAt.toISOString().slice(0, 10) === key).length,
    });
  }

  return NextResponse.json({
    totalUsers,
    totalResumes,
    totalJobs,
    totalApplications,
    proUsers,
    usersThisWeek,
    usersWeekChange: pct(usersThisWeek, usersLastWeek),
    usersThisMonth,
    usersMonthChange: pct(usersThisMonth, usersLastMonth),
    dailySeries,
  });
}
