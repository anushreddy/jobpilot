import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { tailorResumeStructured } from "@/lib/ai";
import { getStorage, jdTailoredKey } from "@/lib/storage";
import { resumeDocToText } from "@/types/resume";

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

  try {
    const doc = await tailorResumeStructured(resume.content, jobDescription);
    return NextResponse.json({ doc });
  } catch (err) {
    console.error("[TAILOR_JD]", err);
    return NextResponse.json({ error: "Failed to generate. Please try again." }, { status: 502 });
  }
}

/** Persist a tailored resume to object storage (S3/local) + DB. */
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobDescription, doc } = await req.json();
  if (!doc) return NextResponse.json({ error: "Nothing to save" }, { status: 400 });

  // Store both the structured JSON and a flattened text rendering.
  const text = resumeDocToText(doc);
  const key = jdTailoredKey(session.user.id, "json");
  await getStorage().put(key, Buffer.from(JSON.stringify(doc, null, 2), "utf-8"), "application/json");

  const record = await db.generatedResume.create({
    data: {
      userId: session.user.id,
      jobDescription: jobDescription ?? "",
      content: text,
      storageKey: key,
    },
  });

  return NextResponse.json({ id: record.id, storageKey: key });
}
