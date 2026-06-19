import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { tailorResumeToJD } from "@/lib/ai";
import { getStorage, jdTailoredKey } from "@/lib/storage";

/** Generate (or regenerate) a resume tailored to a pasted JD. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobDescription } = await req.json();
  if (!jobDescription || jobDescription.trim().length < 30) {
    return NextResponse.json({ error: "Please paste a fuller job description" }, { status: 400 });
  }

  const resume = await db.resume.findUnique({ where: { userId: session.user.id } });
  if (!resume?.content) {
    return NextResponse.json({ error: "Upload a resume first" }, { status: 404 });
  }

  const tailored = await tailorResumeToJD(resume.content, jobDescription);
  return NextResponse.json({ content: tailored });
}

/** Persist a tailored resume to object storage (S3/local) + DB. */
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobDescription, content } = await req.json();
  if (!content) return NextResponse.json({ error: "Nothing to save" }, { status: 400 });

  const key = jdTailoredKey(session.user.id);
  await getStorage().put(key, Buffer.from(content, "utf-8"), "text/plain");

  const record = await db.generatedResume.create({
    data: {
      userId: session.user.id,
      jobDescription: jobDescription ?? "",
      content,
      storageKey: key,
    },
  });

  return NextResponse.json({ id: record.id, storageKey: key });
}
