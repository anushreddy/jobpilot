import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const location = searchParams.get("location") ?? "";
  const platform = searchParams.get("platform") ?? "";
  const remote = searchParams.get("remote") === "true";
  const salaryMin = searchParams.get("salaryMin");
  const salaryMax = searchParams.get("salaryMax");
  const skills = searchParams.get("skills")?.split(",").filter(Boolean) ?? [];
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const where: Record<string, unknown> = { isActive: true };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }
  if (location) where.location = { contains: location, mode: "insensitive" };
  if (platform) where.platform = platform;
  if (remote) where.locationType = "remote";
  if (salaryMin) where.salaryMin = { gte: parseInt(salaryMin) };
  if (salaryMax) where.salaryMax = { lte: parseInt(salaryMax) };
  if (skills.length > 0) where.skills = { hasSome: skills };

  const [jobs, total] = await Promise.all([
    db.job.findMany({
      where,
      orderBy: { postedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.job.count({ where }),
  ]);

  // Get user's preferences to compute match scores
  const prefs = await db.userPreferences.findUnique({
    where: { userId: session.user.id },
  });

  const userSkills = prefs?.skills ?? [];
  const jobsWithMatch = jobs.map((job) => {
    const matchingSkills = job.skills.filter((s) =>
      userSkills.some((us) => us.toLowerCase() === s.toLowerCase())
    );
    const matchScore = userSkills.length > 0
      ? Math.min(99, Math.round((matchingSkills.length / Math.max(job.skills.length, 1)) * 100) + 40)
      : null;

    return { ...job, matchScore };
  });

  return NextResponse.json({
    jobs: jobsWithMatch,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
