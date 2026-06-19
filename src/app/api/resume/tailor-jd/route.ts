import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { tailorResumeStructured } from "@/lib/ai";
import { getStorage, jdTailoredKey, originalResumeKey } from "@/lib/storage";
import { resumeDocToText } from "@/types/resume";
import { scoreResumeAgainstJD, scoreResumeQuality } from "@/lib/ats";

function linkedinUrl(username: string | null): string | null {
  if (!username) return null;
  if (username.startsWith("http")) return username;
  return `https://www.linkedin.com/in/${username.replace(/^.*linkedin\.com\/in\//, "")}`;
}

/** Generate (or regenerate) a resume tailored to a pasted JD. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobDescription } = await req.json();
  if (!jobDescription || jobDescription.trim().length < 30) {
    return NextResponse.json({ error: "Please paste a fuller job description" }, { status: 400 });
  }

  const [resume, linkedin] = await Promise.all([
    db.resume.findUnique({ where: { userId: session.user.id } }),
    db.linkedAccount.findUnique({
      where: { userId_platform: { userId: session.user.id, platform: "LINKEDIN" } },
    }),
  ]);
  if (!resume?.content) {
    return NextResponse.json({ error: "Upload a resume first" }, { status: 404 });
  }

  const li = linkedin?.isActive ? linkedinUrl(linkedin.username) : null;

  try {
    const doc = await tailorResumeStructured(resume.content, jobDescription, li ?? undefined);
    // Match score of the tailored resume against the JD.
    const matchScore = scoreResumeAgainstJD(resumeDocToText(doc), jobDescription);
    return NextResponse.json({ doc, matchScore });
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

  const storage = getStorage();
  const text = resumeDocToText(doc);

  // 1. Archive the structured tailored resume.
  const key = jdTailoredKey(session.user.id, "json");
  await storage.put(key, Buffer.from(JSON.stringify(doc, null, 2), "utf-8"), "application/json");

  const record = await db.generatedResume.create({
    data: {
      userId: session.user.id,
      jobDescription: jobDescription ?? "",
      content: text,
      storageKey: key,
    },
  });

  // 2. Make this the user's CURRENT resume so it shows as latest on the page.
  const fileName = `tailored-${new Date().toISOString().slice(0, 10)}.txt`;
  const resumeKey = originalResumeKey(session.user.id, fileName);
  await storage.put(resumeKey, Buffer.from(text, "utf-8"), "text/plain");

  await db.resume.upsert({
    where: { userId: session.user.id },
    update: { fileName, content: text, filePath: resumeKey, atsScore: scoreResumeQuality(text) },
    create: { userId: session.user.id, fileName, content: text, filePath: resumeKey, atsScore: scoreResumeQuality(text) },
  });

  return NextResponse.json({ id: record.id, storageKey: key });
}
