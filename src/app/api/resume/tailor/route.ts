import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { tailorResume, generateCoverLetter } from "@/lib/ai";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.plan === "FREE") {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  const { jobId, includeCoverLetter } = await req.json();

  const [resume, job] = await Promise.all([
    db.resume.findUnique({ where: { userId: session.user.id } }),
    db.job.findUnique({ where: { id: jobId } }),
  ]);

  if (!resume) return NextResponse.json({ error: "No resume found" }, { status: 404 });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const [tailored, coverLetter] = await Promise.all([
    tailorResume(resume.content, job.description, job.title, job.company),
    includeCoverLetter
      ? generateCoverLetter(resume.content, job.description, job.title, job.company, session.user.name ?? "")
      : Promise.resolve(null),
  ]);

  await db.tailoredResume.upsert({
    where: { resumeId_jobId: undefined as never } as never,
    update: { content: tailored },
    create: { resumeId: resume.id, jobId, content: tailored },
  }).catch(() =>
    db.tailoredResume.create({ data: { resumeId: resume.id, jobId, content: tailored } })
  );

  return NextResponse.json({ tailored, coverLetter });
}
