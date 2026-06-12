import { JobsClient } from "@/components/jobs/JobsClient";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function JobsPage() {
  const session = await getServerSession(authOptions);
  const prefs = await db.userPreferences.findUnique({
    where: { userId: session!.user.id },
  });

  const initialJobs = await db.job.findMany({
    where: { isActive: true },
    orderBy: { postedAt: "desc" },
    take: 20,
  });

  const total = await db.job.count({ where: { isActive: true } });

  const userSkills = prefs?.skills ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jobsWithMatch = (initialJobs as any[]).map((job) => {
    const matchingSkills = (job.skills as string[]).filter((s: string) =>
      userSkills.some((us: string) => us.toLowerCase() === s.toLowerCase())
    );
    const matchScore = userSkills.length > 0
      ? Math.min(99, Math.round((matchingSkills.length / Math.max(job.skills.length, 1)) * 100) + 40)
      : null;
    return {
      ...job,
      matchScore,
      postedAt: job.postedAt instanceof Date ? job.postedAt.toISOString() : job.postedAt,
      createdAt: job.createdAt instanceof Date ? job.createdAt.toISOString() : job.createdAt,
    };
  });

  return (
    <JobsClient
      initialJobs={jobsWithMatch}
      total={total}
      isPro={session?.user.plan !== "FREE"}
    />
  );
}
