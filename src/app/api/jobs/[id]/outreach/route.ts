import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateCoverLetter, generateOutreachMessage } from "@/lib/ai";

type RouteContext = { params: Promise<{ id: string }> };

/** Generates a cover letter or a LinkedIn/Email outreach message for a job. */
export async function POST(req: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const { kind } = await req.json(); // "cover" | "linkedin" | "email"

  const [job, resume] = await Promise.all([
    db.job.findUnique({ where: { id } }),
    db.resume.findUnique({ where: { userId: session.user.id } }),
  ]);

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (!resume?.content) {
    return NextResponse.json({ error: "Upload a resume first" }, { status: 404 });
  }

  const userName = session.user.name ?? "";

  try {
    if (kind === "cover") {
      const body = await generateCoverLetter(resume.content, job.description, job.title, job.company, userName);
      return NextResponse.json({ body });
    }
    if (kind === "linkedin" || kind === "email") {
      const result = await generateOutreachMessage(
        kind,
        resume.content,
        job.title,
        job.company,
        job.description,
        userName
      );
      return NextResponse.json(result);
    }
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  } catch (err) {
    console.error("[OUTREACH]", err);
    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 502 });
  }
}
