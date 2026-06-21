import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { scoreResumeForJob } from "@/lib/ats";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const where: Record<string, unknown> = { userId: session.user.id };
  if (status) where.status = status;
  if (search) {
    where.job = {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const [applications, total, resume] = await Promise.all([
    db.application.findMany({
      where,
      include: { job: true },
      orderBy: { appliedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.application.count({ where }),
    db.resume.findUnique({ where: { userId: session.user.id } }),
  ]);

  // Prefer the score captured at apply-time (reflects the resume actually used —
  // tailored or regular). Fall back to scoring the current resume for older
  // applications that predate score capture.
  const withAts = applications.map((app) => {
    // Don't ship the full resume text in the list payload — expose a flag and
    // let the per-application download endpoint stream it on demand.
    const { resumeUsed, ...rest } = app;
    return {
      ...rest,
      hasResumeFile: Boolean(resumeUsed),
      atsScore:
        app.matchScore ??
        (resume
          ? scoreResumeForJob(resume.content, {
              skills: app.job.skills,
              description: app.job.description,
              title: app.job.title,
            })
          : null),
    };
  });

  return NextResponse.json({
    applications: withAts,
    total,
    page,
    hasResume: Boolean(resume),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId, coverLetter, tailored, tailoredContent } = await req.json();

  const existing = await db.application.findUnique({
    where: { userId_jobId: { userId: session.user.id, jobId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already applied" }, { status: 409 });
  }

  const [job, resume] = await Promise.all([
    db.job.findUnique({ where: { id: jobId } }),
    db.resume.findUnique({ where: { userId: session.user.id } }),
  ]);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  // Capture the ATS match score at apply-time, based on which resume was used.
  // Tailored → score the tailored content; Regular → score the current resume.
  const scoringText = tailored && tailoredContent ? tailoredContent : resume?.content ?? "";
  const matchScore = scoringText
    ? scoreResumeForJob(scoringText, {
        skills: job.skills,
        description: job.description,
        title: job.title,
      })
    : null;

  const application = await db.application.create({
    data: {
      userId: session.user.id,
      jobId,
      status: "APPLIED",
      coverLetter,
      matchScore,
      // Snapshot the exact resume used so it's downloadable later.
      resumeUsed: scoringText || null,
      resumeLabel: tailored && tailoredContent ? "Tailored" : "Regular",
      resumeFileName: resume?.fileName ?? null,
    },
    include: { job: true },
  });

  return NextResponse.json(application, { status: 201 });
}
