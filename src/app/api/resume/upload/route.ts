import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { scoreResumeQuality } from "@/lib/ats";
import { extractResumeText } from "@/lib/resume-parser";
import { getStorage, originalResumeKey } from "@/lib/storage";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const textContent = (formData.get("content") as string | null) ?? "";

  if (!file && !textContent) {
    return NextResponse.json({ error: "No file or content provided" }, { status: 400 });
  }

  const storage = getStorage();
  let content = textContent;
  let fileName = (formData.get("fileName") as string) || "resume.txt";
  let filePath: string | null = null;

  if (file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    fileName = file.name;

    // Store the original under a scalable, per-user key. We keep previous
    // originals (they remain in the saved-resumes history below), so we do NOT
    // delete the old file here.
    const key = originalResumeKey(session.user.id, file.name);
    await storage.put(key, buffer, file.type || "application/octet-stream");
    filePath = key;

    // Extract text from PDF/DOCX/plain-text so ATS scoring has real content.
    const extracted = await extractResumeText(buffer, file.name, file.type);
    if (extracted) content = extracted;
  }

  const atsScore = scoreResumeQuality(content);

  const resume = await db.resume.upsert({
    where: { userId: session.user.id },
    update: { fileName, content, filePath, atsScore },
    create: { userId: session.user.id, fileName, content, filePath, atsScore },
  });

  // Record this upload in the saved-resumes history (originals + replacements).
  if (filePath) {
    await db.savedResume.create({
      data: { userId: session.user.id, name: fileName, kind: "original", storageKey: filePath, atsScore },
    });
  }

  return NextResponse.json(resume);
}
