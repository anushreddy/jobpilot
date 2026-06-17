import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { tailorResume, generateCoverLetter } from "@/lib/ai";
import { getStorage, tailoredResumeKey, coverLetterKey } from "@/lib/storage";

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

  // Persist the AI-generated artifacts to object storage under per-user, per-job keys.
  const storage = getStorage();
  const storageKey = tailoredResumeKey(session.user.id, jobId);
  await storage.put(storageKey, Buffer.from(tailored, "utf-8"), "text/plain");

  let clKey: string | null = null;
  if (coverLetter) {
    clKey = coverLetterKey(session.user.id, jobId);
    await storage.put(clKey, Buffer.from(coverLetter, "utf-8"), "text/plain");
  }

  // One tailored record per (resume, job) — overwrite on re-generate.
  const saved = await db.tailoredResume.upsert({
    where: { resumeId_jobId: { resumeId: resume.id, jobId } },
    update: { content: tailored, storageKey, coverLetter, coverLetterKey: clKey },
    create: {
      resumeId: resume.id,
      jobId,
      content: tailored,
      storageKey,
      coverLetter,
      coverLetterKey: clKey,
    },
  });

  return NextResponse.json({ tailored, coverLetter, storageKey, id: saved.id });
}
