import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { scoreResumeQuality } from "@/lib/ats";
import { extractResumeText } from "@/lib/resume-parser";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "resumes");

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const textContent = (formData.get("content") as string | null) ?? "";

  if (!file && !textContent) {
    return NextResponse.json({ error: "No file or content provided" }, { status: 400 });
  }

  let content = textContent;
  let fileName = (formData.get("fileName") as string) || "resume.txt";
  let filePath: string | null = null;

  if (file) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fileName = file.name;

    // Overwrite: remove the previously stored file so it doesn't orphan on disk.
    const existing = await db.resume.findUnique({ where: { userId: session.user.id } });
    if (existing?.filePath) {
      await unlink(path.join(process.cwd(), existing.filePath)).catch(() => {});
    }

    // Save to local folder (dev). Namespace by user id to avoid collisions.
    await mkdir(UPLOAD_DIR, { recursive: true });
    const safeName = `${session.user.id}-${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const absPath = path.join(UPLOAD_DIR, safeName);
    await writeFile(absPath, buffer);
    filePath = path.join("uploads", "resumes", safeName);

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

  return NextResponse.json(resume);
}
